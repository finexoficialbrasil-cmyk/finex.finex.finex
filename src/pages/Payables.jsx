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
  DollarSign,
  Calendar,
  FileText,
  RepeatIcon,
  Users,
  Loader2,
  Search,
  CreditCard,
  Building2
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

export default function Payables() {
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("-created_date");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ✅ NOVO: Estado de carregamento
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ NOVO: Estado de submissão
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "payable",
    category_id: "",
    account_id: "",
    due_date: "",
    status: "pending",
    is_recurring: false,
    recurring_type: "monthly",
    is_variable_amount: false,
    variable_months_count: 1,
    notes: "",
    contact_name: "",
    contact_phone: "",
    supplier_full_name: "",
    supplier_cpf_cnpj: "",
    supplier_payment_type: "pix",
    supplier_pix_key: "",
    supplier_bank_name: "",
    supplier_bank_agency: "",
    supplier_bank_account: ""
  });
  const [variableAmounts, setVariableAmounts] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadData();
  }, [sortBy]); // ✅ Manter sortBy para preservar a funcionalidade de ordenação

  const loadData = async () => {
    setIsLoading(true); // ✅ NOVO: Inicia o carregamento
    try {
      // ✅ OTIMIZADO: Carregar com limites e em paralelo
      const [billsData, accsData, userCats, sysCats] = await Promise.all([
        Bill.list(sortBy, 10000), // ✅ LIMITE de 10000, usando o sortBy atual
        Account.list("-created_date", 5000), // ✅ LIMITE de 5000
        Category.list("-created_date", 10000), // ✅ LIMITE de 10000
        SystemCategory.list() // Sempre bom ter as categorias de sistema
      ]);

      console.log(`✅ Contas a pagar carregadas: ${billsData.length}`);

      const allCategories = [
        ...sysCats,
        ...userCats
      ];

      // Filtrar as categorias para exibir apenas as de despesa, relevante para Contas a Pagar
      setCategories(allCategories.filter(c => c.type === "expense"));

      const today = new Date();
      const payableBills = billsData.filter(b => b.type === "payable"); // Only show payables in this component

      const updatedBills = await Promise.all(
        payableBills.map(async (bill) => {
          if (bill.status === "pending" && isBefore(new Date(bill.due_date), today)) {
            return { ...bill, status: "overdue" };
          }
          return bill;
        })
      );

      setBills(updatedBills);
      setAccounts(accsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false); // ✅ NOVO: Finaliza o carregamento
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

      // ✅ NOVO: Se for recorrência com valor variável, criar múltiplas contas
      if (formData.is_recurring && formData.is_variable_amount && !editingBill) {
        const monthsCount = parseInt(formData.variable_months_count) || 1;

        if (variableAmounts.length !== monthsCount) {
          alert(`Por favor, preencha os valores para todos os ${monthsCount} meses!`);
          setIsSubmitting(false);
          return;
        }

        // Criar contas para cada mês com valores diferentes
        const startDate = new Date(formData.due_date);

        for (let i = 0; i < monthsCount; i++) {
          const monthDate = new Date(startDate);

          if (formData.recurring_type === "monthly") {
            monthDate.setMonth(monthDate.getMonth() + i);
          } else if (formData.recurring_type === "weekly") {
            monthDate.setDate(monthDate.getDate() + (i * 7));
          } else if (formData.recurring_type === "yearly") {
            monthDate.setFullYear(monthDate.getFullYear() + i);
          }

          const dueDate = monthDate.toISOString().split('T')[0];
          const amount = parseAmountBR(variableAmounts[i]);

          await Bill.create({
            ...data,
            amount: amount,
            due_date: dueDate,
            is_recurring: false, // Não criar mais recorrências automaticamente
            notes: `${data.notes || ''} (Mês ${i + 1}/${monthsCount} - Valor Variável)`.trim()
          });
        }

        alert(`✅ ${monthsCount} contas criadas com sucesso!`);
      } else {
        // Criar/atualizar normalmente
        if (editingBill) {
          await Bill.update(editingBill.id, data);
          
          // ✅ SINCRONIZAR: Atualizar transação relacionada se existir
          if (editingBill.status === "paid") {
            try {
              const relatedTransactions = await Transaction.filter({ 
                description: editingBill.description 
              });
              
              if (relatedTransactions.length > 0) {
                // Atualizar a transação mais recente relacionada
                const latestTx = relatedTransactions.sort((a, b) => 
                  new Date(b.created_date) - new Date(a.created_date)
                )[0];
                
                await Transaction.update(latestTx.id, {
                  description: data.description,
                  amount: data.amount,
                  category_id: data.category_id,
                  account_id: data.account_id,
                  date: data.due_date || latestTx.date,
                  notes: data.notes || latestTx.notes
                });
                
                console.log("✅ Transação sincronizada com a conta editada");
              }
            } catch (error) {
              console.warn("⚠️ Erro ao sincronizar transação:", error);
            }
          }
        } else {
          await Bill.create(data);
        }
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error("❌ Erro ao salvar conta:", error);
      alert("Erro ao salvar conta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingBill(null);
    setVariableAmounts([]);
    setFormData({
      description: "",
      amount: "",
      type: "payable",
      category_id: "",
      account_id: "",
      due_date: "",
      status: "pending",
      is_recurring: false,
      recurring_type: "monthly",
      is_variable_amount: false,
      variable_months_count: 1,
      notes: "",
      contact_name: "",
      contact_phone: "",
      supplier_full_name: "",
      supplier_cpf_cnpj: "",
      supplier_payment_type: "pix",
      supplier_pix_key: "",
      supplier_bank_name: "",
      supplier_bank_agency: "",
      supplier_bank_account: ""
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
      is_variable_amount: bill.is_variable_amount || false,
      variable_months_count: bill.variable_months_count || 1,
      notes: bill.notes || "",
      contact_name: bill.contact_name || "",
      contact_phone: bill.contact_phone || "",
      supplier_full_name: bill.supplier_full_name || "",
      supplier_cpf_cnpj: bill.supplier_cpf_cnpj || "",
      supplier_payment_type: bill.supplier_payment_type || "pix",
      supplier_pix_key: bill.supplier_pix_key || "",
      supplier_bank_name: bill.supplier_bank_name || "",
      supplier_bank_agency: bill.supplier_bank_agency || "",
      supplier_bank_account: bill.supplier_bank_account || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta conta?\n\n⚠️ As transações relacionadas também serão excluídas!")) {
      return;
    }

    try {
      // ✅ Buscar a conta antes de deletar
      const bill = bills.find(b => b.id === id);
      
      // ✅ Buscar transações relacionadas pela descrição
      const relatedTransactions = await Transaction.filter({ 
        description: bill?.description 
      });
      
      console.log(`🗑️ Excluindo conta a pagar e ${relatedTransactions.length} transação(ões) relacionada(s)`);
      
      // ✅ Deletar transações relacionadas
      if (relatedTransactions.length > 0) {
        await Promise.all(
          relatedTransactions.map(tx => Transaction.delete(tx.id))
        );
      }
      
      // ✅ Deletar a conta
      await Bill.delete(id);
      
      loadData();
      alert(`✅ Conta e ${relatedTransactions.length} transação(ões) excluídas!`);
    } catch (error) {
      console.error("❌ Erro ao deletar conta:", error);

      if (error.response?.status === 404) {
        alert("⚠️ Esta conta já foi excluída. Atualizando a lista...");
      } else {
        alert("❌ Erro ao excluir conta. Tente novamente.");
      }

      // Recarregar dados para sincronizar com o banco
      loadData();
    }
  };

  const handlePay = async (bill) => {
    if (!bill.account_id) {
      alert("Selecione uma conta antes de efetuar o pagamento!");
      return;
    }

    // ✅ PROTEÇÃO: Verificar se já foi pago (estado local)
    if (bill.status === "paid") {
      alert("⚠️ Esta conta já foi paga! Não é possível pagar novamente.");
      loadData();
      return;
    }

    // ✅ PROTEÇÃO: Buscar status atual do banco
    try {
      const allBills = await Bill.list(); // Fetch all bills to find the specific one
      const currentBill = allBills.find(b => b.id === bill.id);

      if (!currentBill) {
        alert("❌ Conta não encontrada! Pode ter sido excluída.");
        loadData();
        return;
      }

      if (currentBill.status === "paid") {
        alert("⚠️ Esta conta já foi paga em outro dispositivo! Não é possível pagar novamente.");
        loadData();
        return;
      }

      // ✅ NOVO: Verificar duplicação de transação
      const existingTransactions = await Transaction.filter({
        description: bill.description,
        amount: bill.amount,
        type: "expense",
        status: "completed"
      });

      // Verificar se existe transação nos últimos 5 minutos
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentDuplicate = existingTransactions.find(tx => {
        const txDate = new Date(tx.created_date);
        return txDate > fiveMinutesAgo;
      });

      if (recentDuplicate) {
        const confirmPay = confirm(
          `⚠️ ATENÇÃO: Duplicação Detectada!\n\n` +
          `Já existe uma transação igual paga recentemente:\n` +
          `📄 ${bill.description}\n` +
          `💰 R$ ${formatCurrencyBR(bill.amount)}\n` +
          `⏰ Paga há ${Math.floor((Date.now() - new Date(recentDuplicate.created_date).getTime()) / 60000)} minuto(s)\n\n` +
          `Deseja REALMENTE pagar novamente?`
        );
        
        if (!confirmPay) {
          console.log("⚠️ Pagamento cancelado pelo usuário - duplicação detectada");
          return;
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status da conta:", error);
      alert("❌ Erro ao verificar o status da conta. Tente novamente.");
      loadData();
      return;
    }

    const account = accounts.find(a => a.id === bill.account_id);
    if (!account) {
      alert("Conta não encontrada!");
      loadData();
      return;
    }

    const paymentDate = new Date().toISOString().split('T')[0];

    // Verificar saldo
    if (account.balance < bill.amount) {
      if (!confirm(`Saldo insuficiente! Saldo atual: R$ ${formatCurrencyBR(account.balance)}. Deseja continuar mesmo assim?`)) {
        return;
      }
    }

    try {
      // ✅ Atualizar conta para status "paid"
      await Bill.update(bill.id, {
        ...bill,
        status: "paid",
        payment_date: paymentDate
      });

      // ✅ Atualizar saldo
      const newBalance = account.balance - bill.amount;
      await Account.update(account.id, {
        ...account,
        balance: newBalance
      });

      // ✅ Criar transação
      await Transaction.create({
        description: bill.description,
        amount: bill.amount,
        type: "expense", // Assuming all paid bills are expenses
        category_id: bill.category_id,
        account_id: bill.account_id,
        date: paymentDate,
        status: "completed",
        notes: `Pagamento da conta: ${bill.description}`
      });

      // ✅ Se for recorrente, criar próxima conta
      if (bill.is_recurring) {
        const nextDueDate = new Date(bill.due_date);

        if (bill.recurring_type === "weekly") {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (bill.recurring_type === "monthly") {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        } else if (bill.recurring_type === "yearly") {
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        }

        await Bill.create({
          description: bill.description,
          amount: bill.amount,
          type: bill.type,
          category_id: bill.category_id,
          account_id: bill.account_id,
          due_date: nextDueDate.toISOString().split('T')[0],
          status: "pending",
          is_recurring: true,
          recurring_type: bill.recurring_type,
          notes: bill.notes,
          contact_name: bill.contact_name,
          contact_phone: bill.contact_phone
        });
      }

      // ✅ Mostrar comprovante
      const category = categories.find(c => c.id === bill.category_id);
      setReceiptData({
        bill: { ...bill, status: "paid", payment_date: paymentDate }, // Pass updated bill status
        account: { ...account, balance: newBalance }, // Pass updated account balance
        category,
        paymentDate,
        type: "payment"
      });
      setShowReceipt(true);

      // ✅ Recarregar dados após todas as operações
      loadData();
    } catch (error) {
      console.error("❌ Erro ao processar pagamento:", error);

      if (error.response?.status === 404) {
        alert("❌ Esta conta não existe mais. Atualizando a lista...");
      } else {
        alert("❌ Erro ao processar pagamento. Tente novamente.");
      }

      loadData();
    }
  };

  // ✅ FUNÇÃO CORRIGIDA: Selecionar contato da agenda
  const selectContact = async () => {
    try {
      console.log("🔍 Verificando suporte à API de Contatos...");

      // Verificar se a API está disponível
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

        setFormData({
          ...formData,
          contact_name: name,
          contact_phone: phone
        });

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

  const printReceipt = () => {
    window.print();
  };

  // Calcular totais por período
  const currentMonthBills = bills.filter(bill => {
    if (!bill.due_date) return false;
    const billMonth = bill.due_date.substring(0, 7);
    return billMonth === selectedMonth;
  });

  const filteredBills = bills.filter(bill => {
    const matchesStatus = filterStatus === "all" || bill.status === filterStatus;
    const matchesSearch = searchTerm === "" || 
      bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.supplier_full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ✅ Calcular quantidades para cada aba
  const counts = {
    all: bills.length,
    pending: bills.filter(b => b.status === "pending").length,
    overdue: bills.filter(b => b.status === "overdue").length,
    paid: currentMonthBills.filter(b => b.status === "paid").length
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || { name: "Sem categoria", color: "#666" };
  };

  const getAccountInfo = (accountId) => {
    return accounts.find(a => a.id === accountId) || { name: "Não definida" };
  };

  const getDaysUntilDue = (dueDate) => {
    // Ensure dueDate is a valid Date object
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) {
      return Infinity; // Or handle as an error / unknown state
    }
    return differenceInDays(date, new Date());
  };

  const getStatusBadge = (bill) => {
    const daysUntil = getDaysUntilDue(bill.due_date);

    if (bill.status === "paid") {
      return <Badge className="bg-green-600/20 text-green-400 border-green-600/40">Pago</Badge>;
    }
    if (bill.status === "cancelled") {
      return <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/40">Cancelado</Badge>;
    }
    if (bill.status === "overdue") {
      return <Badge className="bg-red-600/20 text-red-400 border-red-600/40">Vencido</Badge>;
    }
    if (daysUntil <= 3 && daysUntil >= 0) {
      return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/40">Vence em {daysUntil === 0 ? "hoje" : `${daysUntil}d`}</Badge>;
    }
    return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/40">Pendente</Badge>;
  };

  const totals = {
    total: bills.filter(b => b.status !== "paid" && b.status !== "cancelled").reduce((sum, b) => sum + b.amount, 0),
    overdue: bills.filter(b => b.status === "overdue").reduce((sum, b) => sum + b.amount, 0),
    monthTotal: currentMonthBills.reduce((sum, b) => sum + b.amount, 0),
    monthPending: currentMonthBills.filter(b => b.status === "pending").reduce((sum, b) => sum + b.amount, 0),
    monthPaid: currentMonthBills.filter(b => b.status === "paid").reduce((sum, b) => sum + b.amount, 0),
  };

  // ✅ NOVO: Renderização condicional para estado de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-purple-300">Carregando contas...</div>
      </div>
    );
  }

  return (
    <FeatureGuard pageName="Payables">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Contas a Pagar
              </h1>
              <p className="text-purple-300 mt-1 text-sm">Gerencie seus compromissos financeiros.</p>
            </div>
            <div className="flex gap-2">
              <ExportBillsPDF 
                bills={filteredBills} 
                categories={categories} 
                accounts={accounts}
                type="payable"
              />
              <Button
                onClick={() => setShowForm(true)}
                className="w-full md:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 neon-glow"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta a Pagar
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
                    <p className="text-2xl font-bold text-purple-400">R$ {formatCurrencyBR(totals.total)}</p>
                    <p className="text-xs text-purple-400 mt-1">{bills.filter(b => b.status !== "paid" && b.status !== "cancelled").length} conta(s)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-600/20">
                    <DollarSign className="w-6 h-6 text-purple-400" />
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
                    <p className="text-sm text-purple-300">Mês Selecionado</p>
                    <Input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      min="2020-01"
                      max="2030-12"
                      className="w-auto text-xs bg-purple-900/20 border-purple-700/50 text-white"
                    />
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
                      <span className="text-xs text-green-300">Pago:</span>
                      <span className="text-sm font-bold text-green-400">R$ {formatCurrencyBR(totals.monthPaid)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Sort */}
          <Card className="glass-card border-0 neon-glow">
            <CardHeader className="border-b border-purple-900/30">
              {/* Title and Sort Section */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <CardTitle className="text-white">Contas a Pagar</CardTitle>

                {/* ✅ NOVO: Ordenação */}
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
                  placeholder="Buscar por descrição, fornecedor ou cliente..."
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

              {/* Tabs for status filtering */}
              <div className="flex flex-col md:flex-row gap-4">
                <Tabs value={filterStatus} onValueChange={setFilterStatus} className="flex-1">
                  <TabsList className="bg-purple-900/20 w-full">
                    <TabsTrigger value="all" className="flex-1">
                      Todas
                      <Badge className="ml-2 bg-purple-600/30 text-purple-200 text-xs">{counts.all}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex-1">
                      A Vencer
                      <Badge className="ml-2 bg-yellow-600/30 text-yellow-200 text-xs">{counts.pending}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="overdue" className="flex-1">
                      Atrasadas
                      <Badge className="ml-2 bg-red-600/30 text-red-200 text-xs">{counts.overdue}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="paid" className="flex-1">
                      Pagas
                      <Badge className="ml-2 bg-green-600/30 text-green-200 text-xs">{counts.paid}</Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <AnimatePresence>
                {filteredBills.length === 0 ? (
                  <div className="text-center py-12 text-purple-300">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    <p>Nenhuma conta encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBills.map((bill, index) => {
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
                          <div className="flex items-center gap-4 flex-1 mb-2 sm:mb-0">
                            <div className="p-3 rounded-full bg-red-600/20">
                              <Receipt className="w-5 h-5 text-red-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white text-sm sm:text-base truncate">{bill.description}</p>
                                {bill.is_recurring && (
                                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/40 text-xs flex items-center gap-1">
                                    <RepeatIcon className="w-3 h-3" />
                                    {bill.recurring_type === 'weekly' ? 'Semanal' :
                                    bill.recurring_type === 'monthly' ? 'Mensal' : 'Anual'}
                                  </Badge>
                                )}
                                <Badge className={`text-xs ${
                                  bill.type === "payable"
                                    ? 'bg-red-600/20 text-red-400 border-red-600/40'
                                    : 'bg-green-600/20 text-green-400 border-green-600/40'
                                }`}>
                                  {bill.type === "payable" ? "Saída" : "Entrada"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-purple-300 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Vence: {format(new Date(bill.due_date), "dd/MM/yyyy")}
                                </span>
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
                                {getStatusBadge(bill)}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <div className="text-right w-full sm:w-auto">
                              <p className="font-bold text-lg text-red-400">
                                R$ {formatCurrencyBR(bill.amount)}
                              </p>
                              <p className="text-xs text-purple-400">{account.name}</p>
                            </div>
                            <div className="flex gap-2 justify-end w-full sm:w-auto">
                              {bill.status === "pending" || bill.status === "overdue" ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePay(bill)}
                                  className="h-8 w-8 text-green-400 hover:bg-green-900/20"
                                  title="Pagar"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(bill)}
                                className="h-8 w-8 text-purple-400"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(bill.id)}
                                className="h-8 w-8 text-red-400"
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
            <DialogHeader className="sticky top-0 bg-[#1a1a2e] z-10 pb-4">
              <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                {editingBill ? "Editar Conta" : "Nova Conta a Pagar"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pb-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-purple-200 text-sm">Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                    placeholder="Ex: Aluguel, Água, Luz..."
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

                {/* Dados do Fornecedor/Cliente */}
                <div className="space-y-3 p-4 rounded-lg bg-purple-900/10 border border-purple-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-purple-200 text-sm font-semibold">📋 Dados do Fornecedor/Cliente (Opcional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectContact}
                      className="border-purple-700 text-purple-300 hover:bg-purple-900/20"
                      disabled={isSubmitting}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Buscar na Agenda
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-purple-200 text-sm">Nome Completo</Label>
                      <Input
                        value={formData.supplier_full_name}
                        onChange={(e) => setFormData({ ...formData, supplier_full_name: e.target.value })}
                        placeholder="Nome completo do fornecedor"
                        className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-purple-200 text-sm">CPF/CNPJ</Label>
                      <Input
                        value={formData.supplier_cpf_cnpj}
                        onChange={(e) => setFormData({ ...formData, supplier_cpf_cnpj: e.target.value })}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-purple-200 text-sm">Nome para Contato</Label>
                      <Input
                        value={formData.contact_name}
                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                        placeholder="Nome do contato"
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
                    </div>
                  </div>

                  <div className="border-t border-purple-700/30 pt-3 mt-3">
                    <Label className="text-purple-200 text-sm mb-2 block flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Forma de Pagamento do Fornecedor
                    </Label>
                    <Select
                      value={formData.supplier_payment_type}
                      onValueChange={(value) => setFormData({...formData, supplier_payment_type: value})}
                    >
                      <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">💰 PIX</SelectItem>
                        <SelectItem value="bank">🏦 Transferência Bancária</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.supplier_payment_type === "pix" && (
                    <div>
                      <Label className="text-purple-200 text-sm">Chave PIX</Label>
                      <Input
                        value={formData.supplier_pix_key}
                        onChange={(e) => setFormData({ ...formData, supplier_pix_key: e.target.value })}
                        placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                        className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                      />
                    </div>
                  )}

                  {formData.supplier_payment_type === "bank" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-purple-200 text-sm">Banco</Label>
                        <Input
                          value={formData.supplier_bank_name}
                          onChange={(e) => setFormData({ ...formData, supplier_bank_name: e.target.value })}
                          placeholder="Nome do banco"
                          className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-purple-200 text-sm">Agência</Label>
                        <Input
                          value={formData.supplier_bank_agency}
                          onChange={(e) => setFormData({ ...formData, supplier_bank_agency: e.target.value })}
                          placeholder="0000"
                          className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-purple-200 text-sm">Conta</Label>
                        <Input
                          value={formData.supplier_bank_account}
                          onChange={(e) => setFormData({ ...formData, supplier_bank_account: e.target.value })}
                          placeholder="00000-0"
                          className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                        />
                      </div>
                    </div>
                  )}
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
                      {categories.filter(c => c.type === "expense").map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-purple-200 text-sm">Conta de Origem (de onde sairá o dinheiro)</Label>
                  <Select
                    value={formData.account_id}
                    onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                  >
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-1">
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} - R$ {formatCurrencyBR(acc.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-purple-400 text-xs mt-1">💡 Esta é a conta da qual o dinheiro será debitado</p>
                </div>

                {/* ✅ CAMPO DE RECORRÊNCIA */}
                <div className="border-t border-purple-700/30 pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked, is_variable_amount: false })}
                      className="w-4 h-4 rounded border-purple-700 bg-purple-900/20"
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="is_recurring" className="text-purple-200 text-sm flex items-center gap-2 cursor-pointer">
                      <RepeatIcon className="w-4 h-4 text-blue-400" />
                      Conta Recorrente
                    </Label>
                  </div>

                  {formData.is_recurring && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-purple-200 text-sm">Frequência</Label>
                        <Select
                          value={formData.recurring_type}
                          onValueChange={(value) => setFormData({ ...formData, recurring_type: value })}
                          disabled={isSubmitting}
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
                      </div>

                      {/* ✅ NOVO: Valor Variável */}
                      {!editingBill && (
                        <>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="is_variable_amount"
                              checked={formData.is_variable_amount}
                              onChange={(e) => {
                                setFormData({ ...formData, is_variable_amount: e.target.checked });
                                if (!e.target.checked) {
                                  setVariableAmounts([]);
                                }
                              }}
                              className="w-4 h-4 rounded border-purple-700 bg-purple-900/20"
                              disabled={isSubmitting}
                            />
                            <Label htmlFor="is_variable_amount" className="text-purple-200 text-sm cursor-pointer">
                              Valor Variável (cada mês valor diferente)
                            </Label>
                          </div>

                          {formData.is_variable_amount ? (
                            <>
                              <div>
                                <Label className="text-purple-200 text-sm">Quantos meses?</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="24"
                                  value={formData.variable_months_count}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || value === '0') {
                                      setFormData({ ...formData, variable_months_count: 1 });
                                      setVariableAmounts([]);
                                      return;
                                    }
                                    const count = Math.min(24, Math.max(1, parseInt(value) || 1));
                                    setFormData({ ...formData, variable_months_count: count });
                                    setVariableAmounts(Array(count).fill(''));
                                  }}
                                  onBlur={(e) => {
                                    if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                      setFormData({ ...formData, variable_months_count: 1 });
                                      setVariableAmounts(['']);
                                    }
                                  }}
                                  className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                                  disabled={isSubmitting}
                                  placeholder="1"
                                />
                                <p className="text-xs text-purple-400 mt-1">
                                  Máximo 24 meses
                                </p>
                              </div>

                              {formData.variable_months_count > 0 && (
                                <div className="bg-purple-900/10 p-4 rounded-lg border border-purple-700/30 max-h-64 overflow-y-auto">
                                  <Label className="text-purple-200 text-sm mb-3 block font-bold">
                                    💰 Valores de Cada Mês
                                  </Label>
                                  <div className="grid grid-cols-2 gap-3">
                                    {Array.from({ length: formData.variable_months_count }).map((_, index) => (
                                      <div key={index}>
                                        <Label className="text-purple-300 text-xs">Mês {index + 1}</Label>
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          value={variableAmounts[index] || ''}
                                          onChange={(e) => {
                                            let raw = e.target.value.replace(/\D/g, '');
                                            if (raw === '') {
                                              const newAmounts = [...variableAmounts];
                                              newAmounts[index] = '';
                                              setVariableAmounts(newAmounts);
                                              return;
                                            }
                                            raw = raw.slice(0, 12);
                                            const cents = parseInt(raw, 10);
                                            const formatted = (cents / 100).toLocaleString('pt-BR', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            });
                                            const newAmounts = [...variableAmounts];
                                            newAmounts[index] = formatted;
                                            setVariableAmounts(newAmounts);
                                          }}
                                          placeholder="0,00"
                                          className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                                          disabled={isSubmitting}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-purple-400">
                              ✅ Valor fixo: Após o pagamento, uma nova conta será criada automaticamente com o mesmo valor
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-purple-200 text-sm">Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-purple-900/20 border-purple-700/50 text-white mt-1 min-h-[60px]"
                    placeholder="Adicione observações (opcional)"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-[#1a1a2e] pb-2">
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
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600"
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
          <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 text-gray-800 print:shadow-none max-h-[90vh] overflow-y-auto border-2 border-purple-200/50 shadow-2xl print:max-w-full print:shadow-none print:border-0">
            <DialogHeader className="sticky top-0 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 z-10 pb-4 print:static">
              <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent font-bold print:text-purple-700">
                ✨ Comprovante de Pagamento
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
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-red-200/20 to-orange-200/20 rounded-full blur-3xl print:hidden"></div>

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

                    <p className="text-purple-700 font-bold text-lg tracking-wide mb-3 print:text-base print:mb-2">Comprovante de Pagamento</p>

                    {/* Data e Hora elegante */}
                    <div className="flex items-center justify-center gap-2 text-purple-600/70 text-sm">
                      <Calendar className="w-4 h-4 print:w-3 print:h-3" />
                      <span className="font-medium">{format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</span>
                    </div>
                  </div>

                  {/* Cantos decorativos sutis */}
                  <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-purple-300/40 rounded-tl-xl print:border-purple-300"></div>
                  <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-pink-300/40 rounded-tr-xl print:border-pink-300"></div>
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-red-300/40 rounded-bl-xl print:border-red-300"></div>
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-orange-300/40 rounded-br-xl print:border-orange-300"></div>
                </div>

                {/* Informações elegantes */}
                <div className="space-y-3 print:space-y-2">
                  {/* Descrição */}
                  <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm print:bg-white print:border-purple-200 print:shadow-none print:backdrop-blur-none print:p-3">
                    <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Descrição</p>
                    <p className="text-gray-800 font-medium print:text-black">{receiptData.bill.description}</p>
                  </div>

                  {/* Valor Pago - Destaque Glamuroso */}
                  <div className="relative p-6 rounded-2xl bg-gradient-to-br from-red-50/80 via-orange-50/80 to-pink-50/80 backdrop-blur-sm border border-red-200/50 shadow-lg overflow-hidden print:bg-red-50 print:border-red-300 print:shadow-none print:backdrop-blur-none print:p-4">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-100/20 to-orange-100/20 print:hidden"></div>
                    <div className="relative z-10">
                      <p className="text-xs text-red-700/80 mb-2 font-bold tracking-widest flex items-center gap-2 uppercase print:text-red-700">
                        <DollarSign className="w-4 h-4 print:w-3 print:h-3" />
                        Valor Pago
                      </p>
                      <p className="text-5xl font-black bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 bg-clip-text text-transparent print:text-4xl print:text-red-700">
                        R$ {formatCurrencyBR(receiptData.bill.amount)}
                      </p>
                    </div>
                    {/* Brilho decorativo */}
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-gradient-to-br from-red-200/30 to-transparent rounded-full blur-2xl print:hidden"></div>
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
                      <p className="text-xs text-purple-600/70 mb-1 font-semibold tracking-wide uppercase print:text-purple-700">Fornecedor</p>
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

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50/60 to-orange-50/60 backdrop-blur-sm border border-red-200/40 shadow-sm print:bg-red-50 print:border-red-200 print:shadow-none print:backdrop-blur-none print:p-3">
                      <p className="text-xs text-red-700/80 mb-1 font-semibold tracking-wide uppercase print:text-red-700">Pagamento</p>
                      <p className="text-red-700 font-medium print:text-black">{format(new Date(), "dd/MM/yyyy")}</p>
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
                  <div className="relative p-5 rounded-2xl bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm border border-green-200/50 shadow-md overflow-hidden print:bg-green-50 print:border-green-300 print:shadow-none print:backdrop-blur-none print:p-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-100/10 via-transparent to-emerald-100/10 print:hidden"></div>
                    <div className="relative z-10 flex items-center justify-center gap-3 print:gap-2">
                      <div className="p-2.5 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200/50 shadow-sm print:bg-green-100 print:border-green-300 print:shadow-none">
                        <Check className="w-5 h-5 text-green-600 print:w-4 print:h-4" />
                      </div>
                      <p className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent tracking-wide print:text-xl print:text-green-700">
                        PAGO
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