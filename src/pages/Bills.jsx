
import React, { useState, useEffect } from "react";
import { Bill, Account, Category, Transaction, SystemCategory } from "@/entities/all"; // Added SystemCategory
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
  X,
  Clock,
  AlertCircle,
  MessageCircle,
  Phone,
  Calendar,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
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
    notes: "",
    contact_name: "",
    contact_phone: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [billsData, accsData, userCats, sysCats] = await Promise.all([
      Bill.list("-due_date"),
      Account.list(),
      Category.list(),
      SystemCategory.list()
    ]);
    
    console.log("📊 Contas carregadas:", billsData.length);
    console.log("👤 Categorias do usuário:", userCats.length);
    console.log("🌐 Categorias do sistema:", sysCats.length);
    
    // Mesclar categorias
    const allCats = [
      ...sysCats.map(c => ({ ...c, isSystem: true })),
      ...userCats.map(c => ({ ...c, isSystem: false }))
    ];
    
    console.log("📂 Total de categorias:", allCats.length);
    
    // Update overdue bills
    const today = new Date();
    const updatedBills = await Promise.all(
      billsData.map(async (bill) => {
        if (bill.status === "pending" && isBefore(new Date(bill.due_date), today)) {
          await Bill.update(bill.id, { ...bill, status: "overdue" });
          return { ...bill, status: "overdue" };
        }
        return bill;
      })
    );
    
    setBills(updatedBills);
    setAccounts(accsData);
    setCategories(allCats); // Updated to use allCats
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    
    if (editingBill) {
      await Bill.update(editingBill.id, data);
    } else {
      await Bill.create(data);
    }
    
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingBill(null);
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
      notes: "",
      contact_name: "",
      contact_phone: ""
    });
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setFormData({
      description: bill.description,
      amount: bill.amount.toString(),
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
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
      await Bill.delete(id);
      loadData();
    }
  };

  const handlePayReceive = async (bill) => {
    if (!bill.account_id) {
      alert("Selecione uma conta antes de efetuar o pagamento/recebimento!");
      return;
    }

    const account = accounts.find(a => a.id === bill.account_id);
    if (!account) {
      alert("Conta não encontrada!");
      return;
    }

    // Update bill status
    await Bill.update(bill.id, {
      ...bill,
      status: "paid",
      payment_date: new Date().toISOString().split('T')[0]
    });

    // Update account balance
    const newBalance = bill.type === "payable" 
      ? account.balance - bill.amount 
      : account.balance + bill.amount;
    
    await Account.update(account.id, {
      ...account,
      balance: newBalance
    });

    // Create transaction
    await Transaction.create({
      description: bill.description,
      amount: bill.amount,
      type: bill.type === "payable" ? "expense" : "income",
      category_id: bill.category_id,
      account_id: bill.account_id,
      date: new Date().toISOString().split('T')[0],
      status: "completed",
      notes: `Pagamento/Recebimento da conta: ${bill.description}`
    });

    loadData();
  };

  const sendWhatsAppReminder = (bill) => {
    const message = bill.type === "payable"
      ? `Olá! Lembrete: Pagamento de *${bill.description}* no valor de *R$ ${bill.amount.toFixed(2)}* vence em ${format(new Date(bill.due_date), "dd/MM/yyyy")}.`
      : `Olá ${bill.contact_name || ""}! Cobrança: *${bill.description}* no valor de *R$ ${bill.amount.toFixed(2)}* com vencimento em ${format(new Date(bill.due_date), "dd/MM/yyyy")}. Por favor, efetue o pagamento.`;
    
    const phone = bill.contact_phone?.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredBills = bills.filter(bill => {
    const matchesType = filterType === "all" || bill.type === filterType;
    const matchesStatus = filterStatus === "all" || bill.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || { name: "Sem categoria", color: "#666" };
  };

  const getAccountInfo = (accountId) => {
    return accounts.find(a => a.id === accountId) || { name: "Não definida" };
  };

  const getDaysUntilDue = (dueDate) => {
    return differenceInDays(new Date(dueDate), new Date());
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
    if (daysUntil <= 3) {
      return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/40">Vence em {daysUntil}d</Badge>;
    }
    return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/40">Pendente</Badge>;
  };

  const totals = {
    payable: filteredBills.filter(b => b.type === "payable" && b.status === "pending").reduce((sum, b) => sum + b.amount, 0),
    receivable: filteredBills.filter(b => b.type === "receivable" && b.status === "pending").reduce((sum, b) => sum + b.amount, 0),
    overdue: filteredBills.filter(b => b.status === "overdue").reduce((sum, b) => sum + b.amount, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Contas a Pagar/Receber
            </h1>
            <p className="text-purple-300 mt-1">Gerencie seus compromissos financeiros</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 neon-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-0 neon-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300 mb-1">A Pagar</p>
                  <p className="text-2xl font-bold text-red-400">R$ {totals.payable.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-600/20">
                  <Receipt className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 neon-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300 mb-1">A Receber</p>
                  <p className="text-2xl font-bold text-green-400">R$ {totals.receivable.toFixed(2)}</p>
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
                  <p className="text-sm text-purple-300 mb-1">Vencidas</p>
                  <p className="text-2xl font-bold text-orange-400">R$ {totals.overdue.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-600/20">
                  <AlertCircle className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card border-0 neon-glow">
          <CardHeader className="border-b border-purple-900/30">
            <div className="flex flex-col md:flex-row gap-4">
              <Tabs value={filterType} onValueChange={setFilterType} className="flex-1">
                <TabsList className="bg-purple-900/20 w-full">
                  <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
                  <TabsTrigger value="payable" className="flex-1">A Pagar</TabsTrigger>
                  <TabsTrigger value="receivable" className="flex-1">A Receber</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs value={filterStatus} onValueChange={setFilterStatus} className="flex-1">
                <TabsList className="bg-purple-900/20 w-full">
                  <TabsTrigger value="all" className="flex-1">Todos Status</TabsTrigger>
                  <TabsTrigger value="pending" className="flex-1">Pendentes</TabsTrigger>
                  <TabsTrigger value="overdue" className="flex-1">Vencidas</TabsTrigger>
                  <TabsTrigger value="paid" className="flex-1">Pagas</TabsTrigger>
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
                    const daysUntil = getDaysUntilDue(bill.due_date);
                    const isPayable = bill.type === "payable";

                    return (
                      <motion.div
                        key={bill.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-center justify-between p-4 rounded-xl glass-card hover:bg-purple-900/20 transition-all ${
                          bill.status === "overdue" ? "border-l-4 border-red-500" : ""
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-full ${isPayable ? 'bg-red-600/20' : 'bg-green-600/20'}`}>
                            {isPayable ? (
                              <Receipt className="w-5 h-5 text-red-400" />
                            ) : (
                              <DollarSign className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{bill.description}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-purple-300 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Vence: {format(new Date(bill.due_date), "dd/MM/yyyy")}
                              </span>
                              {bill.contact_phone && (
                                <span className="text-xs text-purple-300 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {bill.contact_name || bill.contact_phone}
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
                              {getStatusBadge(bill)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`font-bold text-lg ${isPayable ? 'text-red-400' : 'text-green-400'}`}>
                              R$ {bill.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-purple-400">{account.name}</p>
                          </div>
                          <div className="flex gap-2">
                            {bill.status === "pending" || bill.status === "overdue" ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePayReceive(bill)}
                                  className="h-8 w-8 text-green-400 hover:bg-green-900/20"
                                  title={isPayable ? "Pagar" : "Receber"}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                {bill.contact_phone && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => sendWhatsAppReminder(bill)}
                                    className="h-8 w-8 text-green-500 hover:bg-green-900/20"
                                    title="Enviar lembrete WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
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
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              {editingBill ? "Editar Conta" : "Nova Conta"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-purple-200">Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>

              <div>
                <Label className="text-purple-200">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payable">A Pagar</SelectItem>
                    <SelectItem value="receivable">A Receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-purple-200">Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>

              <div>
                <Label className="text-purple-200">Categoria</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.type === (formData.type === "payable" ? "expense" : "income")).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-purple-200">Conta para Pagamento/Recebimento</Label>
                <Select
                  value={formData.account_id}
                  onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                >
                  <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-purple-200">Data de Vencimento</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                  className="bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>

              <div>
                <Label className="text-purple-200">Nome do Contato</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Opcional"
                  className="bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>

              <div>
                <Label className="text-purple-200">Telefone (WhatsApp)</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-purple-200">Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex-1 border-purple-700 text-purple-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600"
              >
                {editingBill ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
