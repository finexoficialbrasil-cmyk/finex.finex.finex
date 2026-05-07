import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Transaction } from "@/entities/Transaction";
import { Account } from "@/entities/Account";
import { Category } from "@/entities/Category";
import { SystemCategory } from "@/entities/SystemCategory";
import { User } from "@/entities/User";
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
  Check,
  X,
  Loader2,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  AlertCircle,
  History,
  Clock,
  Calendar,
  CalendarDays,
  Mic,
  MessageCircle,
  CreditCard,
  Wallet
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
  const [showDeleted, setShowDeleted] = useState(false); // ✅ NOVO: Mostrar excluídas
  const [showEditHistory, setShowEditHistory] = useState(false); // ✅ NOVO: Mostrar histórico de edições
  const [selectedEditHistory, setSelectedEditHistory] = useState(null); // ✅ NOVO: Transação selecionada
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ NOVO: Estado de submissão
  const [isLoading, setIsLoading] = useState(true); // ✅ NOVO: Estado de carregamento inicial
  const [currentPage, setCurrentPage] = useState(1); // ✅ NOVO: Estado para paginação
  const [itemsPerPage] = useState(2000); // 2000 itens por página
  
  // ✅ NOVO: Filtros de período
  const [periodFilter, setPeriodFilter] = useState("month"); // day, week, month, all
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

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
        Transaction.list(sortBy), // ✅ SEM LIMITE
        Account.list("-created_date"), // ✅ SEM LIMITE
        Category.list("-created_date"), // ✅ SEM LIMITE
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
        
        // ✅ NOVO: Registrar histórico de edição
        const user = await User.me();
        const now = new Date().toISOString();
        
        // Buscar histórico anterior
        let editHistory = [];
        try {
          if (editingTransaction.edit_history) {
            editHistory = JSON.parse(editingTransaction.edit_history);
          }
        } catch (e) {
          editHistory = [];
        }
        
        // Adicionar nova entrada ao histórico
        editHistory.push({
          edited_at: now,
          edited_by: user.email,
          changes: {
            description: { old: editingTransaction.description, new: data.description },
            amount: { old: editingTransaction.amount, new: data.amount },
            type: { old: editingTransaction.type, new: data.type },
            category_id: { old: editingTransaction.category_id, new: data.category_id },
            account_id: { old: editingTransaction.account_id, new: data.account_id },
            date: { old: editingTransaction.date, new: data.date }
          }
        });
        
        await Transaction.update(editingTransaction.id, {
          ...data,
          edited: true,
          last_edited_at: now,
          last_edited_by: user.email,
          edit_history: JSON.stringify(editHistory)
        });
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
      try {
        const user = await User.me();
        
        // ✅ Soft delete: marcar como excluída
        await Transaction.update(tx.id, {
          ...tx,
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.email
        });
        
        // ✅ ATUALIZAR SALDO APÓS EXCLUSÃO
        await updateAccountBalance(tx.account_id);

        loadData(); // Reload data after deletion
      } catch (error) {
        console.error("Erro ao excluir transação:", error);
        alert("Erro ao excluir transação");
      }
    }
  };

  // ✅ Memoizar funções auxiliares
  const getCategoryInfo = useCallback((categoryId) => {
    return categories.find(c => c.id === categoryId) || { name: "Sem categoria", color: "#666" };
  }, [categories]);

  const getAccountInfo = useCallback((accountId) => {
    return accounts.find(a => a.id === accountId) || { name: "Conta" };
  }, [accounts]);

  // ✅ NOVO: Detectar origem da transação
  const getTransactionSource = useCallback((tx) => {
    if (!tx.notes) return { type: 'manual', label: 'Manual', icon: Wallet, color: 'purple' };
    
    const notes = tx.notes.toLowerCase();
    
    if (notes.includes('comando de voz') || notes.includes('criado por comando de voz')) {
      return { type: 'voice', label: 'Áudio', icon: Mic, color: 'cyan' };
    }
    
    if (notes.includes('whatsapp')) {
      return { type: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'green' };
    }
    
    if (notes.includes('origem: conta a pagar') || notes.includes('pagamento da conta')) {
      return { type: 'payable', label: 'Conta Pagar', icon: ArrowDownRight, color: 'red' };
    }
    
    if (notes.includes('origem: conta a receber') || notes.includes('recebimento da conta')) {
      return { type: 'receivable', label: 'Conta Receber', icon: ArrowUpRight, color: 'emerald' };
    }
    
    return { type: 'manual', label: 'Manual', icon: Wallet, color: 'purple' };
  }, []);

  // ✅ NOVO: Calcular range de datas baseado no período
  const getDateRange = useCallback(() => {
    if (periodFilter === "all") return null;
    
    const [year, month] = selectedDate.split('-').map(Number);
    
    if (periodFilter === "day") {
      return { start: selectedDate, end: selectedDate };
    }
    
    if (periodFilter === "week") {
      // Calcular semana
      const date = new Date(year, month - 1, 1);
      const dayOfWeek = date.getDay();
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return {
        start: `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`,
        end: `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`
      };
    }
    
    if (periodFilter === "month") {
      const lastDay = new Date(year, month, 0).getDate();
      return {
        start: `${year}-${String(month).padStart(2, '0')}-01`,
        end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      };
    }
    
    return null;
  }, [periodFilter, selectedDate]);

  // ✅ NOVO: Filtrar e paginar transações
  const { paginatedTransactions, totalPages, filteredTotal } = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    console.log("🔍 Filtrando transações. showDeleted:", showDeleted);
    console.log("📊 Total de transações carregadas:", transactions.length);
    console.log("🗑️ Transações com deleted=true:", transactions.filter(tx => tx.deleted).length);
    
    const dateRange = getDateRange();
    
    // Filtrar
    let filtered = transactions.filter(tx => {
      // ✅ Filtrar excluídas ou não excluídas
      if (showDeleted) {
        // Mostrar apenas excluídas do mês atual
        if (!tx.deleted) return false;
        if (!tx.deleted_at) return false;
        
        const deletedMonth = tx.deleted_at.substring(0, 7);
        if (deletedMonth !== currentMonth) return false;
        
        console.log("✅ Transação excluída encontrada:", tx.description, tx.deleted_at);
        return true;
      } else {
        // Não mostrar excluídas
        if (tx.deleted) return false;
      }
      
      // ✅ Filtrar por período
      if (dateRange && tx.date) {
        if (tx.date < dateRange.start || tx.date > dateRange.end) {
          return false;
        }
      }
      
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

    console.log("📋 Total após filtros:", filtered.length);
    
    // Paginar
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    return { paginatedTransactions: paginated, totalPages, filteredTotal: filtered.length };
  }, [transactions, searchQuery, filterType, filterStatus, filterCategory, filterAccount, sortBy, currentPage, itemsPerPage, showDeleted, getCategoryInfo, getDateRange]);

  // ✅ NOVO: Resetar página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus, filterCategory, filterAccount, sortBy, periodFilter, selectedDate]);
  
  // ✅ Funções de navegação de período
  const navigatePeriod = (direction) => {
    const [year, month] = selectedDate.split('-').map(Number);
    
    if (periodFilter === "day") {
      const date = new Date(year, month - 1, 1);
      date.setDate(date.getDate() + direction);
      setSelectedDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    } else if (periodFilter === "week") {
      const date = new Date(year, month - 1, 1);
      date.setDate(date.getDate() + (direction * 7));
      setSelectedDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    } else if (periodFilter === "month") {
      const newMonth = month + direction;
      const newDate = new Date(year, newMonth - 1, 1);
      setSelectedDate(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
    }
  };
  
  const goToToday = () => {
    const now = new Date();
    if (periodFilter === "day") {
      setSelectedDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    } else {
      setSelectedDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }
  };
  
  const getPeriodLabel = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    
    if (periodFilter === "day") {
      const date = new Date(year, month - 1, day || 1);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    
    if (periodFilter === "week") {
      const date = new Date(year, month - 1, 1);
      const dayOfWeek = date.getDay();
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${format(startOfWeek, "dd MMM", { locale: ptBR })} - ${format(endOfWeek, "dd MMM yyyy", { locale: ptBR })}`;
    }
    
    if (periodFilter === "month") {
      const date = new Date(year, month - 1, 1);
      return format(date, "MMMM 'de' yyyy", { locale: ptBR });
    }
    
    return "Histórico Completo";
  };

  // ✅ Calcular totais de entrada e saída - BASEADO NO PERÍODO SELECIONADO
  const totals = useMemo(() => {
    const dateRange = getDateRange();
    
    console.log("📊 Calculando totais para período:", periodFilter, dateRange);
    
    const periodTransactions = transactions.filter(tx => {
      if (!tx.date || tx.status !== 'completed' || tx.deleted) return false;
      
      // Se for "Histórico Completo", incluir todas
      if (periodFilter === "all") return true;
      
      // Filtrar por período
      if (dateRange && tx.date) {
        if (tx.date < dateRange.start || tx.date > dateRange.end) {
          return false;
        }
      }
      
      return true;
    });

    console.log("📊 Transações filtradas do período:", periodTransactions.length);
    
    const income = periodTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    const expense = periodTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    console.log("📊 Entradas:", income, "| Saídas:", expense);

    return { income, expense, balance: income - expense };
  }, [transactions, periodFilter, selectedDate, getDateRange]);

  const exportToPDF = () => {
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Transações - FINEX</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #a855f7; padding-bottom: 20px; }
          .header h1 { color: #a855f7; margin: 0; font-size: 32px; }
          .totals { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
          .total-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; }
          .total-card.income { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
          .total-card.expense { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
          .total-card h3 { margin: 0 0 10px 0; font-size: 14px; }
          .total-card p { margin: 0; font-size: 28px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          th { background: #a855f7; color: white; padding: 15px; text-align: left; font-weight: 600; }
          td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; }
          tr:hover { background: #f9f9f9; }
          .income-amount { color: #10b981; font-weight: bold; }
          .expense-amount { color: #ef4444; font-weight: bold; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FINEX - Transações</h1>
          <p>Gerado em: ${formatDateBR(getBrazilDate())} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div class="totals">
          <div class="total-card income">
            <h3>ENTRADAS TOTAIS</h3>
            <p>R$ ${formatCurrencyBR(totals.income)}</p>
          </div>
          <div class="total-card expense">
            <h3>SAÍDAS TOTAIS</h3>
            <p>R$ ${formatCurrencyBR(totals.expense)}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Conta</th>
              <th>Tipo</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedTransactions.map(tx => {
              const category = getCategoryInfo(tx.category_id);
              const account = getAccountInfo(tx.account_id);
              const isIncome = tx.type === "income";
              
              return `
                <tr>
                  <td>${formatDateBR(tx.date)}</td>
                  <td>${tx.description}</td>
                  <td><span class="badge" style="background: ${category?.color}20; color: ${category?.color};">${category?.name || "Sem categoria"}</span></td>
                  <td>${account?.name || "-"}</td>
                  <td>${isIncome ? "Entrada" : "Saída"}</td>
                  <td class="${isIncome ? "income-amount" : "expense-amount"}">
                    ${isIncome ? "+" : "-"} R$ ${formatCurrencyBR(tx.amount)}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.print();
    };
  };

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
              <div className="flex gap-2">
                <Button
                  onClick={exportToPDF}
                  variant="outline"
                  className="border-purple-700 text-purple-300 hover:bg-purple-900/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 neon-glow"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </div>
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
              <CardHeader className="border-b border-purple-900/30 pb-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      Movimentações ({filteredTotal})
                    </CardTitle>
                    
                    {!showDeleted && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-400">Páginas:</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8 w-8 text-purple-300"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="px-3 py-1 bg-purple-900/30 rounded-lg text-purple-200 text-sm">
                            {currentPage} / {totalPages || 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 text-purple-300"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ✅ NOVO: Filtros de Período */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={periodFilter === "day" ? "default" : "outline"}
                        onClick={() => {
                          setPeriodFilter("day");
                          const now = new Date();
                          setSelectedDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
                        }}
                        className={periodFilter === "day" 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600" 
                          : "border-purple-700/50 text-purple-300"}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Diário
                      </Button>
                      <Button
                        size="sm"
                        variant={periodFilter === "week" ? "default" : "outline"}
                        onClick={() => {
                          setPeriodFilter("week");
                          const now = new Date();
                          setSelectedDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                        }}
                        className={periodFilter === "week" 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600" 
                          : "border-purple-700/50 text-purple-300"}
                      >
                        <CalendarDays className="w-4 h-4 mr-1" />
                        Semanal
                      </Button>
                      <Button
                        size="sm"
                        variant={periodFilter === "month" ? "default" : "outline"}
                        onClick={() => {
                          setPeriodFilter("month");
                          const now = new Date();
                          setSelectedDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                        }}
                        className={periodFilter === "month" 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600" 
                          : "border-purple-700/50 text-purple-300"}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Mensal
                      </Button>
                      <Button
                        size="sm"
                        variant={periodFilter === "all" ? "default" : "outline"}
                        onClick={() => setPeriodFilter("all")}
                        className={periodFilter === "all" 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600" 
                          : "border-purple-700/50 text-purple-300"}
                      >
                        <History className="w-4 h-4 mr-1" />
                        Completo
                      </Button>
                    </div>

                    {/* ✅ Navegação de Período */}
                    {periodFilter !== "all" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigatePeriod(-1)}
                          className="text-purple-300"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex-1 text-center">
                          <p className="text-white font-semibold capitalize">{getPeriodLabel()}</p>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigatePeriod(1)}
                          className="text-purple-300"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={goToToday}
                          className="border-cyan-700/50 text-cyan-300 hover:bg-cyan-900/20"
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Hoje
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* ✅ Filtros e Busca */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {/* Busca */}
                  <div className="relative md:col-span-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <Input
                      placeholder="Buscar transações..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-purple-900/20 border-purple-700/50 text-white"
                    />
                  </div>

                  {/* Filtro Tipo */}
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="income">Entradas</SelectItem>
                      <SelectItem value="expense">Saídas</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Ordenação */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-created_date">Mais recentes</SelectItem>
                      <SelectItem value="created_date">Mais antigas</SelectItem>
                      <SelectItem value="-amount">Maior valor</SelectItem>
                      <SelectItem value="amount">Menor valor</SelectItem>
                      <SelectItem value="description">A-Z</SelectItem>
                      <SelectItem value="-description">Z-A</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro Status */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="completed">Concluídas</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="cancelled">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {/* Filtro Categoria */}
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                      <SelectValue placeholder="Filtrar por Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Todas as Categorias</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} {cat.isSystem && "(Sistema)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro Conta */}
                  <Select value={filterAccount} onValueChange={setFilterAccount}>
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                      <SelectValue placeholder="Filtrar por Conta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Todas as Contas</SelectItem>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ✅ Toggle para mostrar excluídas - VISUAL MELHORADO */}
                <div className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  showDeleted 
                    ? 'bg-gradient-to-r from-red-900/40 to-orange-900/40 border-red-500/50 shadow-lg shadow-red-500/20' 
                    : 'bg-purple-900/10 border-purple-700/30 hover:border-purple-600/50'
                }`}
                onClick={() => setShowDeleted(!showDeleted)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${showDeleted ? 'bg-red-500/20' : 'bg-purple-600/20'}`}>
                        <Trash2 className={`w-5 h-5 ${showDeleted ? 'text-red-400' : 'text-purple-400'}`} />
                      </div>
                      <div>
                        <p className={`font-semibold ${showDeleted ? 'text-red-300' : 'text-purple-200'}`}>
                          Transações Excluídas
                        </p>
                        <p className="text-xs text-purple-400">
                          {showDeleted ? 'Clique para voltar às transações normais' : 'Clique para ver as excluídas'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <div className={`relative w-14 h-7 rounded-full transition-colors ${
                      showDeleted ? 'bg-red-500' : 'bg-purple-700/50'
                    }`}>
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        showDeleted ? 'translate-x-7' : 'translate-x-0'
                      }`} />
                    </div>
                  </div>
                  
                  {showDeleted && (
                    <div className="mt-3 pt-3 border-t border-red-500/30">
                      <p className="text-xs text-red-300 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Você está visualizando apenas transações excluídas do mês atual
                      </p>
                    </div>
                  )}
                </div>
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
                        <TableHead className="text-purple-200">Origem</TableHead>
                        <TableHead className="text-purple-200 text-right">Valor</TableHead>
                        <TableHead className="text-purple-200 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-purple-300">
                            Carregando transações...
                          </TableCell>
                        </TableRow>
                      ) : paginatedTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-purple-300">
                            Nenhuma transação encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedTransactions.map((tx) => {
                          const category = getCategoryInfo(tx.category_id);
                          const account = getAccountInfo(tx.account_id);
                          const isIncome = tx.type === "income";
                          const source = getTransactionSource(tx);

                          return (
                            <TableRow key={tx.id} className="border-b border-purple-900/20 hover:bg-purple-900/10">
                             <TableCell className="text-purple-200">
                               {formatDateBR(tx.date)}
                               {tx.deleted && tx.deleted_at && (
                                 <div className="text-xs text-red-400 mt-1">
                                   🗑️ Excluída: {format(new Date(tx.deleted_at), "dd/MM/yyyy HH:mm")}
                                 </div>
                               )}
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
                              <TableCell>
                                <Badge className={`bg-${source.color}-600/20 text-${source.color}-400 border border-${source.color}-600/40 flex items-center gap-1 w-fit`}>
                                  <source.icon className="w-3 h-3" />
                                  {source.label}
                                </Badge>
                              </TableCell>
                              <TableCell className={`text-right font-bold ${isIncome ? "text-green-400" : "text-red-400"}`}>
                                {isIncome ? "+" : "-"} R$ {formatCurrencyBR(tx.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                               <div className="flex gap-2 justify-end">
                                 {!tx.deleted && (
                                   <>
                                     {tx.edited && (
                                       <Button
                                         variant="ghost"
                                         size="icon"
                                         onClick={() => {
                                           setSelectedEditHistory(tx);
                                           setShowEditHistory(true);
                                         }}
                                         className="h-8 w-8 relative group"
                                         title="Ver histórico de edições"
                                       >
                                         <History className="w-4 h-4 text-blue-400 animate-pulse" />
                                         <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></span>
                                       </Button>
                                     )}
                                     <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => { setReceiptTransaction(tx); setShowReceipt(true); }}
                                       className="h-8 w-8"
                                       title="Ver Comprovante"
                                     >
                                       <FileText className="w-4 h-4 text-green-400" />
                                     </Button>
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
                                   </>
                                 )}
                                 {tx.deleted && (
                                   <span className="text-xs text-red-400 px-2 py-1 rounded bg-red-900/20">
                                     Excluída
                                   </span>
                                 )}
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

          {/* Dialog de Comprovante */}
          <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 text-gray-800 print:shadow-none max-h-[90vh] overflow-y-auto border-2 border-purple-200/50 shadow-2xl print:max-w-full print:shadow-none print:border-0">
              <DialogHeader className="sticky top-0 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 z-10 pb-4 print:static">
                <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent font-bold print:text-purple-700">
                  ✨ Comprovante de Transação
                </DialogTitle>
              </DialogHeader>

              {receiptTransaction && (() => {
                const cat = getCategoryInfo(receiptTransaction.category_id);
                const acc = getAccountInfo(receiptTransaction.account_id);
                const isIncome = receiptTransaction.type === "income";
                return (
                  <div id="tx-receipt-content" className="space-y-4 print:space-y-3">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white/80 via-purple-50/50 to-pink-50/50 backdrop-blur-xl border border-purple-200/30 shadow-xl print:rounded-2xl print:p-6 print:bg-white print:border-purple-300 print:shadow-none print:backdrop-blur-none">
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent print:bg-purple-300"></div>
                      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-300/50 to-transparent print:bg-pink-300"></div>
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl print:hidden"></div>
                      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl print:hidden"></div>
                      <div className="text-center relative z-10">
                        <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent tracking-tight print:text-4xl print:text-purple-700 print:mb-2">
                          FINEX
                        </h1>
                        <div className="inline-block px-5 py-1.5 rounded-full bg-gradient-to-r from-purple-100/80 to-pink-100/80 border border-purple-200/50 mb-4 backdrop-blur-sm print:bg-purple-100 print:mb-3 print:backdrop-blur-none">
                          <p className="text-purple-700 font-semibold text-xs tracking-widest">INTELIGÊNCIA FINANCEIRA</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 my-4 print:my-3">
                          <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-300 print:bg-purple-300"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 print:bg-purple-500"></div>
                          <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-300 print:bg-purple-300"></div>
                        </div>
                        <p className="text-purple-700 font-bold text-lg tracking-wide mb-3 print:text-base print:mb-2">Comprovante de Transação</p>
                        <div className="flex items-center justify-center gap-2 text-purple-600/70 text-sm">
                          <Calendar className="w-4 h-4 print:w-3 print:h-3" />
                          <span className="font-medium">{format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</span>
                        </div>
                      </div>
                      <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-purple-300/40 rounded-tl-xl print:border-purple-300"></div>
                      <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-pink-300/40 rounded-tr-xl print:border-pink-300"></div>
                      <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-purple-300/40 rounded-bl-xl print:border-purple-300"></div>
                      <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-pink-300/40 rounded-br-xl print:border-pink-300"></div>
                    </div>

                    {/* Informações */}
                    <div className="space-y-3 print:space-y-2">
                      {/* Descrição */}
                      <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                        <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Descrição</p>
                        <p className="text-gray-800 font-medium print:text-black">{receiptTransaction.description}</p>
                      </div>

                      {/* Valor - Destaque */}
                      <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg overflow-hidden print:p-4 print:shadow-none print:backdrop-blur-none ${
                        isIncome
                          ? 'bg-gradient-to-br from-emerald-50/80 via-teal-50/80 to-cyan-50/80 border-emerald-200/50 print:bg-emerald-50 print:border-emerald-300'
                          : 'bg-gradient-to-br from-red-50/80 via-orange-50/80 to-pink-50/80 border-red-200/50 print:bg-red-50 print:border-red-300'
                      }`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 print:hidden"></div>
                        <div className="relative z-10">
                          <p className={`text-xs mb-2 font-bold tracking-widest flex items-center gap-2 uppercase print:text-sm ${isIncome ? 'text-emerald-700/80 print:text-emerald-700' : 'text-red-700/80 print:text-red-700'}`}>
                            <FileText className={`w-4 h-4 print:w-3 print:h-3`} />
                            {isIncome ? 'Valor Recebido' : 'Valor Pago'}
                          </p>
                          <p className={`text-5xl font-black print:text-4xl ${isIncome ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent print:text-emerald-700' : 'bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 bg-clip-text text-transparent print:text-red-700'}`}>
                            {isIncome ? '+' : '-'} R$ {formatCurrencyBR(receiptTransaction.amount)}
                          </p>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl print:hidden"></div>
                      </div>

                      {/* Grid de informações */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-2">
                        <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                          <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Data</p>
                          <p className="text-gray-800 font-medium print:text-black">{formatDateBR(receiptTransaction.date)}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                          <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Tipo</p>
                          <p className={`font-semibold print:text-black ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>{isIncome ? 'Entrada' : 'Saída'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-2">
                        <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                          <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Conta</p>
                          <p className="text-gray-800 font-medium print:text-black">{acc.name}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                          <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Categoria</p>
                          <Badge
                            className="font-semibold border print:inline-block print:px-2 print:py-1"
                            style={{ backgroundColor: cat?.color + '15', color: cat?.color, borderColor: cat?.color + '30' }}
                          >
                            {cat?.name || "Sem categoria"}
                          </Badge>
                        </div>
                      </div>

                      {receiptTransaction.notes && (
                        <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                          <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Observações</p>
                          <p className="text-gray-800 text-sm print:text-black">{receiptTransaction.notes}</p>
                        </div>
                      )}

                      {/* Status */}
                      <div className="relative p-5 rounded-2xl bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm border border-green-200/50 shadow-md overflow-hidden print:bg-green-50 print:border-green-300 print:shadow-none print:backdrop-blur-none print:p-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-100/10 via-transparent to-emerald-100/10 print:hidden"></div>
                        <div className="relative z-10 flex items-center justify-center gap-3 print:gap-2">
                          <div className="p-2.5 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200/50 shadow-sm print:bg-green-100 print:border-green-300 print:shadow-none">
                            <Check className="w-5 h-5 text-green-600 print:w-4 print:h-4" />
                          </div>
                          <p className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent tracking-wide print:text-xl print:text-green-700">
                            CONCLUÍDA
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-4 border-t border-purple-200/30 space-y-2 print:border-purple-300 print:pt-3">
                      <p className="text-sm font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent print:text-purple-700">
                        FINEX - Sistema de Inteligência Financeira
                      </p>
                      <p className="text-xs text-purple-600/60 print:text-purple-600">Comprovante gerado automaticamente</p>
                      <div className="flex items-center justify-center gap-2 mt-3 print:mt-2">
                        <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-300/50 to-transparent print:bg-purple-300"></div>
                        <p className="text-xs text-purple-500/70 font-mono tracking-wider print:text-purple-600">
                          ID: {receiptTransaction.id?.substring(0, 12).toUpperCase()}
                        </p>
                        <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-300/50 to-transparent print:bg-purple-300"></div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 pb-2 print:hidden">
                <Button onClick={() => setShowReceipt(false)} variant="outline" className="flex-1 border-purple-300/50 text-purple-700 hover:bg-purple-50">
                  Fechar
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* ✅ NOVO: Dialog de Histórico de Edições */}
          <Dialog open={showEditHistory} onOpenChange={setShowEditHistory}>
            <DialogContent className="glass-card border-purple-700/50 text-white max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="sticky top-0 bg-[#1a1a2e] z-10 pb-4">
                <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                  <History className="w-6 h-6 text-blue-400" />
                  Histórico de Edições
                </DialogTitle>
              </DialogHeader>
              
              {selectedEditHistory && (
                <div className="space-y-4 pb-4">
                  {/* Info da transação */}
                  <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-700/30">
                    <h3 className="font-semibold text-purple-200 mb-2">{selectedEditHistory.description}</h3>
                    <div className="flex items-center gap-2 text-sm text-purple-300">
                      <Clock className="w-4 h-4" />
                      <span>Última edição: {selectedEditHistory.last_edited_at ? format(new Date(selectedEditHistory.last_edited_at), "dd/MM/yyyy 'às' HH:mm") : '-'}</span>
                    </div>
                  </div>

                  {/* Histórico */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-purple-200">Alterações Realizadas:</h4>
                    
                    {(() => {
                      try {
                        const history = selectedEditHistory.edit_history ? JSON.parse(selectedEditHistory.edit_history) : [];
                        
                        if (history.length === 0) {
                          return (
                            <p className="text-sm text-purple-400">Nenhuma edição registrada</p>
                          );
                        }
                        
                        return history.slice().reverse().map((entry, index) => {
                          const changes = Object.entries(entry.changes).filter(([key, value]) => 
                            value.old !== value.new
                          );
                          
                          if (changes.length === 0) return null;
                          
                          return (
                            <div key={index} className="p-4 rounded-xl bg-blue-900/20 border border-blue-700/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-blue-300 font-semibold">
                                  Edição #{history.length - index}
                                </span>
                                <span className="text-xs text-blue-400">
                                  {format(new Date(entry.edited_at), "dd/MM/yyyy 'às' HH:mm")}
                                </span>
                              </div>
                              
                              <div className="text-xs text-blue-300">
                                Por: {entry.edited_by}
                              </div>
                              
                              <div className="space-y-2 mt-3">
                                {changes.map(([field, value]) => {
                                  const fieldNames = {
                                    description: 'Descrição',
                                    amount: 'Valor',
                                    type: 'Tipo',
                                    category_id: 'Categoria',
                                    account_id: 'Conta',
                                    date: 'Data'
                                  };
                                  
                                  let oldDisplay = value.old;
                                  let newDisplay = value.new;
                                  
                                  if (field === 'amount') {
                                    oldDisplay = `R$ ${formatCurrencyBR(value.old)}`;
                                    newDisplay = `R$ ${formatCurrencyBR(value.new)}`;
                                  } else if (field === 'type') {
                                    oldDisplay = value.old === 'income' ? 'Entrada' : 'Saída';
                                    newDisplay = value.new === 'income' ? 'Entrada' : 'Saída';
                                  } else if (field === 'category_id') {
                                    const oldCat = getCategoryInfo(value.old);
                                    const newCat = getCategoryInfo(value.new);
                                    oldDisplay = oldCat.name;
                                    newDisplay = newCat.name;
                                  } else if (field === 'account_id') {
                                    const oldAcc = getAccountInfo(value.old);
                                    const newAcc = getAccountInfo(value.new);
                                    oldDisplay = oldAcc.name;
                                    newDisplay = newAcc.name;
                                  } else if (field === 'date') {
                                    oldDisplay = formatDateBR(value.old);
                                    newDisplay = formatDateBR(value.new);
                                  }
                                  
                                  return (
                                    <div key={field} className="text-sm">
                                      <span className="text-purple-300 font-semibold">{fieldNames[field]}:</span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-1 rounded bg-red-900/30 text-red-300 line-through">
                                          {oldDisplay || '-'}
                                        </span>
                                        <span className="text-purple-400">→</span>
                                        <span className="px-2 py-1 rounded bg-green-900/30 text-green-300">
                                          {newDisplay || '-'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      } catch (e) {
                        console.error("Erro ao processar histórico:", e);
                        return <p className="text-sm text-red-400">Erro ao carregar histórico</p>;
                      }
                    })()}
                  </div>

                  <div className="flex justify-end pt-4 sticky bottom-0 bg-[#1a1a2e] pb-2">
                    <Button
                      onClick={() => setShowEditHistory(false)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </SubscriptionGuard>
    </FeatureGuard>
  );
}