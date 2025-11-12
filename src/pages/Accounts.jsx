import React, { useState, useEffect } from "react";
import { Account } from "@/entities/all";
import { UploadFile } from "@/integrations/Core";
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
import { Wallet, Plus, Edit, Trash2, TrendingUp, TrendingDown, Building2, Loader2, Upload, Search, Check } from "lucide-react";
import { motion } from "framer-motion";
import FeatureGuard from "../components/FeatureGuard";

// 🎨 ÍCONES FINANCEIROS DISPONÍVEIS
const ICONES_FINANCEIROS = [
  { emoji: "💳", label: "Cartão" },
  { emoji: "🏦", label: "Banco" },
  { emoji: "💰", label: "Dinheiro" },
  { emoji: "💵", label: "Dólar" },
  { emoji: "💴", label: "Iene" },
  { emoji: "💶", label: "Euro" },
  { emoji: "💷", label: "Libra" },
  { emoji: "🪙", label: "Moeda" },
  { emoji: "💎", label: "Diamante" },
  { emoji: "📈", label: "Crescimento" },
  { emoji: "📉", label: "Queda" },
  { emoji: "💹", label: "Ações" },
  { emoji: "🏧", label: "Caixa Eletrônico" },
  { emoji: "🏪", label: "Loja" },
  { emoji: "🏢", label: "Empresa" },
  { emoji: "🏛️", label: "Banco Tradicional" },
  { emoji: "💼", label: "Negócio" },
  { emoji: "🎯", label: "Meta" },
  { emoji: "🔐", label: "Cofre" },
  { emoji: "💸", label: "Dinheiro Voando" },
  { emoji: "🤑", label: "Rico" },
  { emoji: "💲", label: "Cifrão" },
  { emoji: "🧾", label: "Recibo" },
  { emoji: "📊", label: "Gráfico" },
  { emoji: "₿", label: "Bitcoin" },
  { emoji: "🔷", label: "Ethereum" },
  { emoji: "💠", label: "Cripto" },
  { emoji: "🎰", label: "Investimento" },
  { emoji: "🌟", label: "Especial" },
  { emoji: "⭐", label: "Favorito" },
  { emoji: "🔥", label: "Quente" },
  { emoji: "❤️", label: "Favorito Vermelho" },
  { emoji: "💜", label: "Nubank" },
  { emoji: "🧡", label: "Inter" },
  { emoji: "💛", label: "BB" },
  { emoji: "💙", label: "Caixa" },
  { emoji: "🐷", label: "Poupança" },
  { emoji: "🏠", label: "Casa" },
  { emoji: "🚗", label: "Veículo" },
  { emoji: "✈️", label: "Viagem" },
  { emoji: "🎓", label: "Educação" },
  { emoji: "🏥", label: "Saúde" },
  { emoji: "🍔", label: "Alimentação" },
  { emoji: "🎮", label: "Entretenimento" },
  { emoji: "⚡", label: "Energia" },
  { emoji: "🌈", label: "Diversidade" },
  { emoji: "🎨", label: "Arte" },
  { emoji: "📱", label: "Digital" },
];

// 🎨 CORES PRÉ-DEFINIDAS
const CORES_PREDEFINIDAS = [
  { color: "#8A05BE", label: "Roxo Nubank" },
  { color: "#FF7A00", label: "Laranja Inter" },
  { color: "#FDB913", label: "Amarelo BB" },
  { color: "#0057A0", label: "Azul Caixa" },
  { color: "#EC7000", label: "Laranja Itaú" },
  { color: "#CC092F", label: "Vermelho Bradesco" },
  { color: "#EC0000", label: "Vermelho Santander" },
  { color: "#0066B3", label: "Azul Safra" },
  { color: "#00A868", label: "Verde Original" },
  { color: "#1A1A1A", label: "Preto C6" },
  { color: "#a855f7", label: "Roxo Padrão" },
  { color: "#3b82f6", label: "Azul" },
  { color: "#10b981", label: "Verde" },
  { color: "#f59e0b", label: "Amarelo" },
  { color: "#ef4444", label: "Vermelho" },
  { color: "#ec4899", label: "Rosa" },
];

const TIPOS_CONTA = [
  { value: "checking", label: "💳 Conta Corrente", emoji: "💳" },
  { value: "savings", label: "🐷 Poupança", emoji: "🐷" },
  { value: "credit_card", label: "💳 Cartão de Crédito", emoji: "💳" },
  { value: "investment", label: "📈 Investimento", emoji: "📈" },
  { value: "crypto", label: "₿ Criptomoedas", emoji: "₿" },
  { value: "wallet", label: "💵 Carteira/Dinheiro", emoji: "💵" },
];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: "",
    currency: "BRL",
    color: "#a855f7",
    icon: "💳",
    bank_name: "",
    logo_url: "",
    is_active: true
  });

  useEffect(() => {
    loadAccounts();
    document.title = "Carteiras - FINEX";
  }, []);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const accs = await Account.list("-created_date", 100);
      setAccounts(accs);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("❌ Arquivo muito grande! Máximo 2MB.");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
      alert("✅ Logo carregada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("❌ Erro ao carregar logo. Tente novamente.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
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
        bank_name: "",
        logo_url: "",
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
      bank_name: acc.bank_name || "",
      logo_url: acc.logo_url || "",
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
    crypto: "Criptomoedas",
    wallet: "Carteira/Dinheiro"
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const isUrlImage = (url) => url && (url.startsWith('http://') || url.startsWith('https://'));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <FeatureGuard pageName="Accounts">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
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
                  bank_name: "",
                  logo_url: "",
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((acc, index) => {
              const hasCustomLogo = isUrlImage(acc.logo_url);
              
              return (
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
                            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-white/95 p-2"
                            style={{ border: `2px solid ${acc.color}40` }}
                          >
                            {hasCustomLogo ? (
                              <img 
                                src={acc.logo_url} 
                                alt={acc.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  if (e.target && e.target.parentElement) {
                                    e.target.parentElement.innerHTML = `<span class="text-3xl">${acc.icon || '🏦'}</span>`;
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-3xl">{acc.icon || '🏦'}</span>
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">{acc.name}</CardTitle>
                            <p className="text-purple-400 text-sm">{accountTypes[acc.type]}</p>
                            {acc.bank_name && (
                              <p className="text-purple-300 text-xs mt-1">🏦 {acc.bank_name}</p>
                            )}
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
              );
            })}
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

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="glass-card border-purple-700/50 text-white max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-[#1a1a2e] z-10 pb-4">
              <DialogTitle className="text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {editingAccount ? "✏️ Editar Conta" : "✨ Nova Conta"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 pb-4">
              {/* Prévia */}
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-6 border border-purple-700/30">
                <p className="text-purple-300 text-xs mb-3 flex items-center gap-2">
                  <Building2 className="w-3 h-3" />
                  PRÉVIA DA CARTEIRA
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl bg-white/95 p-2"
                    style={{ border: `3px solid ${formData.color}60` }}
                  >
                    {isUrlImage(formData.logo_url) ? (
                      <img 
                        src={formData.logo_url} 
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-4xl">{formData.icon}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-xl mb-1">
                      {formData.name || "Nome da Conta"}
                    </p>
                    <p className="text-purple-300 text-sm mb-2">
                      {accountTypes[formData.type]}
                    </p>
                    {formData.bank_name && (
                      <p className="text-purple-400 text-xs mb-2">
                        🏦 {formData.bank_name}
                      </p>
                    )}
                    <p className="text-3xl font-bold text-green-400">
                      R$ {formData.balance || "0.00"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nome do Banco - CAMPO DE TEXTO COM BUSCA */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  <Search className="w-4 h-4 inline mr-2" />
                  Nome do Banco ou Instituição
                </Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="bg-purple-900/20 border-purple-700/50 text-white h-12 text-base"
                  placeholder="Ex: Nubank, Banco Inter, Caixa..."
                />
                <p className="text-purple-400 text-xs mt-2">
                  💡 Digite o nome do seu banco (opcional)
                </p>
              </div>

              {/* Upload de Logo Manual */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Logo do Banco (Opcional)
                </Label>
                <div className="flex gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="flex-1 bg-purple-900/20 border-purple-700/50 text-purple-200"
                    disabled={isUploadingLogo}
                  />
                  {formData.logo_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, logo_url: "" })}
                      className="border-red-700 text-red-400"
                    >
                      Remover
                    </Button>
                  )}
                </div>
                {isUploadingLogo && (
                  <p className="text-cyan-300 text-sm mt-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando logo...
                  </p>
                )}
                {formData.logo_url && (
                  <p className="text-green-300 text-sm mt-2 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Logo carregada com sucesso!
                  </p>
                )}
                <p className="text-purple-400 text-xs mt-2">
                  📸 Envie a logo oficial do seu banco (PNG, JPG - máx 2MB)
                </p>
              </div>

              {/* Ícones Financeiros */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  🎨 Escolha um Ícone Emoji
                </Label>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[200px] overflow-y-auto p-3 bg-purple-900/10 rounded-xl">
                  {ICONES_FINANCEIROS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`relative p-3 rounded-lg text-2xl hover:scale-110 transition-all ${
                        formData.icon === emoji
                          ? 'bg-purple-600 shadow-lg ring-2 ring-purple-400'
                          : 'bg-purple-900/20 hover:bg-purple-900/40'
                      }`}
                      title={label}
                    >
                      {emoji}
                      {formData.icon === emoji && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-purple-400 text-xs mt-2">
                  💡 Escolha um ícone que represente sua carteira (será usado se não enviar logo)
                </p>
              </div>

              {/* Cores */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  🎨 Cor da Carteira
                </Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-3">
                  {CORES_PREDEFINIDAS.map(({ color, label }) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`relative h-12 rounded-lg transition-all hover:scale-110 ${
                        formData.color === color ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={label}
                    >
                      {formData.color === color && (
                        <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-purple-300 text-xs">Ou escolha manualmente:</Label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer bg-purple-900/20 border-2 border-purple-700/50"
                  />
                </div>
              </div>

              {/* Tipo da Conta */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  📋 Tipo de Conta
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    const tipo = TIPOS_CONTA.find(t => t.value === value);
                    setFormData({ 
                      ...formData, 
                      type: value,
                      icon: tipo ? tipo.emoji : formData.icon
                    });
                  }}
                >
                  <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONTA.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  placeholder="Ex: Conta Corrente Principal"
                />
              </div>

              {/* Saldo */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  💰 Saldo Inicial *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300 font-bold text-lg">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    required
                    className="bg-purple-900/20 border-purple-700/50 text-white h-12 text-base pl-14"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-purple-700/30">
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