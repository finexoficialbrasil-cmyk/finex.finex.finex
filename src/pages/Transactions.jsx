import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Transaction, Account, Category, SystemCategory } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  Loader2, // Added import for Loader2
  ArrowLeftRight, // Added for empty state icon
  ChevronLeft, // Added for pagination
  ChevronRight, // Added for pagination
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SubscriptionGuard from "../components/SubscriptionGuard";
import FeatureGuard from "../components/FeatureGuard"; // Added import
import { trackPerformance } from "../components/PerformanceMonitor"; // Added import
import { TrendingUp, TrendingDown } from "lucide-react";

const formatCurrencyBR = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// ✅ NOVA FUNÇÃO: Obter data atual no timezone do Brasil
const getBrazilDate = () => {
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// ✅ NOVA FUNÇÃO: Formatar data sem conversão de timezone
const formatDateBR = (dateString) => {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // NEW: Filter by status
  const [searchQuery, setSearchQuery] = useState(""); // Renamed from searchTerm
  const [filterCategory, setFilterCategory] = useState(""); // NEW: Filter by category
  const [filterAccount, setFilterAccount] = useState("");   // NEW: Filter by account
  const [sortBy, setSortBy] = useState("-created_date"); // NEW: Default sorting by latest creation date
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ NOVO: Estado de submissão
  const [isLoading, setIsLoading] = useState(true); // ✅ NOVO: Estado de carregamento inicial
  const [currentPage, setCurrentPage] = useState(1); // ✅ NOVO: Estado para paginação
  const [itemsPerPage] = useState(2000); // 2000 itens por página

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense",
    category_id: "",
    account_id: "",
    date: getBrazilDate(), // ✅ Data inicial
    status: "completed",
    notes: ""
  });

  // ✅ NOVO: Atualizar data quando abre formulário para NOVA transação
  useEffect(() => {
    if (showForm && !editingTransaction) {
      console.log("📅 Atualizando data do formulário para:", getBrazilDate());
      setFormData(prev => ({
        ...prev,
        date: getBrazilDate() // ✅ Sempre pegar data atual do Brasil
      }));
    }
  }, [showForm, editingTransaction]);

  // ✅ NOVO: Função para recalcular e atualizar o saldo de uma conta
  const updateAccountBalance = async (accountId) => {
    if (!accountId) return;
    try {
      console.log(`🔄 Recalculando saldo para a conta: ${accountId}`);
      // Assuming Transaction.filter can take parameters like { account_id: accountId, status: 'completed' }
      const accountTransactions = await Transaction.filter({ account_id: accountId, status: 'completed' });
      
      const newBalance = accountTransactions.reduce((balance, tx) => {
        const amount = Number(tx.amount);
        if (isNaN(amount)) return balance;
        return tx.type === 'income' ? balance + amount : balance - amount;
      }, 0);

      await Account.update(accountId, { balance: parseFloat(newBalance.toFixed(2)) });
      console.log(`✅ Saldo da conta ${accountId} atualizado para: R$ ${newBalance.toFixed(2)}`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar saldo da conta ${accountId}:`, error);
    }
  };

  // ✅ Usar useCallback para funções que são passadas como props
  const loadData = useCallback(async () => {
    setIsLoading(true); // Start loading
    const startTime = performance.now();
    try {
      console.log("🔄 Carregando transações com ordenação:", sortBy);

      const [txs, accs, userCats, sysCats] = await Promise.all([
        Transaction.list(sortBy, 5000), // ✅ REDUZIDO: 1000 → 5000
        Account.list("-created_date", 2000), // ✅ LIMITE: 2000 contas
        Category.list("-created_date", 3000), // ✅ REDUZIDO: 5000 → 3000
        SystemCategory.list() // Sem limite (poucas categorias)
      ]);
      const endTime = performance.now();
      trackPerformance('api_call', 'loadTransactionsData', endTime - startTime);
      
      console.log(`📊 Total de transações carregadas: ${txs.length}`);
      console.log("📋 Primeira transação:", txs[0]?.description, "-", txs[0]?.created_date);
      console.log("📋 Última transação:", txs[txs.length - 1]?.description, "-", txs[txs.length - 1]?.created_date);

      // Merge system categories with user categories, marking their origin
      const allCategories = [
        ...sysCats.map(c => ({ ...c, isSystem: true })),
        ...userCats.map(c => ({ ...c, isSystem: false }))
      ];

      setTransactions(txs);
      setAccounts(accs);
      setCategories(allCategories);
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false); // End loading
    }
  }, [sortBy]); // Dependency array for useCallback

  // Load data initially and when sortBy changes
  useEffect(() => {
    loadData();
  }, [loadData]); // loadData is a dependency because it's wrapped in useCallback

  // Handle URL parameters for initial form state and track page load
  useEffect(() => {
    const startTime = performance.now();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }
    const type = urlParams.get('type');
    if (type === 'income' || type === 'expense') {
      setFormData(prev => ({ ...prev, type }));
    }
    const endTime = performance.now();
    trackPerformance('page_load', 'Transactions', endTime - startTime);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ BLOQUEAR cliques duplos
    if (isSubmitting) {
      console.log("⚠️ Já está processando, ignorando clique duplo");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ✅ GARANTIR que a data seja sempre a do Brasil se for nova transação
      const finalDate = editingTransaction ? formData.date : getBrazilDate();
      
      console.log("📝 Criando transação com data:", finalDate);
      
      // ✅ Converter valor BR (1.234,56) para número
      const parseAmountBR = (value) => {
        if (!value) return 0;
        let str = String(value).trim();
        if (str.includes(',') && str.includes('.')) {
          str = str.replace(/\./g, '').replace(',', '.');
        } else if (str.includes(',')) {
          str = str.replace(',', '.');
        }
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
      };

      const data = {
        ...formData,
        amount: parseAmountBR(formData.amount),
        date: finalDate // ✅ Usar data garantida
      };

      let oldAccountId = null;
      const startTime = performance.now(); // Start tracking API call for submission

      if (editingTransaction) {
        oldAccountId = editingTransaction.account_id;
        await Transaction.update(editingTransaction.id, data);
      } else {
        await Transaction.create(data);
      }
      
      const endTime = performance.now();
      trackPerformance('api_call', editingTransaction ? 'updateTransaction' : 'createTransaction', endTime - startTime);
      
      // ✅ ATUALIZAR SALDOS APÓS SUBMISSÃO
      await updateAccountBalance(data.account_id);
      if (oldAccountId && oldAccountId !== data.account_id) {
        await updateAccountBalance(oldAccountId);
      }

      setShowForm(false);
      setEditingTransaction(null);
      setFormData({
        description: "",
        amount: "",
        type: "expense",
        category_id: "",
        account_id: "",
        date: getBrazilDate(), // ✅ Resetar com data do Brasil
        status: "completed",
        notes: ""
      });
      loadData(); // Reload data after submission
    } catch (error) {
      console.error("❌ Erro ao salvar transação:", error);
      alert("Erro ao salvar transação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tx) => {
    setEditingTransaction(tx);
    setFormData({
      description: tx.description,
      amount: tx.amount.toString(),
      type: tx.type,
      category_id: tx.category_id || "",
      account_id: tx.account_id || "",
      date: tx.date,
      status: tx.status,
      notes: tx.notes || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (tx) => { // Changed from (id) to (tx) to get account_id
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      await Transaction.delete(tx.id);
      
      // ✅ ATUALIZAR SALDO APÓS EXCLUSÃO
      await updateAccountBalance(tx.account_id);

      loadData(); // Reload data after deletion
    }
  };

  // ✅ Memoizar funções auxiliares
  const getCategoryInfo = useCallback((categoryId) => {
    return categories.find(c => c.id === categoryId) || { name: "Sem categoria", color: "#666" };
  }, [categories]);

  const getAccountInfo = useCallback((accountId) => {
    return accounts.find(a => a.id === accountId) || { name: "Conta" };
  }, [accounts]);

  // ✅ NOVO: Filtrar e paginar transações
  const { paginatedTransactions, totalPages } = useMemo(() => {
    // Filtrar
    let filtered = transactions.filter(tx => {
      const matchesSearch = !searchQuery ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === "all" || tx.type === filterType;
      const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
      const matchesCategory = !filterCategory || tx.category_id === filterCategory;
      const matchesAccount = !filterAccount || tx.account_id === filterAccount;
      
      return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesAccount;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let actualSortField = sortBy;
      let direction = 'asc';
      if (sortBy.startsWith('-')) {
        actualSortField = sortBy.substring(1);
        direction = 'desc';
      }

      const compare = (valA, valB) => {
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
      };

      let result = 0;
      switch (actualSortField) {
        case 'created_date':
        case 'date':
          result = compare(new Date(a[actualSortField]), new Date(b[actualSortField]));
          break;
        case 'amount':
          result = compare(a.amount, b.amount);
          break;
        case 'description':
          result = compare(a.description.toLowerCase(), b.description.toLowerCase());
          break;
        default:
          result = 0; // No specific sort applied
      }
      return direction === 'desc' ? -result : result;
    });

    // Paginar
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    return { paginatedTransactions: paginated, totalPages };
  }, [transactions, searchQuery, filterType, filterStatus, filterCategory, filterAccount, sortBy, currentPage, itemsPerPage, getCategoryInfo]);

  // ✅ NOVO: Resetar página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus, filterCategory, filterAccount, sortBy]);

  // ✅ Calcular totais de entrada e saída
  const totals = useMemo(() => {
    const income = transactions
      .filter(tx => tx.type === 'income' && tx.status === 'completed')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    const expense = transactions
      .filter(tx => tx.type === 'expense' && tx.status === 'completed')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    return { income, expense, balance: income - expense };
  }, [transactions]);

  return (
    <FeatureGuard pageName="Transactions">
      <SubscriptionGuard requireActive={true}>
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Transações
                </h1>
                <p className="text-purple-300 mt-1 text-sm">Gerencie suas entradas e saídas</p>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 neon-glow"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </div>

            {/* Cards de Entrada e Saída */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="glass-card border-0 neon-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-300 mb-1">Entradas</p>
                      <p className="text-2xl font-bold text-green-400">R$ {formatCurrencyBR(totals.income)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-600/20">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 neon-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-300 mb-1">Saídas</p>
                      <p className="text-2xl font-bold text-red-400">R$ {formatCurrencyBR(totals.expense)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-600/20">
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-0 neon-glow">
              <CardHeader className="border-b border-purple-900/30">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Movimentações ({paginatedTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-purple-900/20 border-b border-purple-900/30">
                        <TableHead className="text-purple-200">Data</TableHead>
                        <TableHead className="text-purple-200">Descrição</TableHead>
                        <TableHead className="text-purple-200">Categoria</TableHead>
                        <TableHead className="text-purple-200">Conta</TableHead>
                        <TableHead className="text-purple-200">Tipo</TableHead>
                        <TableHead className="text-purple-200 text-right">Valor</TableHead>
                        <TableHead className="text-purple-200 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-purple-300">
                            Carregando transações...
                          </TableCell>
                        </TableRow>
                      ) : paginatedTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-purple-300">
                            Nenhuma transação encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedTransactions.map((tx) => {
                          const category = getCategoryInfo(tx.category_id);
                          const account = getAccountInfo(tx.account_id);
                          const isIncome = tx.type === "income";

                          return (
                            <TableRow key={tx.id} className="border-b border-purple-900/20 hover:bg-purple-900/10">
                              <TableCell className="text-purple-200">
                                {formatDateBR(tx.date)}
                              </TableCell>
                              <TableCell className="text-white font-medium">{tx.description}</TableCell>
                              <TableCell>
                                <Badge
                                  style={{
                                    backgroundColor: category.color + '20',
                                    color: category.color,
                                    borderColor: category.color + '40'
                                  }}
                                >
                                  {category.name}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-purple-200">{account.name}</TableCell>
                              <TableCell>
                                <Badge className={isIncome ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"}>
                                  {isIncome ? "Entrada" : "Saída"}
                                </Badge>
                              </TableCell>
                              <TableCell className={`text-right font-bold ${isIncome ? "text-green-400" : "text-red-400"}`}>
                                {isIncome ? "+" : "-"} R$ {formatCurrencyBR(tx.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(tx)}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="w-4 h-4 text-purple-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(tx)}
                                    className="h-8 w-8"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="glass-card border-purple-700/50 text-white max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader className="sticky top-0 bg-[#1a1a2e] z-10 pb-4">
                <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {editingTransaction ? "Editar Transação" : "Nova Transação"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                <div>
                  <Label className="text-purple-200 text-sm">Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                    placeholder="Ex: Salário, Aluguel..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-purple-200 text-sm">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Entrada</SelectItem>
                        <SelectItem value="expense">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                      <Label className="text-purple-200 text-sm">Valor</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300 font-bold text-sm">
                          R$
                        </span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={formData.amount}
                          onChange={(e) => {
                            // Remove tudo exceto números
                            let raw = e.target.value.replace(/\D/g, '');

                            if (raw === '') {
                              setFormData({ ...formData, amount: '' });
                              return;
                            }

                            // Limita a 12 dígitos
                            raw = raw.slice(0, 12);

                            // Converte para número e formata como moeda BR
                            const cents = parseInt(raw, 10);
                            const formatted = (cents / 100).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            });

                            setFormData({ ...formData, amount: formatted });
                          }}
                          required
                          className="bg-purple-900/20 border-purple-700/50 text-white mt-1 pl-10"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                </div>

                <div>
                  <Label className="text-purple-200 text-sm">Categoria</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-1">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.type === formData.type).map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} {cat.isSystem && "(Sistema)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-purple-200 text-sm">Conta</Label>
                  <Select
                    value={formData.account_id}
                    onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                  >
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-1">
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-purple-200 text-sm">Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-purple-200 text-sm">Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-purple-900/20 border-purple-700/50 text-white mt-1 min-h-[80px]"
                    placeholder="Adicione observações (opcional)"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-[#1a1a2e] pb-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border-purple-700 text-purple-300"
                    disabled={isSubmitting} // Disable during submission
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={isSubmitting} // Disable during submission
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      editingTransaction ? "Atualizar" : "Criar"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </SubscriptionGuard>
    </FeatureGuard>
  );
}