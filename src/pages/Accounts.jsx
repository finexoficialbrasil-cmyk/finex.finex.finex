import React, { useState, useEffect } from "react";
import { Account, Transaction } from "@/entities/all";
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
import { Wallet, Plus, Edit, Trash2, TrendingUp, TrendingDown, Building2, Loader2, Upload, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import FeatureGuard from "../components/FeatureGuard";

// Formata número para moeda brasileira (R$ 1.234,56)
const formatCurrencyBR = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// 🇧🇷 LISTA COMPLETA DE BANCOS BRASILEIROS
const BANCOS_BRASIL = [
  // Bancos Digitais (Mais Populares)
  { name: "Nubank", emoji: "💜", color: "#8A05BE" },
  { name: "Banco Inter", emoji: "🧡", color: "#FF7A00" },
  { name: "C6 Bank", emoji: "⚫", color: "#1A1A1A" },
  { name: "Next (Bradesco)", emoji: "💚", color: "#00AB63" },
  { name: "Neon", emoji: "💙", color: "#00D1FF" },
  { name: "PicPay", emoji: "💚", color: "#21C25E" },
  { name: "Mercado Pago", emoji: "💙", color: "#009EE3" },
  { name: "PagBank (PagSeguro)", emoji: "🟢", color: "#00A868" },
  { name: "Will Bank", emoji: "🟣", color: "#6B4FBB" },
  { name: "Original", emoji: "💚", color: "#00A868" },
  { name: "BS2", emoji: "🟡", color: "#FFD700" },
  { name: "Superdigital", emoji: "🔵", color: "#0066FF" },
  
  // Grandes Bancos Tradicionais
  { name: "Banco do Brasil", emoji: "💛", color: "#FDB913" },
  { name: "Caixa Econômica Federal", emoji: "🔵", color: "#0057A0" },
  { name: "Itaú Unibanco", emoji: "🔶", color: "#EC7000" },
  { name: "Bradesco", emoji: "🔴", color: "#CC092F" },
  { name: "Santander", emoji: "❤️", color: "#EC0000" },
  { name: "Banco Safra", emoji: "💙", color: "#0066B3" },
  { name: "Banco Votorantim", emoji: "🟠", color: "#FF6600" },
  { name: "Banrisul", emoji: "🔴", color: "#E31E24" },
  
  // Bancos de Investimento
  { name: "BTG Pactual", emoji: "🟦", color: "#000080" },
  { name: "XP Investimentos", emoji: "⚫", color: "#000000" },
  { name: "Rico Investimentos", emoji: "🟡", color: "#FFB800" },
  { name: "Clear Corretora", emoji: "🔵", color: "#0066CC" },
  { name: "Órama", emoji: "🟢", color: "#00CC66" },
  { name: "Modalmais", emoji: "🔵", color: "#0066FF" },
  
  // Outros Bancos
  { name: "Banco Pan", emoji: "💙", color: "#0077C8" },
  { name: "Banco BMG", emoji: "🔴", color: "#D32F2F" },
  { name: "Banco Daycoval", emoji: "🟢", color: "#00A550" },
  { name: "Banco Pine", emoji: "🟢", color: "#228B22" },
  { name: "Banco Sofisa", emoji: "🔵", color: "#0066CC" },
  { name: "Banco ABC Brasil", emoji: "🔴", color: "#CC0000" },
  { name: "Banco Fibra", emoji: "🟠", color: "#FF8800" },
  { name: "Banco Indusval", emoji: "🔵", color: "#003399" },
  { name: "Banestes", emoji: "🔵", color: "#0055AA" },
  { name: "Banco Cooperativo Sicredi", emoji: "🟢", color: "#00A651" },
  { name: "Banco Cooperativo Sicoob", emoji: "🟢", color: "#00923F" },
  { name: "Banco BRB", emoji: "🔵", color: "#0066CC" },
  { name: "Banco Mercantil", emoji: "🔴", color: "#CC0033" },
  { name: "Banco Paraná", emoji: "🔵", color: "#0055AA" },
  { name: "Banco Alfa", emoji: "🔴", color: "#E31E24" },
  
  // Fintechs e Carteiras Digitais
  { name: "RecargaPay", emoji: "🟣", color: "#7B2CBF" },
  { name: "Ame Digital", emoji: "💛", color: "#FFD600" },
  { name: "99Pay", emoji: "🟡", color: "#FFB800" },
  { name: "Creditas", emoji: "🔵", color: "#0066FF" },
  { name: "Nuinvest (Nu)", emoji: "💜", color: "#8A05BE" },
  { name: "Warren", emoji: "🟠", color: "#FF6633" },
  { name: "Easynvest (Nu)", emoji: "🟢", color: "#00AA50" },
  
  // Opções Genéricas
  { name: "Outro Banco", emoji: "🏦", color: "#6366f1" },
  { name: "Carteira Física", emoji: "💵", color: "#10b981" },
  { name: "Dinheiro em Espécie", emoji: "💰", color: "#059669" },
  { name: "Corretora (Outro)", emoji: "📈", color: "#f59e0b" },
  { name: "Criptomoedas", emoji: "₿", color: "#f97316" },
  { name: "Poupança", emoji: "🐷", color: "#ec4899" },
];

// 💰 ÍCONES FINANCEIROS DISPONÍVEIS
const ICONES_FINANCEIROS = [
  { emoji: "💰", label: "Dinheiro" },
  { emoji: "💵", label: "Nota de Dólar" },
  { emoji: "💴", label: "Nota de Iene" },
  { emoji: "💶", label: "Nota de Euro" },
  { emoji: "💷", label: "Nota de Libra" },
  { emoji: "💸", label: "Dinheiro Voando" },
  { emoji: "💳", label: "Cartão de Crédito" },
  { emoji: "🏦", label: "Banco" },
  { emoji: "🏧", label: "Caixa Eletrônico" },
  { emoji: "💼", label: "Maleta" },
  { emoji: "📊", label: "Gráfico de Barras" },
  { emoji: "📈", label: "Gráfico Subindo" },
  { emoji: "📉", label: "Gráfico Caindo" },
  { emoji: "💹", label: "Gráfico com Iene" },
  { emoji: "💲", label: "Sinal de Dólar" },
  { emoji: "🪙", label: "Moeda" },
  { emoji: "💎", label: "Diamante" },
  { emoji: "🤑", label: "Rico" },
  { emoji: "💪", label: "Força" },
  { emoji: "🎯", label: "Alvo/Meta" },
  { emoji: "🔒", label: "Segurança" },
  { emoji: "🔑", label: "Chave" },
  { emoji: "⚡", label: "Rapidez" },
  { emoji: "🚀", label: "Crescimento" },
  { emoji: "🌟", label: "Destaque" },
  { emoji: "✨", label: "Especial" },
  { emoji: "🎁", label: "Presente" },
  { emoji: "🏆", label: "Prêmio" },
  { emoji: "📱", label: "Digital" },
  { emoji: "💻", label: "Computador" },
  { emoji: "🌐", label: "Global" },
  { emoji: "🔥", label: "Popular" },
  { emoji: "⭐", label: "Estrela" },
  { emoji: "🎨", label: "Criativo" },
  { emoji: "🧮", label: "Calculadora" },
  { emoji: "📝", label: "Nota" },
  { emoji: "📅", label: "Calendário" },
  { emoji: "⏰", label: "Tempo" },
  { emoji: "🔔", label: "Notificação" },
  { emoji: "🎪", label: "Entretenimento" },
  { emoji: "🏠", label: "Casa" },
  { emoji: "🚗", label: "Carro" },
  { emoji: "✈️", label: "Viagem" },
  { emoji: "🍔", label: "Alimentação" },
  { emoji: "🎓", label: "Educação" },
  { emoji: "💊", label: "Saúde" },
  { emoji: "🎮", label: "Lazer" },
  { emoji: "👔", label: "Trabalho" },
  { emoji: "🛍️", label: "Compras" },
  { emoji: "₿", label: "Bitcoin" },
  { emoji: "🐷", label: "Poupança" },
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
  const [searchBank, setSearchBank] = useState("");
  const [showCustomBank, setShowCustomBank] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: "",
    currency: "BRL",
    color: "#a855f7",
    icon: "💳",
    logo_url: "",
    bank_name: "",
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

  const handleSelectBank = (bankName) => {
    const bank = BANCOS_BRASIL.find(b => b.name === bankName);
    
    if (bankName === "Outro Banco") {
      setShowCustomBank(true);
      setFormData({
        ...formData,
        bank_name: "",
        icon: "🏦",
        color: "#6366f1"
      });
    } else if (bank) {
      setShowCustomBank(false);
      setFormData({
        ...formData,
        bank_name: bank.name,
        icon: bank.emoji,
        color: bank.color,
        name: formData.name || bank.name
      });
    }
    setSearchBank("");
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Imagem muito grande! Máximo 2MB.");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
      alert("✅ Logo carregada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao enviar logo. Tente novamente.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // ✅ Converte valor BR (1.234,56) para número
  const parseBalanceBR = (value) => {
    if (!value) return 0;
    let str = String(value).trim();

    // Se tem vírgula E ponto, assumir formato BR (1.234,56)
    if (str.includes(',') && str.includes('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } 
    // Se só tem vírgula, trocar por ponto (1234,56 -> 1234.56)
    else if (str.includes(',')) {
      str = str.replace(',', '.');
    }
    // Se só tem ponto, manter como está (1234.56)

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        balance: parseBalanceBR(formData.balance)
      };

      if (editingAccount) {
        // ✅ Se está editando, verificar se o nome mudou
        const nameChanged = editingAccount.name !== data.name;
        
        await Account.update(editingAccount.id, data);
        
        // ✅ Se o nome da conta mudou, atualizar todas as transações relacionadas
        if (nameChanged) {
          const transactions = await Transaction.filter({ account_id: editingAccount.id });
          console.log(`🔄 Atualizando ${transactions.length} transações da conta "${editingAccount.name}" para "${data.name}"`);
          
          // Atualizar cada transação em paralelo
          await Promise.all(
            transactions.map(tx => 
              Transaction.update(tx.id, { ...tx })
            )
          );
        }
      } else {
        await Account.create(data);
      }
      
      setShowForm(false);
      setEditingAccount(null);
      setShowCustomBank(false);
      setSearchBank("");
      setFormData({
        name: "",
        type: "checking",
        balance: "",
        currency: "BRL",
        color: "#a855f7",
        icon: "💳",
        logo_url: "",
        bank_name: "",
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
      logo_url: acc.logo_url || "",
      bank_name: acc.bank_name || "",
      is_active: acc.is_active !== false
    });
    setShowCustomBank(acc.bank_name === "Outro Banco" || !BANCOS_BRASIL.find(b => b.name === acc.bank_name));
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta conta?\n\n⚠️ ATENÇÃO: Todas as transações relacionadas a esta conta também serão excluídas!")) return;
    
    try {
      // ✅ Primeiro, buscar todas as transações relacionadas a esta conta
      const transactions = await Transaction.filter({ account_id: id });
      
      console.log(`🗑️ Excluindo conta e ${transactions.length} transações relacionadas`);
      
      // ✅ Deletar todas as transações em paralelo
      if (transactions.length > 0) {
        await Promise.all(
          transactions.map(tx => Transaction.delete(tx.id))
        );
      }
      
      // ✅ Deletar a conta
      await Account.delete(id);
      
      loadAccounts();
      alert(`✅ Conta e ${transactions.length} transação(ões) excluídas com sucesso!`);
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

  const filteredBanks = BANCOS_BRASIL.filter(bank => 
    bank.name.toLowerCase().includes(searchBank.toLowerCase())
  );

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
                setShowCustomBank(false);
                setSearchBank("");
                setFormData({
                  name: "",
                  type: "checking",
                  balance: "",
                  currency: "BRL",
                  color: "#a855f7",
                  icon: "💳",
                  logo_url: "",
                  bank_name: "",
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
                                            {formatCurrencyBR(totalBalance)}
                                          </p>
                </div>
                <div className="p-4 rounded-full bg-indigo-600/20">
                  <Wallet className="w-8 h-8 text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>

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
                          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden"
                          style={{ 
                            backgroundColor: acc.color + '20',
                            border: `3px solid ${acc.color}60`
                          }}
                        >
                          {acc.logo_url ? (
                            <img 
                              src={acc.logo_url} 
                              alt={acc.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                if (e.target && e.target.parentElement) {
                                  e.target.parentElement.innerHTML = `<span class="text-4xl">${acc.icon || '🏦'}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-4xl">{acc.icon || '🏦'}</span>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{acc.name}</CardTitle>
                          <p className="text-purple-400 text-sm">{accountTypes[acc.type]}</p>
                          {acc.bank_name && (
                            <p className="text-purple-300 text-xs mt-1">{acc.bank_name}</p>
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
                                                      {formatCurrencyBR(acc.balance)}
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

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="glass-card border-purple-700/50 text-white max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-[#1a1a2e] z-10 pb-4">
              <DialogTitle className="text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {editingAccount ? "✏️ Editar Conta" : "✨ Nova Conta"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 pb-4">
              {/* Prévia */}
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-5 border border-purple-700/30">
                <p className="text-purple-300 text-xs mb-3 flex items-center gap-2">
                  <Building2 className="w-3 h-3" />
                  PRÉVIA DA CARTEIRA
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden"
                    style={{ 
                      backgroundColor: formData.color + '20',
                      border: `3px solid ${formData.color}60`
                    }}
                  >
                    {formData.logo_url ? (
                      <img 
                        src={formData.logo_url} 
                        alt="Logo"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-5xl">{formData.icon}</span>
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
                                                {formData.balance ? `R$ ${formData.balance}` : "R$ 0,00"}
                                              </p>
                  </div>
                </div>
              </div>

              {/* Upload de Logo Personalizada */}
              <div className="bg-cyan-900/20 border border-cyan-700/30 p-4 rounded-lg">
                <Label className="text-cyan-300 text-sm font-semibold mb-3 block flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  📸 Logo Personalizada do Banco (Opcional)
                </Label>
                <div className="flex gap-3">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={isUploadingLogo}
                    />
                    <div className="cursor-pointer bg-purple-900/20 border-2 border-dashed border-purple-700/50 hover:border-purple-600 rounded-lg p-4 text-center transition-all">
                      {isUploadingLogo ? (
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                      ) : (
                        <Upload className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      )}
                      <p className="text-purple-300 text-sm">
                        {isUploadingLogo ? "Enviando..." : "Clique para enviar logo"}
                      </p>
                      <p className="text-purple-400 text-xs mt-1">PNG, JPG (max 2MB)</p>
                    </div>
                  </label>
                  {formData.logo_url && (
                    <div className="flex flex-col gap-2">
                      <div className="w-20 h-20 rounded-lg bg-purple-900/40 p-2 flex items-center justify-center border-2 border-green-500">
                        <img src={formData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setFormData({ ...formData, logo_url: "" })}
                        className="border-red-700 text-red-400 h-7 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-cyan-200 text-xs mt-3">
                  💡 Envie o logo oficial do seu banco para um visual mais profissional!
                </p>
              </div>

              {/* Buscar Banco */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  🏦 Selecione seu Banco
                </Label>
                
                {/* Campo de Busca */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <Input
                    value={searchBank}
                    onChange={(e) => setSearchBank(e.target.value)}
                    placeholder="Digite para buscar seu banco..."
                    className="bg-purple-900/20 border-purple-700/50 text-white h-12 pl-10"
                  />
                  {searchBank && (
                    <button
                      type="button"
                      onClick={() => setSearchBank("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Lista de Bancos Filtrados */}
                <div className="max-h-[200px] overflow-y-auto bg-purple-900/20 rounded-lg border border-purple-700/50">
                  {filteredBanks.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-purple-400 text-sm">Nenhum banco encontrado</p>
                      <p className="text-purple-500 text-xs mt-1">Tente outro termo ou selecione "Outro Banco"</p>
                    </div>
                  ) : (
                    filteredBanks.map((bank) => (
                      <button
                        key={bank.name}
                        type="button"
                        onClick={() => handleSelectBank(bank.name)}
                        className={`w-full text-left px-4 py-3 hover:bg-purple-900/40 transition-colors flex items-center gap-3 ${
                          formData.bank_name === bank.name ? 'bg-purple-600/30' : ''
                        }`}
                      >
                        <span className="text-2xl">{bank.emoji}</span>
                        <span className="text-white font-medium flex-1">{bank.name}</span>
                        {formData.bank_name === bank.name && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
                <p className="text-purple-400 text-xs mt-2">
                  💡 Não achou? Selecione "Outro Banco" e digite manualmente
                </p>
              </div>

              {/* Banco Customizado */}
              {showCustomBank && (
                <div className="bg-yellow-900/20 border border-yellow-700/30 p-4 rounded-lg">
                  <Label className="text-yellow-300 text-sm font-semibold mb-2 block">
                    ✏️ Digite o nome do seu banco
                  </Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="bg-purple-900/20 border-purple-700/50 text-white h-12"
                    placeholder="Ex: Meu Banco Regional"
                  />
                </div>
              )}

              {/* Ícones Emoji */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-3 block">
                  😊 Escolha um Ícone (Opcional)
                </Label>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 max-h-[250px] overflow-y-auto p-3 bg-purple-900/10 rounded-xl">
                  {ICONES_FINANCEIROS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`relative p-2 rounded-lg text-2xl hover:scale-110 transition-all ${
                        formData.icon === emoji
                          ? 'bg-purple-600 shadow-lg ring-2 ring-purple-400'
                          : 'bg-purple-900/20 hover:bg-purple-900/40'
                      }`}
                      title={label}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className="text-purple-400 text-xs mt-2">
                  💡 O ícone será usado se você não enviar uma logo personalizada
                </p>
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
                    type="text"
                    inputMode="decimal"
                    value={formData.balance}
                    onChange={(e) => {
                      // Remove tudo exceto números
                      let raw = e.target.value.replace(/\D/g, '');

                      // Converte para centavos e formata
                      if (raw === '') {
                        setFormData({ ...formData, balance: '' });
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

                      setFormData({ ...formData, balance: formatted });
                    }}
                    required
                    className="bg-purple-900/20 border-purple-700/50 text-white h-12 text-base pl-14"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Cor Personalizada */}
              <div>
                <Label className="text-purple-200 text-sm font-semibold mb-2 block">
                  🎨 Cor da Carteira
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-12 rounded-lg cursor-pointer bg-purple-900/20 border-2 border-purple-700/50"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 bg-purple-900/20 border-purple-700/50 text-white h-12"
                    placeholder="#a855f7"
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