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
import { Wallet, Plus, Edit, Trash2, TrendingUp, TrendingDown, Check, Loader2, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FeatureGuard from "../components/FeatureGuard";

// 🏦 BANCOS BRASILEIROS COM LOGOS E EMOJIS
const BRAZILIAN_BANKS = [
  { 
    code: "nubank", 
    name: "Nubank", 
    emoji: "💜",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg",
    color: "#8A05BE" 
  },
  { 
    code: "inter", 
    name: "Banco Inter", 
    emoji: "🧡",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Banco_Inter_logo.svg",
    color: "#FF7A00" 
  },
  { 
    code: "bb", 
    name: "Banco do Brasil", 
    emoji: "💛",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/29/Banco_do_Brasil_logo.svg",
    color: "#FDB913" 
  },
  { 
    code: "caixa", 
    name: "Caixa Econômica", 
    emoji: "🔵",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Caixa_Econ%C3%B4mica_Federal_logo.svg",
    color: "#0057A0" 
  },
  { 
    code: "itau", 
    name: "Itaú", 
    emoji: "🔶",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Ita%C3%BA_Unibanco_logo.svg",
    color: "#EC7000" 
  },
  { 
    code: "bradesco", 
    name: "Bradesco", 
    emoji: "🔴",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Bradesco_logo.svg",
    color: "#CC092F" 
  },
  { 
    code: "santander", 
    name: "Santander", 
    emoji: "❤️",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Banco_Santander_Logotipo.svg",
    color: "#EC0000" 
  },
  { 
    code: "safra", 
    name: "Banco Safra", 
    emoji: "💙",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Banco_Safra_logo.svg",
    color: "#0066B3" 
  },
  { 
    code: "original", 
    name: "Banco Original", 
    emoji: "💚",
    logo: "https://seeklogo.com/images/B/banco-original-logo-3944247FC5-seeklogo.com.png",
    color: "#00A868" 
  },
  { 
    code: "c6", 
    name: "C6 Bank", 
    emoji: "⚫",
    logo: "https://seeklogo.com/images/C/c6-bank-logo-B66343FC16-seeklogo.com.png",
    color: "#1A1A1A" 
  },
  { 
    code: "btg", 
    name: "BTG Pactual", 
    emoji: "🟦",
    logo: "https://seeklogo.com/images/B/btg-pactual-logo-B263A74D17-seeklogo.com.png",
    color: "#000080" 
  },
  { 
    code: "pan", 
    name: "Banco Pan", 
    emoji: "💙",
    logo: "https://seeklogo.com/images/B/banco-pan-logo-1E48456C0E-seeklogo.com.png",
    color: "#0077C8" 
  },
  { 
    code: "next", 
    name: "Next", 
    emoji: "💚",
    logo: "https://seeklogo.com/images/N/next-bank-logo-049457154C-seeklogo.com.png",
    color: "#00AB63" 
  },
  { 
    code: "picpay", 
    name: "PicPay", 
    emoji: "💚",
    logo: "https://seeklogo.com/images/P/picpay-logo-1F0C60AECF-seeklogo.com.png",
    color: "#21C25E" 
  },
  { 
    code: "mercadopago", 
    name: "Mercado Pago", 
    emoji: "💙",
    logo: "https://seeklogo.com/images/M/mercado-pago-logo-9852AA4379-seeklogo.com.png",
    color: "#009EE3" 
  },
  { 
    code: "neon", 
    name: "Neon", 
    emoji: "💙",
    logo: "https://seeklogo.com/images/N/neon-logo-73671B011F-seeklogo.com.png",
    color: "#00D1FF" 
  },
  { 
    code: "will", 
    name: "Will Bank", 
    emoji: "🟣",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5YLHs9xQPdKLRGPq5q5hfJ3DhGqN5Qk5VfQ&s",
    color: "#6B4FBB" 
  },
  { 
    code: "xp", 
    name: "XP Investimentos", 
    emoji: "⚫",
    logo: "https://seeklogo.com/images/X/xp-investimentos-logo-01D91A7BDB-seeklogo.com.png",
    color: "#000000" 
  },
  { 
    code: "generic", 
    name: "Outro Banco", 
    emoji: "🏦",
    logo: "",
    color: "#6366f1" 
  },
  { 
    code: "wallet", 
    name: "Carteira/Dinheiro", 
    emoji: "💵",
    logo: "",
    color: "#10b981" 
  },
  { 
    code: "investment", 
    name: "Corretora", 
    emoji: "📈",
    logo: "",
    color: "#f59e0b" 
  },
  { 
    code: "crypto", 
    name: "Cripto", 
    emoji: "₿",
    logo: "",
    color: "#f97316" 
  }
];

// ✨ Ícones alternativos (emojis como fallback)
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

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: "",
    currency: "BRL",
    color: "#a855f7",
    icon: "💳",
    bank_code: "",
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
        bank_code: "",
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
      bank_code: acc.bank_code || "",
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

  const handleSelectBank = (bank) => {
    // ✅ Salvar logo OU emoji (se logo não existir)
    const iconToUse = bank.logo || bank.emoji;
    
    setFormData({
      ...formData,
      bank_code: bank.code,
      icon: iconToUse,
      color: bank.color,
      name: formData.name || bank.name
    });
  };

  const accountTypes = {
    checking: "Conta Corrente",
    savings: "Poupança",
    credit_card: "Cartão de Crédito",
    investment: "Investimento",
    crypto: "Criptomoedas"
  };

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

  const isUrlImage = (icon) => {
    return icon && (icon.startsWith('http://') || icon.startsWith('https://'));
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
                  bank_code: "",
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
              const isImage = isUrlImage(acc.icon);
              
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
                            className="w-14 h-14 rounded-xl flex items-center justify-center p-2 bg-white/95"
                            style={{ border: `2px solid ${acc.color}40` }}
                          >
                            {isImage ? (
                              <img 
                                src={acc.icon} 
                                alt={acc.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  if (e.target && e.target.parentElement) {
                                    e.target.parentElement.innerHTML = `<span class="text-3xl">🏦</span>`;
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-3xl">{acc.icon}</span>
                            )}
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
              <p className="text-purple-300 text-sm mt-1">
                {editingAccount ? "Atualize os dados da sua conta" : "Escolha seu banco e configure sua carteira"}
              </p>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 pb-4">
              {/* Preview da Conta */}
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-6 border border-purple-700/30">
                <p className="text-purple-300 text-xs mb-3 flex items-center gap-2">
                  <Building2 className="w-3 h-3" />
                  PRÉVIA DA CARTEIRA
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center p-3 shadow-xl bg-white/95"
                    style={{ border: `3px solid ${formData.color}60` }}
                  >
                    {isUrlImage(formData.icon) ? (
                      <img 
                        src={formData.icon} 
                        alt="Logo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          if (e.target && e.target.parentElement) {
                            e.target.parentElement.innerHTML = `<span class="text-5xl">🏦</span>`;
                          }
                        }}
                      />
                    ) : (
                      <span className="text-5xl">{formData.icon}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-xl mb-1">
                      {formData.name || "Nome da Conta"}
                    </p>
                    <p className="text-purple-300 text-sm mb-2">{accountTypes[formData.type]}</p>
                    <p className="text-3xl font-bold text-green-400">
                      R$ {formData.balance || "0.00"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Seleção de Banco Brasileiro */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-3 block">
                  🏦 Selecione seu Banco ou Instituição
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-3 bg-purple-900/10 rounded-xl">
                  {BRAZILIAN_BANKS.map((bank) => {
                    const hasLogo = bank.logo && bank.logo.length > 0;
                    
                    return (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => handleSelectBank(bank)}
                        className={`relative p-4 rounded-xl text-center transition-all group ${
                          formData.bank_code === bank.code
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 shadow-xl scale-105 ring-2 ring-purple-400'
                            : 'bg-purple-900/30 hover:bg-purple-900/50 hover:scale-105'
                        }`}
                      >
                        <div className="w-full h-16 mb-2 flex items-center justify-center p-2 bg-white/90 rounded-lg">
                          {hasLogo ? (
                            <img 
                              src={bank.logo} 
                              alt={bank.name}
                              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
                              onError={(e) => {
                                if (e.target && e.target.parentElement) {
                                  e.target.parentElement.innerHTML = `<span class="text-4xl">${bank.emoji}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-4xl">{bank.emoji}</span>
                          )}
                        </div>
                        <p className="text-white text-xs font-semibold truncate">{bank.name}</p>
                        {formData.bank_code === bank.code && (
                          <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-purple-400 text-xs mt-2">
                  💡 Clique no seu banco para aplicar logo e cor automaticamente
                </p>
              </div>

              {/* Tipo da Conta */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  📋 Tipo de Conta
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
                  placeholder="Ex: Nubank Conta Corrente"
                />
              </div>

              {/* Saldo Inicial */}
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
                <p className="text-xs text-purple-400 mt-1">
                  💡 Digite quanto dinheiro você tem nesta conta agora
                </p>
              </div>

              {/* Personalização Manual (opcional) */}
              <div className="border-t border-purple-700/30 pt-6">
                <Label className="text-purple-200 text-sm font-semibold mb-3 block">
                  🎨 Personalização Manual (Opcional)
                </Label>
                
                <div className="space-y-4">
                  {/* Ícone Manual */}
                  <div>
                    <Label className="text-purple-300 text-xs mb-2 block">Ou escolha um ícone emoji:</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_ICONS.map(({ emoji, label }) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: emoji, bank_code: "" })}
                          className={`relative p-3 rounded-lg text-2xl hover:scale-110 transition-all ${
                            formData.icon === emoji
                              ? 'bg-purple-600 shadow-lg'
                              : 'bg-purple-900/20 hover:bg-purple-900/40'
                          }`}
                          title={label}
                        >
                          {emoji}
                          {formData.icon === emoji && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cor Manual */}
                  <div>
                    <Label className="text-purple-300 text-xs mb-2 block">Personalize a cor:</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-16 h-12 rounded-lg cursor-pointer bg-purple-900/20 border-2 border-purple-700/50"
                      />
                      <div className="flex-1">
                        <Input
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="bg-purple-900/20 border-purple-700/50 text-white"
                          placeholder="#a855f7"
                        />
                      </div>
                    </div>
                  </div>
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