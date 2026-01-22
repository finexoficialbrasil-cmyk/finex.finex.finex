import React, { useState, useEffect, useCallback } from "react";
import FeatureGuard from "../components/FeatureGuard";
import { Transaction, Account, Category, SystemCategory } from "@/entities/all";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Filter, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

// ✅ NOVA FUNÇÃO: Formatar data sem conversão de timezone
const formatDateBR = (dateString) => {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function Statement() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    accountId: "all",
    categoryId: "all",
    type: "all"
  });
  const [sortBy, setSortBy] = useState("-created_date");
  const [isLoading, setIsLoading] = useState(true);

  // Memoized loadData to avoid re-creating on every render and allow it to be a dependency
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // ✅ OTIMIZADO: Carregar com LIMITES
      const [userData, txs, accs, userCats] = await Promise.all([
        User.me(),
        Transaction.list(sortBy, 20000), // ✅ LIMITE de 20000 transações
        Account.list("-created_date", 5000), // ✅ LIMITE de 5000 contas
        Category.list("-created_date", 10000) // ✅ LIMITE de 1000 categorias
      ]);
      
      setUser(userData);
      
      console.log(`📊 Extrato carregou ${txs.length} transações (ordem: ${sortBy})`);
      
      // ✅ Tentar carregar SystemCategory com timeout
      let systemCategories = [];
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout retrieving system categories')), 5000)
        );
        systemCategories = await Promise.race([
          SystemCategory.list("-created_date", 50),
          timeoutPromise
        ]);
      } catch (err) {
        console.warn("⚠️ SystemCategory não disponível, usando apenas categorias do usuário:", err.message);
      }

      const allCategories = [...systemCategories, ...userCats];
      setTransactions(txs);
      setAccounts(accs);
      setCategories(allCategories);
    } catch (error) {
      console.error("Erro ao carregar extrato:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFilters = useCallback(() => {
    console.log(`🔍 EXTRATO - Aplicando filtros...`);
    console.log(`📅 Período: ${filters.startDate} até ${filters.endDate}`);
    console.log(`📊 Total de transações carregadas: ${transactions.length}`);
    
    let filtered = transactions.filter(tx => {
      // ✅ NOVA REGRA: Não mostrar transações excluídas no extrato
      if (tx.deleted) return false;
      
      // ✅ IMPORTANTE: Parsear data corretamente (formato YYYY-MM-DD)
      const [txYear, txMonth, txDay] = tx.date.split('-').map(Number);
      const [startYear, startMonth, startDay] = filters.startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = filters.endDate.split('-').map(Number);
      
      const txDate = new Date(txYear, txMonth - 1, txDay);
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      const matchesDate = txDate >= startDate && txDate <= endDate;
      const matchesAccount = filters.accountId === "all" || tx.account_id === filters.accountId;
      const matchesCategory = filters.categoryId === "all" || tx.category_id === filters.categoryId;
      const matchesType = filters.type === "all" || tx.type === filters.type;
      const matchesStatus = tx.status === "completed"; // ✅ APENAS COMPLETADAS (igual Dashboard)
      
      return matchesDate && matchesAccount && matchesCategory && matchesType && matchesStatus;
    });
    
    console.log(`✅ Transações filtradas: ${filtered.length}`);
    setFilteredTransactions(filtered);
  }, [transactions, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const calculateTotals = () => {
    // ✅ USAR MESMA LÓGICA DO DASHBOARD
    const income = filteredTransactions
      .filter(t => t.type === "income" && t.status === "completed") // ✅ APENAS COMPLETADAS
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === "expense" && t.status === "completed") // ✅ APENAS COMPLETADAS
      .reduce((sum, t) => sum + t.amount, 0);
    
    console.log(`📊 Extrato - Transações filtradas:`, filteredTransactions.length);
    console.log(`💰 Entradas: R$ ${income.toFixed(2)}`);
    console.log(`💸 Saídas: R$ ${expense.toFixed(2)}`);
    
    return { income, expense, balance: income - expense };
  };

  const exportToPDF = () => {
    const totals = calculateTotals();
    
    // Create HTML content for PDF
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Extrato Financeiro - FINEX</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #a855f7;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #a855f7;
            margin: 0;
            font-size: 32px;
          }
          .header p {
            color: #666;
            margin: 5px 0;
          }
          .header img {
            width: 80px;
            height: 80px;
            margin-bottom: 10px;
          }
          .info-section {
            margin-bottom: 30px;
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #666;
          }
          .totals {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          .total-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
          }
          .total-card.income {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }
          .total-card.expense {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }
          .total-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .total-card p {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          th {
            background: #a855f7;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 12px 15px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:hover {
            background: #f9f9f9;
          }
          .income-amount {
            color: #10b981;
            font-weight: bold;
          }
          .expense-amount {
            color: #ef4444;
            font-weight: bold;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${user?.avatar_url ? `<img src="${user.avatar_url}" alt="${user.full_name || 'Usuario'}" style="border-radius: 50%; object-fit: cover;" />` : `
          <div style="width: 80px; height: 80px; margin: 0 auto 10px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold; color: white;">
            ${(user?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          `}
          <h1>${user?.full_name || 'Usuario'}</h1>
          <p>Extrato Financeiro Detalhado</p>
          <p>Gerado em: ${formatDateBR(new Date().toISOString().split('T')[0])} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div class="info-section">
          <h2 style="margin-top: 0; color: #a855f7;">Informacoes do Periodo</h2>
          <div class="info-row">
            <span class="info-label">Periodo:</span>
            <span>${formatDateBR(filters.startDate)} ate ${formatDateBR(filters.endDate)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total de Transacoes:</span>
            <span>${filteredTransactions.length}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Conta:</span>
            <span>${filters.accountId === "all" ? "Todas as contas" : accounts.find(a => a.id === filters.accountId)?.name || "-"}</span>
          </div>
        </div>

        <div class="totals">
          <div class="total-card income">
            <h3>ENTRADAS TOTAIS</h3>
            <p>R$ ${totals.income.toFixed(2)}</p>
          </div>
          <div class="total-card expense">
            <h3>SAIDAS TOTAIS</h3>
            <p>R$ ${totals.expense.toFixed(2)}</p>
          </div>
          <div class="total-card">
            <h3>SALDO DO PERIODO</h3>
            <p>R$ ${totals.balance.toFixed(2)}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descricao</th>
              <th>Categoria</th>
              <th>Conta</th>
              <th>Tipo</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map(tx => {
              const category = categories.find(c => c.id === tx.category_id);
              const account = accounts.find(a => a.id === tx.account_id);
              const isIncome = tx.type === "income";
              
              return `
                <tr>
                  <td>${formatDateBR(tx.date)}</td>
                  <td>${tx.description}</td>
                  <td><span class="badge" style="background: ${category?.color}20; color: ${category?.color};">${category?.name || "Sem categoria"}</span></td>
                  <td>${account?.name || "-"}</td>
                  <td>${isIncome ? "Entrada" : "Saida"}</td>
                  <td class="${isIncome ? "income-amount" : "expense-amount"}">
                    ${isIncome ? "+" : "-"} R$ ${tx.amount.toFixed(2)}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>FINEX - Sistema Financeiro Inteligente</strong></p>
          <p>Este documento foi gerado automaticamente pelo sistema FINEX</p>
          <p>Para duvidas ou suporte, entre em contato atraves do aplicativo</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print();
    };
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || { name: "Sem categoria", color: "#666" };
  };

  const getAccountInfo = (accountId) => {
    return accounts.find(a => a.id === accountId) || { name: "-" };
  };

  const totals = calculateTotals();

  return (
    <FeatureGuard pageName="Statement">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Extrato Financeiro
              </h1>
              <p className="text-purple-300 mt-1">Análise completa das suas movimentações</p>
            </div>
            <Button
              onClick={exportToPDF}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 neon-glow"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card border-0 neon-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-300 mb-1">Entradas</p>
                       <p className="text-2xl font-bold text-green-400">R$ {totals.income.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-600/20">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card border-0 neon-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-300 mb-1">Saídas</p>
                      <p className="text-2xl font-bold text-red-400">R$ {totals.expense.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-600/20">
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card border-0 neon-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-300 mb-1">Saldo do Período</p>
                      <p className={`text-2xl font-bold ${totals.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                        R$ {totals.balance.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-600/20">
                      <DollarSign className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filters */}
          <Card className="glass-card border-0 neon-glow">
            <CardHeader className="border-b border-purple-900/30">
              <CardTitle className="flex items-center gap-2 text-white">
                <Filter className="w-5 h-5 text-purple-400" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                
                {/* ✅ NOVO: Ordenação */}
                <div>
                  <Label className="text-purple-200">Ordenar por</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-1">
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

                <div>
                  <Label className="text-purple-200">Data Inicial</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="bg-purple-900/20 border-purple-700/50 text-white"
                  />
                </div>
                <div>
                  <Label className="text-purple-200">Data Final</Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="bg-purple-900/20 border-purple-700/50 text-white"
                  />
                </div>
                <div>
                  <Label className="text-purple-200">Conta</Label>
                  <Select
                    value={filters.accountId}
                    onValueChange={(value) => setFilters({ ...filters, accountId: value })}
                  >
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as contas</SelectItem>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-purple-200">Categoria</Label>
                  <Select
                    value={filters.categoryId}
                    onValueChange={(value) => setFilters({ ...filters, categoryId: value })}
                  >
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-purple-200">Tipo</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters({ ...filters, type: value })}
                  >
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="income">Entradas</SelectItem>
                      <SelectItem value="expense">Saídas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="glass-card border-0 neon-glow">
            <CardHeader className="border-b border-purple-900/30">
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5 text-indigo-400" />
                Movimentações ({filteredTransactions.length})
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-purple-300">
                        Carregando transações...
                      </TableCell>
                    </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-purple-300">
                          Nenhuma transação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((tx) => {
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
                              {isIncome ? "+" : "-"} R$ {tx.amount.toFixed(2)}
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
      </div>
    </FeatureGuard>
  );
}