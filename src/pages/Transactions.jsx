
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
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SubscriptionGuard from "../components/SubscriptionGuard";
import FeatureGuard from "../components/FeatureGuard"; // Added import

// ✅ NOVA FUNÇÃO: Obter data local sem problema de timezone
const getTodayLocal = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // NEW: Filter by status
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("-created_date"); // NEW: Default sorting by latest creation date
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense",
    category_id: "",
    account_id: "",
    date: getTodayLocal(), // ✅ CORRIGIDO
    status: "completed",
    notes: ""
  });

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
    try {
      console.log("🔄 Carregando transações com ordenação:", sortBy);

      const [txs, accs, userCats, sysCats] = await Promise.all([
        Transaction.list(sortBy, 100), // ✅ Limitar a 100 transações inicialmente
        Account.list(),
        Category.list(),
        SystemCategory.list()
      ]);

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
    }
  }, [sortBy]); // Dependency array for useCallback

  // Load data initially and when sortBy changes
  useEffect(() => {
    loadData();
  }, [loadData]); // loadData is a dependency because it's wrapped in useCallback

  // Handle URL parameters for initial form state
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }
    const type = urlParams.get('type');
    if (type === 'income' || type === 'expense') {
      setFormData(prev => ({ ...prev, type }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    let oldAccountId = null;

    if (editingTransaction) {
      oldAccountId = editingTransaction.account_id;
      await Transaction.update(editingTransaction.id, data);
    } else {
      await Transaction.create(data);
    }
    
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
      date: getTodayLocal(), // ✅ CORRIGIDO
      status: "completed",
      notes: ""
    });
    loadData(); // Reload data after submission
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

  // ✅ Memoizar transações filtradas
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesType = filterType === "all" || tx.type === filterType;
      const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [transactions, filterType, filterStatus, searchTerm]);

  // ✅ Memoizar funções auxiliares
  const getCategoryInfo = useCallback((categoryId) => {
    return categories.find(c => c.id === categoryId) || { name: "Sem categoria", color: "#666" };
  }, [categories]);

  const getAccountInfo = useCallback((accountId) => {
    return accounts.find(a => a.id === accountId) || { name: "Conta" };
  }, [accounts]);

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

            <Card className="glass-card border-0 neon-glow">
              <CardHeader className="border-b border-purple-900/30 p-4">
                <div className="flex flex-col gap-4">
                  {/* NEW: Sorting bar */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <CardTitle className="text-white">Todas as Transações</CardTitle>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <Label className="text-purple-300 text-sm flex-shrink-0">Ordenar por:</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px] sm:w-[200px] bg-purple-900/20 border-purple-700/50 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-created_date">🆕 Mais Recente</SelectItem>
                          <SelectItem value="created_date">⏰ Mais Antigo</SelectItem>
                          <SelectItem value="-amount">💰 Maior Valor</SelectItem>
                          <SelectItem value="amount">💵 Menor Valor</SelectItem>
                          <SelectItem value="description">🔤 A-Z</SelectItem>
                          <SelectItem value="-description">🔠 Z-A</SelectItem>
                          <SelectItem value="-date">📅 Data Mais Recente</SelectItem>
                          <SelectItem value="date">📆 Data Mais Antiga</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar transações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-purple-900/20 border-purple-700/50 text-white"
                    />
                  </div>
                  <Tabs value={filterType} onValueChange={setFilterType} className="w-full">
                    <TabsList className="bg-purple-900/20 w-full grid grid-cols-3">
                      <TabsTrigger value="all" className="text-xs sm:text-sm">Todas</TabsTrigger>
                      <TabsTrigger value="income" className="text-xs sm:text-sm">Entradas</TabsTrigger>
                      <TabsTrigger value="expense" className="text-xs sm:text-sm">Saídas</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <AnimatePresence>
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-purple-300">
                      Nenhuma transação encontrada
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTransactions.map((tx, index) => {
                        const category = getCategoryInfo(tx.category_id);
                        const account = getAccountInfo(tx.account_id);
                        const isIncome = tx.type === "income";

                        return (
                          <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl glass-card hover:bg-purple-900/20 transition-all gap-3"
                          >
                            <div className="flex items-center gap-3 flex-1 w-full">
                              <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${isIncome ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                                {isIncome ? (
                                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                                ) : (
                                  <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white text-sm sm:text-base truncate">{tx.description}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-xs text-purple-300">
                                    {format(new Date(tx.date), "dd/MM/yyyy")}
                                  </span>
                                  <span className="text-xs text-purple-400">•</span>
                                  <span className="text-xs text-purple-300 truncate max-w-[100px]">{account.name}</span>
                                  <Badge
                                    className="text-xs"
                                    style={{
                                      backgroundColor: category.color + '20',
                                      color: category.color,
                                      borderColor: category.color + '40'
                                    }}
                                  >
                                    {category.name}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <p className={`font-bold text-base sm:text-lg ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                                {isIncome ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                              </p>
                              <div className="flex gap-2">
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
                                  onClick={() => handleDelete(tx)} // Pass full tx object
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </AnimatePresence>
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
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                      placeholder="0.00"
                    />
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
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {editingTransaction ? "Atualizar" : "Criar"}
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
