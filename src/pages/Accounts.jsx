
import React, { useState, useEffect } from "react";
import { Account } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Wallet, Plus, Edit, Trash2, TrendingUp, TrendingDown, Check, Loader2 } from "lucide-react"; // Added Loader2
import { motion, AnimatePresence } from "framer-motion";
import FeatureGuard from "../components/FeatureGuard";

// ✨ Ícones predefinidos para escolha rápida
const PRESET_ICONS = [
  { emoji: "💳", label: "Cartão" },
  { emoji: "🏦", label: "Banco" },
  { emoji: "💰", label: "Dinheiro" },
  { emoji: "💵", label: "Dólar" },
  { emoji: "🪙", label: "Moeda" },
  { emoji: "💎", label: "Investimento" },
  { emoji: "🏠", label: "Casa" },
  { emoji: "🚗", label: "Veículo" },
  { emoji: "📱", label: "Digital" },
  { emoji: "🎯", label: "Meta" },
  { emoji: "💼", label: "Negócio" },
  { emoji: "🌟", label: "Especial" }
];

// 🎨 Cores predefinidas bonitas
const PRESET_COLORS = [
  { color: "#a855f7", name: "Roxo" },
  { color: "#3b82f6", name: "Azul" },
  { color: "#10b981", name: "Verde" },
  { color: "#f59e0b", name: "Laranja" },
  { color: "#ef4444", name: "Vermelho" },
  { color: "#ec4899", name: "Rosa" },
  { color: "#06b6d4", name: "Ciano" },
  { color: "#8b5cf6", name: "Violeta" },
  { color: "#14b8a6", name: "Turquesa" },
  { color: "#f97316", name: "Laranja Forte" },
  { color: "#6366f1", name: "Índigo" },
  { color: "#84cc16", name: "Lima" }
];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ NOVO: Estado de submissão
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: "",
    currency: "BRL",
    color: "#a855f7",
    icon: "💳",
    is_active: true
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const accs = await Account.list("-created_date", 100);
      console.log(`✅ Contas carregadas: ${accs.length}`);
      setAccounts(accs);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
    } finally {
      setIsLoading(false);
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
      const data = {
        ...formData,
        balance: parseFloat(formData.balance)
      };

      if (editingAccount) {
        await Account.update(editingAccount.id, data);
      } else {
        await Account.create(data);
      }
      
      setShowForm(false);
      setEditingAccount(null);
      setFormData({
        name: "",
        type: "checking",
        balance: "",
        currency: "BRL",
        color: "#a855f7",
        icon: "💳",
        is_active: true
      });
      loadAccounts();
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
      alert("Erro ao salvar conta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (acc) => {
    setEditingAccount(acc);
    setFormData({
      name: acc.name,
      type: acc.type,
      balance: acc.balance.toString(),
      currency: acc.currency || "BRL",
      color: acc.color || "#a855f7",
      icon: acc.icon || "💳",
      is_active: acc.is_active !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta conta?")) return;
    
    try {
      await Account.delete(id);
      loadAccounts();
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      alert("Erro ao excluir conta");
    }
  };

  const accountTypes = {
    checking: "Conta Corrente",
    savings: "Poupança",
    credit_card: "Cartão de Crédito",
    investment: "Investimento",
    crypto: "Criptomoedas"
  };

  // 💡 Sugestões de nomes baseadas no tipo
  const getNameSuggestion = (type) => {
    const suggestions = {
      checking: "Banco Inter, Nubank, Itaú",
      savings: "Poupança Banco Inter, Poupança Nubank",
      credit_card: "Cartão Nubank, Cartão Inter",
      investment: "Tesouro Direto, Ações, Fundos",
      crypto: "Bitcoin, Ethereum, Binance"
    };
    return suggestions[type] || "";
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-purple-300">Carregando contas...</div>
      </div>
    );
  }

  return (
    <FeatureGuard pageName="Accounts">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Minhas Carteiras
              </h1>
              <p className="text-purple-300 mt-1">Gerencie suas contas e saldos</p>
            </div>
            <Button
              onClick={() => {
                setEditingAccount(null);
                setFormData({
                  name: "",
                  type: "checking",
                  balance: "",
                  currency: "BRL",
                  color: "#a855f7",
                  icon: "💳",
                  is_active: true
                });
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </div>

          {/* Total Balance */}
          <Card className="glass-card border-0 neon-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm mb-1">Saldo Total</p>
                  <p className="text-4xl font-bold text-white">
                    R$ {totalBalance.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-full bg-indigo-600/20">
                  <Wallet className="w-8 h-8 text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accounts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((acc, index) => (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-card border-0 neon-glow hover:scale-105 transition-transform">
                  <CardHeader className="border-b border-purple-900/30 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: acc.color + '20' }}
                        >
                          {acc.icon}
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{acc.name}</CardTitle>
                          <p className="text-purple-400 text-sm">{accountTypes[acc.type]}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(acc)}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4 text-purple-400" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(acc.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-300 text-sm mb-1">Saldo</p>
                        <p className={`text-2xl font-bold ${acc.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          R$ {acc.balance.toFixed(2)}
                        </p>
                      </div>
                      {acc.balance >= 0 ? (
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {accounts.length === 0 && (
            <Card className="glass-card border-0">
              <CardContent className="p-12 text-center">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <p className="text-purple-300 text-lg mb-2">Nenhuma conta cadastrada</p>
                <p className="text-purple-400 text-sm mb-6">Crie sua primeira conta para começar</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Conta
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Formulário Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="glass-card border-purple-700/50 text-white max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-[#1a1a2e] z-10 pb-4">
              <DialogTitle className="text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {editingAccount ? "✏️ Editar Conta" : "✨ Nova Conta"}
              </DialogTitle>
              <p className="text-purple-300 text-sm mt-1">
                {editingAccount ? "Atualize os dados da sua conta" : "Adicione uma nova conta para gerenciar seu dinheiro"}
              </p>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 pb-4">
              {/* Preview da Conta */}
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-6 border border-purple-700/30">
                <p className="text-purple-300 text-xs mb-3">👁️ PRÉVIA</p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-lg"
                    style={{ backgroundColor: formData.color + '40' }}
                  >
                    {formData.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-lg">
                      {formData.name || "Nome da Conta"}
                    </p>
                    <p className="text-purple-300 text-sm">{accountTypes[formData.type]}</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                      R$ {formData.balance || "0.00"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tipo da Conta */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  🏦 Tipo de Conta
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(accountTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-purple-400 mt-1">
                  💡 Ex: {getNameSuggestion(formData.type)}
                </p>
              </div>

              {/* Nome da Conta */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  ✏️ Nome da Conta *
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-purple-900/20 border-purple-700/50 text-white h-12 text-base"
                  placeholder={`Ex: ${getNameSuggestion(formData.type).split(',')[0]}`}
                />
              </div>

              {/* Saldo Inicial */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  💰 Saldo Inicial *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300 font-bold">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    required
                    className="bg-purple-900/20 border-purple-700/50 text-white h-12 text-base pl-12"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-purple-400 mt-1">
                  💡 Digite quanto dinheiro você tem nesta conta agora
                </p>
              </div>

              {/* Escolher Ícone */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-3 block">
                  🎨 Escolha um Ícone
                </Label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_ICONS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`relative p-3 rounded-lg text-2xl hover:scale-110 transition-all ${
                        formData.icon === emoji
                          ? 'bg-purple-600 shadow-lg'
                          : 'bg-purple-900/20 hover:bg-purple-900/40'
                      }`}
                      title={label}
                    >
                      {emoji}
                      {formData.icon === emoji && (
                        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Escolher Cor */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-3 block">
                  🌈 Escolha uma Cor
                </Label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_COLORS.map(({ color, name }) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className="relative p-4 rounded-lg hover:scale-110 transition-all"
                      style={{ backgroundColor: color + '60' }}
                      title={name}
                    >
                      <div
                        className="w-full h-6 rounded"
                        style={{ backgroundColor: color }}
                      />
                      {formData.color === color && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-[#1a1a2e] pb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border-purple-700 text-purple-300 h-12"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-12 text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingAccount ? "💾 Atualizar Conta" : "✨ Criar Conta"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGuard>
  );
}
