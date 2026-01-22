import React, { useState, useEffect } from "react";
import FeatureGuard from "../components/FeatureGuard";
import { Bill, Account, Category, Transaction, SystemCategory } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Receipt,
  Plus,
  Edit,
  Trash2,
  Check,
  Clock,
  AlertCircle,
  Calendar,
  MessageCircle,
  Download,
  Share2,
  FileText, // Changed from Download to FileText
  RepeatIcon,
  Users,
  DollarSign,
  Loader2, // Import Loader2 for spinner
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, isBefore } from "date-fns";
import ExportBillsPDF from "../components/bills/ExportBillsPDF";

const formatCurrencyBR = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function Receivables() {
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("-created_date");
  const [searchTerm, setSearchTerm] = useState(""); // Default sort for client-side
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ NOVO: Estado de submissão
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "receivable",
    category_id: "",
    account_id: "",
    due_date: "",
    status: "pending",
    is_recurring: false,
    recurring_type: "monthly",
    notes: "",
    contact_name: "",
    contact_phone: ""
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadData();
  }, []); // Changed dependency to empty array for initial load only

  const loadData = async () => {
    setIsLoading(true); // Set loading to true
    try {
      // ✅ OTIMIZADO: Carregar com limites e em paralelo
      const [billsData, accsData, userCats, sysCats] = await Promise.all([
        Bill.list("-due_date"), // ✅ SEM LIMITE
        Account.list("-created_date"), // ✅ SEM LIMITE
        Category.list("-created_date"), // ✅ SEM LIMITE
        SystemCategory.list("-created_date") // ✅ SEM LIMITE
      ]);
      
      console.log(`✅ Contas a receber carregadas: ${billsData.length}`);
      
      const allCategories = [
        ...sysCats,
        ...userCats
      ];
      
      const receivableBills = billsData.filter(b => b.type === "receivable");
      
      const today = new Date();
      const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const updatedBills = await Promise.all(
        receivableBills.map(async (bill) => {
          if (bill.status === "pending") {
            const [year, month, day] = bill.due_date.split('-').map(Number);
            const billDate = new Date(year, month - 1, day);
            
            if (isBefore(billDate, todayLocal)) {
              // Update the status in the DB
              await Bill.update(bill.id, { ...bill, status: "overdue" });
              return { ...bill, status: "overdue" }; // Return the updated bill for local state
            }
          }
          return bill;
        })
      );
      
      setBills(updatedBills);
      setAccounts(accsData);
      setCategories(allCategories);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false); // Set loading to false regardless of success or error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ BLOQUEAR cliques duplos
    if (isSubmitting) {
      console.log("⚠️ Já está processando, ignorando clique duplo");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
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
        amount: parseAmountBR(formData.amount)
      };
      
      if (editingBill) {
        await Bill.update(editingBill.id, data);
      } else {
        await Bill.create(data);
      }
      
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
      alert("❌ Erro ao salvar conta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingBill(null);
    setFormData({
      description: "",
      amount: "",
      type: "receivable",
      category_id: "",
      account_id: "",
      due_date: "",
      status: "pending",
      is_recurring: false,
      recurring_type: "monthly",
      notes: "",
      contact_name: "",
      contact_phone: ""
    });
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setFormData({
      description: bill.description,
      amount: bill.amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      type: bill.type,
      category_id: bill.category_id || "",
      account_id: bill.account_id || "",
      due_date: bill.due_date,
      status: bill.status,
      is_recurring: bill.is_recurring || false,
      recurring_type: bill.recurring_type || "monthly",
      notes: bill.notes || "",
      contact_name: bill.contact_name || "",
      contact_phone: bill.contact_phone || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta conta?\n\n⚠️ As transações relacionadas também serão excluídas!")) {
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Buscar a conta antes de deletar
      const bill = bills.find(b => b.id === id);
      
      // ✅ Buscar transações relacionadas pela descrição
      const relatedTransactions = await Transaction.filter({ 
        description: bill?.description 
      });
      
      console.log(`🗑️ Excluindo conta a receber e ${relatedTransactions.length} transação(ões) relacionada(s)`);
      
      // ✅ Deletar transações relacionadas
      if (relatedTransactions.length > 0) {
        await Promise.all(
          relatedTransactions.map(tx => Transaction.delete(tx.id))
        );
      }
      
      // ✅ Deletar a conta
      await Bill.delete(id);
      
      await loadData(); // Reload data to reflect changes
      alert(`✅ Conta e ${relatedTransactions.length} transação(ões) excluídas!`);
    } catch (error) {
      console.error("❌ Erro ao deletar conta:", error);
      
      if (error.response?.status === 404) {
        alert("⚠️ Esta conta já foi excluída. Atualizando a lista...");
      } else {
        alert("❌ Erro ao excluir conta. Tente novamente.");
      }
      
      await loadData(); // Reload data even on error to sync state
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceive = async (bill) => {
    if (!bill.account_id) {
      alert("Selecione uma conta antes de efetuar o recebimento!");
      return;
    }

    if (bill.status === "paid") {
      alert("⚠️ Esta conta já foi recebida! Não é possível receber novamente.");
      await loadData(); // Reload data to ensure latest status
      return;
    }

    setIsLoading(true);
    try {
      const allBills = await Bill.list(); // Fetch fresh list to check current status
      const currentBill = allBills.find(b => b.id === bill.id);
      
      if (!currentBill) {
        alert("❌ Conta não encontrada! Pode ter sido excluída.");
        await loadData();
        return;
      }

      if (currentBill.status === "paid") {
        alert("⚠️ Esta conta já foi recebida em outro dispositivo! Não é possível receber novamente.");
        await loadData();
        return;
      }

      // ✅ NOVO: Verificar duplicação de transação
      const existingTransactions = await Transaction.filter({
        description: bill.description,
        amount: bill.amount,
        type: "income",
        status: "completed"
      });

      // Verificar se existe transação nos últimos 5 minutos
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentDuplicate = existingTransactions.find(tx => {
        const txDate = new Date(tx.created_date);
        return txDate > fiveMinutesAgo;
      });

      if (recentDuplicate) {
        setIsLoading(false);
        const confirmReceive = confirm(
          `⚠️ ATENÇÃO: Duplicação Detectada!\n\n` +
          `Já existe uma transação igual recebida recentemente:\n` +
          `📄 ${bill.description}\n` +
          `💰 R$ ${formatCurrencyBR(bill.amount)}\n` +
          `⏰ Recebida há ${Math.floor((Date.now() - new Date(recentDuplicate.created_date).getTime()) / 60000)} minuto(s)\n\n` +
          `Deseja REALMENTE receber novamente?`
        );
        
        if (!confirmReceive) {
          console.log("⚠️ Recebimento cancelado pelo usuário - duplicação detectada");
          return;
        }
        setIsLoading(true);
      }
    } catch (error) {
      console.error("Erro ao verificar status da conta:", error);
      alert("❌ Erro ao verificar o status da conta. Tente novamente.");
      await loadData();
      setIsLoading(false);
      return;
    }

    const account = accounts.find(a => a.id === bill.account_id);
    if (!account) {
      alert("Conta não encontrada!");
      await loadData(); // Reload data to ensure account list is fresh
      setIsLoading(false);
      return;
    }

    // Obter data atual no timezone brasileiro
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const paymentDate = `${year}-${month}-${day}`;

    try {
      await Bill.update(bill.id, {
        ...bill,
        status: "paid",
        payment_date: paymentDate
      });

      const newBalance = account.balance + bill.amount;
      await Account.update(account.id, {
        ...account,
        balance: newBalance
      });

      await Transaction.create({
        description: bill.description,
        amount: bill.amount,
        type: "income",
        category_id: bill.category_id,
        account_id: bill.account_id,
        date: paymentDate,
        status: "completed",
        notes: `Recebimento da conta: ${bill.description}`
      });

      if (bill.is_recurring) {
        const [year, month, day] = bill.due_date.split('-').map(Number);
        const nextDueDate = new Date(year, month - 1, day);
        
        if (bill.recurring_type === "weekly") {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (bill.recurring_type === "monthly") {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        } else if (bill.recurring_type === "yearly") {
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        }

        const nextYear = nextDueDate.getFullYear();
        const nextMonth = String(nextDueDate.getMonth() + 1).padStart(2, '0');
        const nextDay = String(nextDueDate.getDate()).padStart(2, '0');
        const nextDueDateStr = `${nextYear}-${nextMonth}-${nextDay}`;

        await Bill.create({
          description: bill.description,
          amount: bill.amount,
          type: bill.type,
          category_id: bill.category_id,
          account_id: bill.account_id,
          due_date: nextDueDateStr,
          status: "pending",
          is_recurring: true,
          recurring_type: bill.recurring_type,
          notes: bill.notes,
          contact_name: bill.contact_name,
          contact_phone: bill.contact_phone
        });
      }

      const category = categories.find(c => c.id === bill.category_id);
      setReceiptData({
        bill: { ...bill, status: "paid", payment_date: paymentDate },
        account: { ...account, balance: newBalance },
        category,
        paymentDate,
        type: "receipt"
      });
      setShowReceipt(true);
      
      await loadData(); // Reload data to reflect changes
    } catch (error) {
      console.error("❌ Erro ao processar recebimento:", error);
      
      if (error.response?.status === 404) {
        alert("❌ Esta conta não existe mais. Atualizando a lista...");
      } else {
        alert("❌ Erro ao processar recebimento. Tente novamente.");
      }
      
      await loadData(); // Reload data even on error to sync state
    } finally {
      setIsLoading(false);
    }
  };

  const printReceipt = () => {
    // This will trigger the browser's print dialog and apply @media print styles
    window.print(); 
  };

  const shareReceipt = async () => {
    const text = `Comprovante de Recebimento FINEX\n\n` +
      `📄 Descrição: ${receiptData.bill.description}\n` +
      `💰 Valor: R$ ${receiptData.bill.amount.toFixed(2)}\n` +
      `🏦 Conta: ${receiptData.account.name}\n` +
      `📅 Data: ${format(new Date(), "dd/MM/yyyy HH:mm")}\n` +
      `✅ Status: RECEBIDO\n\n` +
      `FINEX - Sistema de Inteligência Financeira`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Comprovante copiado para área de transferência!');
    }
  };

  const sendWhatsAppReminder = (bill) => {
    if (!bill.contact_phone) {
      alert("Adicione um telefone de contato para enviar a cobrança!");
      return;
    }

    const message = `Olá, ${bill.contact_name || 'Cliente'}, tudo bem?

Estamos passando para informar que ainda não consta o pagamento referente a: *${bill.description}*

📅 *Vencimento:* ${format(new Date(bill.due_date), "dd/MM/yyyy")}
💰 *Valor:* R$ ${bill.amount.toFixed(2)}

Se o pagamento já foi realizado, por gentileza, envie o comprovante para conferência.
Caso ainda não tenha efetuado, pedimos que realize o quanto antes para mantermos tudo certinho. 💳✨

Agradecemos pela atenção e confiança!
— *FINEX - Sistema de Inteligência Financeira*`;

    const phone = bill.contact_phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || { name: "Sem categoria", color: "#666" };
  };

  const getAccountInfo = (accountId) => {
    return accounts.find(a => a.id === accountId) || { name: "Não definida" };
  };

  const getDaysUntilDue = (dueDate) => {
    // Parse date string YYYY-MM-DD sem conversão de timezone
    const [year, month, day] = dueDate.split('-').map(Number);
    const billDate = new Date(year, month - 1, day); // Cria data no timezone local
    
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return differenceInDays(billDate, todayLocal);
  };

  const getStatusBadge = (bill) => {
    const daysUntil = getDaysUntilDue(bill.due_date);
    
    if (bill.status === "paid") {
      return <Badge className="bg-green-600/20 text-green-400 border-green-600/40">Recebido</Badge>;
    }
    if (bill.status === "cancelled") {
      return <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/40">Cancelado</Badge>;
    }
    if (bill.status === "overdue") {
      return <Badge className="bg-red-600/20 text-red-400 border-red-600/40">Atrasado</Badge>;
    }
    if (daysUntil <= 3 && bill.status !== "paid") {
      return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/40">Vence em {daysUntil}d</Badge>;
    }
    if (bill.status === "pending") {
      return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/40">Pendente</Badge>;
    }
    return null;
  };

  // Client-side filtering and sorting
  const filteredAndSortedBills = bills
    .filter(bill => {
      const matchesStatus = filterStatus === "all" || bill.status === filterStatus;
      const matchesSearch = searchTerm === "" || 
        bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // ✅ Filtrar por mês selecionado
      const billMonth = bill.due_date.substring(0, 7); // YYYY-MM
      const matchesMonth = selectedMonth === "todos" ? true : billMonth === selectedMonth;
      
      return matchesStatus && matchesSearch && matchesMonth;
    })
    .sort((a, b) => {
      const order = sortBy.startsWith('-') ? -1 : 1;
      const field = sortBy.startsWith('-') || sortBy.startsWith('+') ? sortBy.substring(1) : sortBy;

      let valA, valB;
      if (field === 'created_date' || field === 'due_date') {
        valA = new Date(a[field]);
        valB = new Date(b[field]);
      } else if (field === 'amount') {
        valA = a[field];
        valB = b[field];
      } else {
        return 0; // No specific sorting for other fields
      }

      if (valA < valB) return -1 * order;
      if (valA > valB) return 1 * order;
      return 0;
    });

  // Calcular totais por período
  const currentMonthBills = selectedMonth === "todos" 
    ? bills 
    : bills.filter(bill => {
        if (!bill.due_date) return false;
        const billMonth = bill.due_date.substring(0, 7);
        return billMonth === selectedMonth;
      });

  const totals = {
    total: bills.filter(b => b.status !== "paid" && b.status !== "cancelled").reduce((sum, b) => sum + b.amount, 0),
    overdue: bills.filter(b => b.status === "overdue").reduce((sum, b) => sum + b.amount, 0),
    monthTotal: currentMonthBills.reduce((sum, b) => sum + b.amount, 0),
    monthPending: currentMonthBills.filter(b => b.status === "pending").reduce((sum, b) => sum + b.amount, 0),
    monthReceived: currentMonthBills.filter(b => b.status === "paid").reduce((sum, b) => sum + b.amount, 0),
  };

  const selectContact = async () => {
    try {
      console.log("🔍 Verificando suporte à API de Contatos...");
      
      if (!('contacts' in navigator)) {
        alert("❌ Seu navegador não suporta acesso à agenda.\n\n✅ Funciona apenas em:\n• Chrome/Edge no Android\n• Conexão HTTPS (não funciona em localhost)\n\n💡 Digite os dados manualmente.");
        return;
      }

      console.log("✅ API de Contatos disponível!");
      
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      
      console.log("📱 Abrindo seletor de contatos...");
      const contacts = await navigator.contacts.select(props, opts);
      
      console.log("📋 Contatos selecionados:", contacts);
      
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        console.log("👤 Contato escolhido:", contact);
        
        const name = contact.name && contact.name.length > 0 ? contact.name[0] : '';
        const phone = contact.tel && contact.tel.length > 0 ? contact.tel[0] : '';
        
        console.log("✅ Nome:", name, "Telefone:", phone);
        
        if (!name && !phone) {
          alert("⚠️ Contato selecionado não tem nome ou telefone cadastrado.");
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          contact_name: name,
          contact_phone: phone
        }));
        
        alert(`✅ Contato importado com sucesso!\n\n👤 ${name}\n📞 ${phone}`);
      }
    } catch (error) {
      console.error("❌ Erro ao acessar contatos:", error);
      
      if (error.name === 'AbortError') {
        console.log("ℹ️ Usuário cancelou a seleção");
        return;
      }
      
      if (error.name === 'NotAllowedError') {
        alert("❌ Permissão negada para acessar contatos.\n\n💡 Verifique as permissões do navegador ou digite manualmente.");
        return;
      }
      
      if (error.name === 'NotSupportedError') {
        alert("❌ Funcionalidade não suportada neste navegador/dispositivo.\n\n✅ Funciona apenas em:\n• Chrome/Edge no Android\n• Conexão HTTPS segura\n\n💡 Digite os dados manualmente.");
        return;
      }
      
      alert(`❌ Erro ao acessar agenda: ${error.message}\n\n💡 Digite os dados manualmente.`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-purple-300">Carregando contas...</div>
      </div>
    );
  }

  return (
    <FeatureGuard pageName="Receivables">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Contas a Receber
              </h1>
              <p className="text-purple-300 mt-1 text-sm">Gerencie seus recebimentos</p>
            </div>
            <div className="flex gap-2">
              <ExportBillsPDF 
                bills={filteredAndSortedBills} 
                categories={categories} 
                accounts={accounts}
                type="receivable"
              />
              <Button
                onClick={() => setShowForm(true)}
                className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 neon-glow"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta a Receber
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card border-0 neon-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-300 mb-1">Saldo Pendente</p>
                    <p className="text-2xl font-bold text-green-400">R$ {formatCurrencyBR(totals.total)}</p>
                    <p className="text-xs text-green-400 mt-1">{bills.filter(b => b.status !== "paid" && b.status !== "cancelled").length} conta(s)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-600/20">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 neon-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-300 mb-1">Atrasadas</p>
                    <p className="text-2xl font-bold text-red-400">R$ {formatCurrencyBR(totals.overdue)}</p>
                    <p className="text-xs text-red-400 mt-1">{bills.filter(b => b.status === "overdue").length} conta(s)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-600/20">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 neon-glow">
              <CardContent className="p-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-purple-300">
                      {selectedMonth === "todos" ? "Todos os Meses" : "Mês Selecionado"}
                    </p>
                    {selectedMonth !== "todos" && (
                      <Input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        min="2020-01"
                        max="2030-12"
                        className="w-auto text-xs bg-purple-900/20 border-purple-700/50 text-white"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-purple-300">Total:</span>
                      <span className="text-sm font-bold text-white">R$ {formatCurrencyBR(totals.monthTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-yellow-300">Pendente:</span>
                      <span className="text-sm font-bold text-yellow-400">R$ {formatCurrencyBR(totals.monthPending)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-300">Recebido:</span>
                      <span className="text-sm font-bold text-green-400">R$ {formatCurrencyBR(totals.monthReceived)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="glass-card border-0 neon-glow">
            <CardHeader className="border-b border-purple-900/30 p-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="text-white">Contas a Receber</CardTitle>
                
                <div className="flex items-center gap-2">
                  <Label className="text-purple-300 text-sm">Ordenar:</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] bg-purple-900/20 border-purple-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-created_date">🆕 Mais Recente</SelectItem>
                      <SelectItem value="created_date">⏰ Mais Antigo</SelectItem>
                      <SelectItem value="-amount">💰 Maior Valor</SelectItem>
                      <SelectItem value="amount">💵 Menor Valor</SelectItem>
                      <SelectItem value="-due_date">📅 Vencimento (Próximo)</SelectItem>
                      <SelectItem value="due_date">📆 Vencimento (Distante)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por descrição ou cliente..."
                  className="bg-purple-900/20 border-purple-700/50 text-white h-10 pl-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* Month selector and view toggle */}
              <div className="flex items-center gap-3 mb-3">
                <Label className="text-purple-300 text-sm flex-shrink-0">Ver:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedMonth !== "todos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMonth(new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'))}
                    className="bg-green-600/30 text-green-200 border-green-600/50 hover:bg-green-600/50"
                  >
                    Mês Selecionado
                  </Button>
                  <Button
                    variant={selectedMonth === "todos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMonth("todos")}
                    className="bg-green-600/30 text-green-200 border-green-600/50 hover:bg-green-600/50"
                  >
                    Todos os Meses
                  </Button>
                </div>
              </div>

              <Tabs value={filterStatus} onValueChange={setFilterStatus} className="flex-1">
                  <TabsList className="bg-purple-900/20 w-full grid grid-cols-4">
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    <TabsTrigger value="pending">Pendentes</TabsTrigger>
                    <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
                    <TabsTrigger value="paid">Recebidas</TabsTrigger>
                  </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <AnimatePresence>
                {filteredAndSortedBills.length === 0 ? (
                  <div className="text-center py-12 text-purple-300">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    <p>Nenhuma conta encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAndSortedBills.map((bill, index) => {
                      const category = getCategoryInfo(bill.category_id);
                      const account = getAccountInfo(bill.account_id);

                      return (
                        <motion.div
                          key={bill.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.03 }}
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl glass-card hover:bg-purple-900/20 transition-all ${
                            bill.status === "overdue" ? "border-l-4 border-red-500" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 md:gap-4 flex-1 mb-3 sm:mb-0 w-full">
                            <div className="p-2 md:p-3 rounded-full bg-green-600/20 flex-shrink-0">
                              <Receipt className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white text-sm md:text-base truncate">{bill.description}</p>
                                {bill.is_recurring && (
                                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/40 text-xs flex items-center gap-1">
                                    <RepeatIcon className="w-3 h-3" />
                                    {bill.recurring_type === 'weekly' ? 'Semanal' : 
                                    bill.recurring_type === 'monthly' ? 'Mensal' : 'Anual'}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                               <span className="text-xs text-purple-300 flex items-center gap-1">
                                 <Calendar className="w-3 h-3" />
                                 Vence: {bill.due_date.split('-').reverse().join('/')}
                               </span>
                                {bill.contact_name && (
                                  <span className="text-xs text-purple-300">
                                    👤 {bill.contact_name}
                                  </span>
                                )}
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
                                <Badge className={`text-xs ${
                                  bill.type === "receivable" 
                                    ? 'bg-green-600/20 text-green-400 border-green-600/40'
                                    : 'bg-red-600/20 text-red-400 border-red-600/40'
                                }`}>
                                  {bill.type === "receivable" ? "Entrada" : "Saída"}
                                </Badge>
                                {getStatusBadge(bill)}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                            <div className="text-left sm:text-right">
                              <p className="font-bold text-base md:text-lg text-green-400">
                                R$ {bill.amount.toFixed(2)}
                              </p>
                              <p className="text-xs text-purple-400">{account.name}</p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              {bill.status === "pending" || bill.status === "overdue" ? (
                                <>
                                  {bill.contact_phone && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => sendWhatsAppReminder(bill)}
                                      className="h-8 w-8 md:h-9 md:w-9 text-green-400 hover:bg-green-900/20"
                                      title="Enviar cobrança WhatsApp"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleReceive(bill)}
                                    className="h-8 w-8 md:h-9 md:w-9 text-green-400 hover:bg-green-900/20"
                                    title="Marcar como recebido"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(bill)}
                                className="h-8 w-8 md:h-9 md:w-9 text-purple-400 hover:bg-purple-900/20"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(bill.id)}
                                className="h-8 w-8 md:h-9 md:w-9 text-red-400 hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
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

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="glass-card border-purple-700/50 text-white max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-[#1a1a2e] z-10 pb-4 -mt-6 -mx-6 px-6 pt-6">
              <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {editingBill ? "Editar Conta" : "Nova Conta a Receber"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-purple-200 text-sm">Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                    placeholder="Ex: Venda de produto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                          let raw = e.target.value.replace(/\D/g, '');
                          if (raw === '') {
                            setFormData({ ...formData, amount: '' });
                            return;
                          }
                          raw = raw.slice(0, 12);
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

                  <div>
                    <Label className="text-purple-200 text-sm">Vencimento</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => {
                        // Garantir que a data seja salva exatamente como selecionada (sem conversão de timezone)
                        const selectedDate = e.target.value; // Formato YYYY-MM-DD
                        setFormData({ ...formData, due_date: selectedDate });
                      }}
                      required
                      className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-purple-900/10 border border-purple-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-purple-200 text-sm font-semibold">Dados do Cliente</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectContact}
                      className="border-purple-700 text-purple-300 hover:bg-purple-900/20"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Buscar na Agenda
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-purple-200 text-sm">Nome do Cliente</Label>
                      <Input
                        value={formData.contact_name}
                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                        placeholder="Nome do cliente"
                        className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-purple-200 text-sm">Telefone/WhatsApp</Label>
                      <Input
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                      />
                      <p className="text-xs text-purple-400 mt-1">
                        💡 Use para enviar cobranças via WhatsApp
                      </p>
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
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.type === "income").map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-purple-200 text-sm">Conta para Recebimento</Label>
                  <Select
                    value={formData.account_id}
                    onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                  >
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} - R$ {formatCurrencyBR(acc.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* CAMPO DE RECORRÊNCIA */}
                <div className="border-t border-purple-700/30 pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                      className="w-4 h-4 rounded border-purple-700 bg-purple-900/20"
                    />
                    <Label htmlFor="is_recurring" className="text-purple-200 text-sm flex items-center gap-2 cursor-pointer">
                      <RepeatIcon className="w-4 h-4 text-blue-400" />
                      Recebimento Recorrente
                    </Label>
                  </div>
                  
                  {formData.is_recurring && (
                    <div>
                      <Label className="text-purple-200 text-sm">Frequência</Label>
                      <Select
                        value={formData.recurring_type}
                        onValueChange={(value) => setFormData({ ...formData, recurring_type: value })}
                      >
                        <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-purple-400 mt-1">
                        Após o recebimento, uma nova conta será criada automaticamente
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-purple-200 text-sm">Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                    placeholder="Observações adicionais"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-[#1a1a2e] -mb-6 -mx-6 px-6 pb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 border-purple-700 text-purple-300"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingBill ? "Atualizar" : "Criar"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 text-gray-800 max-h-[90vh] overflow-y-auto border-2 border-purple-200/50 shadow-2xl print:max-w-full print:shadow-none print:border-0">
            <DialogHeader className="sticky top-0 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 z-10 pb-4 print:static">
              <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent font-bold print:text-purple-700">
                ✨ Comprovante de Recebimento
              </DialogTitle>
            </DialogHeader>
            
            {receiptData && (
              <div id="receipt-content" className="space-y-4 print:space-y-3">
                {/* Header Glamuroso */}
                <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white/80 via-purple-50/50 to-pink-50/50 backdrop-blur-xl border border-purple-200/30 shadow-xl print:rounded-2xl print:p-6 print:bg-white print:border-purple-300 print:shadow-none print:backdrop-blur-none">
                  {/* Brilhos sutis */}
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent print:bg-purple-300"></div>
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-300/50 to-transparent print:bg-pink-300"></div>
                  
                  {/* Círculos decorativos */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl print:hidden"></div>
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-emerald-200/20 to-cyan-200/20 rounded-full blur-3xl print:hidden"></div>
                  
                  <div className="text-center relative z-10">
                    {/* Nome do App elegante */}
                    <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent tracking-tight print:text-4xl print:text-purple-700 print:mb-2">
                      FINEX
                    </h1>
                    
                    {/* Subtítulo refinado */}
                    <div className="inline-block px-5 py-1.5 rounded-full bg-gradient-to-r from-purple-100/80 to-pink-100/80 border border-purple-200/50 mb-4 backdrop-blur-sm print:bg-purple-100 print:mb-3 print:backdrop-blur-none">
                      <p className="text-purple-700 font-semibold text-xs tracking-widest">INTELIGÊNCIA FINANCEIRA</p>
                    </div>
                    
                    {/* Linha decorativa elegante */}
                    <div className="flex items-center justify-center gap-2 my-4 print:my-3">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-300 print:bg-purple-300"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 print:bg-purple-500"></div>
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-300 print:bg-purple-300"></div>
                    </div>
                    
                    <p className="text-purple-700 font-bold text-lg tracking-wide mb-3 print:text-base print:mb-2">Comprovante de Recebimento</p>
                    
                    {/* Data e Hora elegante */}
                    <div className="flex items-center justify-center gap-2 text-purple-600/70 text-sm">
                      <Calendar className="w-4 h-4 print:w-3 print:h-3" />
                      <span className="font-medium">{format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</span>
                    </div>
                  </div>

                  {/* Cantos decorativos sutis */}
                  <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-purple-300/40 rounded-tl-xl print:border-purple-300"></div>
                  <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-pink-300/40 rounded-tr-xl print:border-pink-300"></div>
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-emerald-300/40 rounded-bl-xl print:border-emerald-300"></div>
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-cyan-300/40 rounded-br-xl print:border-cyan-300"></div>
                </div>

                {/* Informações elegantes */}
                <div className="space-y-3 print:space-y-2">
                  {/* Descrição */}
                  <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                    <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Descrição</p>
                    <p className="text-gray-800 font-medium print:text-black">{receiptData.bill.description}</p>
                  </div>

                  {/* Valor Recebido - Destaque Glamuroso */}
                  <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/80 to-cyan-50/80 backdrop-blur-sm border border-emerald-200/50 shadow-lg overflow-hidden print:bg-emerald-50 print:border-emerald-300 print:shadow-none print:backdrop-blur-none print:p-4">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-100/20 to-cyan-100/20 print:hidden"></div>
                    <div className="relative z-10">
                      <p className="text-xs text-emerald-700/80 mb-2 font-bold tracking-widest flex items-center gap-2 uppercase print:text-emerald-700">
                        <DollarSign className="w-4 h-4 print:w-3 print:h-3" />
                        Valor Recebido
                      </p>
                      <p className="text-5xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent print:text-4xl print:text-emerald-700">
                        R$ {receiptData.bill.amount.toFixed(2)}
                      </p>
                    </div>
                    {/* Brilho decorativo */}
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-transparent rounded-full blur-2xl print:hidden"></div>
                  </div>

                  {/* Grid de informações */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-2">
                    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                      <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Conta</p>
                      <p className="text-gray-800 font-medium print:text-black">{receiptData.account.name}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                      <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Categoria</p>
                      <Badge
                        className="font-semibold border print:inline-block print:px-2 print:py-1"
                        style={{
                          backgroundColor: receiptData.category?.color + '15',
                          color: receiptData.category?.color,
                          borderColor: receiptData.category?.color + '30'
                        }}
                      >
                        {receiptData.category?.name || "Sem categoria"}
                      </Badge>
                    </div>
                  </div>

                  {receiptData.bill.contact_name && (
                    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                      <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Cliente</p>
                      <p className="text-gray-800 font-medium print:text-black">{receiptData.bill.contact_name}</p>
                      {receiptData.bill.contact_phone && (
                        <p className="text-sm text-gray-600 mt-1 print:text-black">📞 {receiptData.bill.contact_phone}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-2">
                    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                      <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Vencimento</p>
                      <p className="text-gray-800 font-medium print:text-black">
                        {format(new Date(receiptData.bill.due_date), "dd/MM/yyyy")}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/60 backdrop-blur-sm border border-emerald-200/40 shadow-sm print:bg-emerald-50 print:border-emerald-200 print:shadow-none print:backdrop-blur-none print:p-3">
                      <p className="text-xs text-emerald-700/80 mb-1 font-semibold tracking-wide uppercase print:text-emerald-700">Recebimento</p>
                      <p className="text-emerald-700 font-medium print:text-black">{format(new Date(), "dd/MM/yyyy")}</p>
                    </div>
                  </div>

                  {receiptData.bill.is_recurring && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/60 backdrop-blur-sm border border-blue-200/40 shadow-sm print:bg-blue-50 print:border-blue-200 print:shadow-none print:backdrop-blur-none print:p-3">
                      <p className="text-xs text-blue-700/80 mb-1 font-semibold tracking-wide uppercase print:text-blue-700">Recorrência</p>
                      <p className="text-blue-700 font-medium print:text-black">
                        {receiptData.bill.recurring_type === 'weekly' ? '📅 Semanal' :
                        receiptData.bill.recurring_type === 'monthly' ? '📅 Mensal' : '📅 Anual'}
                      </p>
                    </div>
                  )}

                  {receiptData.bill.notes && (
                    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                      <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Observações</p>
                      <p className="text-gray-800 text-sm print:text-black">{receiptData.bill.notes}</p>
                    </div>
                  )}

                  {/* Status - Glamuroso */}
                  <div className="relative p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 backdrop-blur-sm border border-emerald-200/50 shadow-md overflow-hidden print:bg-green-50 print:border-green-300 print:shadow-none print:backdrop-blur-none print:p-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/10 via-transparent to-cyan-100/10 print:hidden"></div>
                    <div className="relative z-10 flex items-center justify-center gap-3 print:gap-2">
                      <div className="p-2.5 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200/50 shadow-sm print:bg-green-100 print:border-green-300 print:shadow-none">
                        <Check className="w-5 h-5 text-emerald-600 print:w-4 print:h-4" />
                      </div>
                      <p className="text-2xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent tracking-wide print:text-xl print:text-green-700">
                        RECEBIDO
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer elegante */}
                <div className="text-center pt-4 border-t border-purple-200/30 space-y-2 print:border-purple-300 print:pt-3">
                  <p className="text-sm font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent print:text-purple-700">
                    FINEX - Sistema de Inteligência Financeira
                  </p>
                  <p className="text-xs text-purple-600/60 print:text-purple-600">
                    Comprovante gerado automaticamente
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3 print:mt-2">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-300/50 to-transparent print:bg-purple-300"></div>
                    <p className="text-xs text-purple-500/70 font-mono tracking-wider print:text-purple-600">
                      ID: {receiptData.bill.id.substring(0, 12).toUpperCase()}
                    </p>
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-300/50 to-transparent print:bg-purple-300"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Botões elegantes */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 pb-2 print:hidden">
              <Button
                onClick={() => setShowReceipt(false)}
                variant="outline"
                className="flex-1 border-purple-300/50 text-purple-700 hover:bg-purple-50"
              >
                Fechar
              </Button>
              <Button
                onClick={shareReceipt}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              <Button
                onClick={printReceipt}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md"
              >
                <FileText className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGuard>
  );
}