
import React, { useState, useEffect } from "react";
import { SystemPlan } from "@/entities/SystemPlan";
import { SystemSettings } from "@/entities/SystemSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Crown, Plus, Edit, Trash2, DollarSign, Save, Check, Sparkles, AlertTriangle, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";

const colorGradients = [
  { value: "from-blue-600 to-cyan-600", label: "Azul Ciano" },
  { value: "from-purple-600 to-pink-600", label: "Roxo Rosa" },
  { value: "from-yellow-600 to-orange-600", label: "Amarelo Laranja" },
  { value: "from-green-600 to-emerald-600", label: "Verde Esmeralda" },
  { value: "from-red-600 to-pink-600", label: "Vermelho Rosa" },
  { value: "from-indigo-600 to-purple-600", label: "Indigo Roxo" }
];

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [paymentSettings, setPaymentSettings] = useState({
    pix_key: "",
    pix_key_type: "cpf", // New field for PIX key type
    pix_name: "",
    // Removed bank_account, bank_agency, bank_name
  });

  const [planFormData, setPlanFormData] = useState({
    name: "",
    plan_type: "monthly",
    price: 0,
    duration_months: 1,
    discount_percent: 0,
    features: [],
    allowed_pages: ["Dashboard", "Transactions", "Accounts", "Categories", "Profile", "Plans"],
    transaction_limit: 0,
    account_limit: 0,
    has_ai_consultant: false,
    has_reports: false,
    has_goals: false,
    is_popular: false,
    is_highlight: false,
    color_gradient: "from-blue-600 to-cyan-600",
    order: 0,
    is_active: true
  });

  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    loadPlans();
    loadPaymentSettings();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await SystemPlan.list("order");
      setPlans(data);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const allSettings = await SystemSettings.list();
      
      const pixKey = allSettings.find(s => s.key === "pix_key");
      const pixKeyType = allSettings.find(s => s.key === "pix_key_type"); // New
      const pixName = allSettings.find(s => s.key === "pix_name");
      // const pixBank = allSettings.find(s => s.key === "pix_bank"); // Removed
      // const bankAccount = allSettings.find(s => s.key === "bank_account"); // Removed
      // const bankAgency = allSettings.find(s => s.key === "bank_agency"); // Removed
      // const bankName = allSettings.find(s => s.key === "bank_name"); // Removed
      
      setPaymentSettings({
        pix_key: pixKey?.value || "",
        pix_key_type: pixKeyType?.value || "cpf", // New default
        pix_name: pixName?.value || "",
        // pix_bank: pixBank?.value || "", // Removed
        // bank_account: bankAccount?.value || "", // Removed
        // bank_agency: bankAgency?.value || "", // Removed
        // bank_name: bankName?.value || "" // Removed
      });
    } catch (error) {
      console.error("Erro ao carregar configuracoes de pagamento:", error);
    }
  };

  const handleSavePaymentSettings = async () => {
    setIsSaving(true);
    try {
      const allSettings = await SystemSettings.list();
      
      const settingsToSave = {
        pix_key: paymentSettings.pix_key,
        pix_key_type: paymentSettings.pix_key_type,
        pix_name: paymentSettings.pix_name
      };

      for (const [key, value] of Object.entries(settingsToSave)) {
        const existing = allSettings.find(s => s.key === key);
        
        if (existing) {
          await SystemSettings.update(existing.id, {
            key,
            value,
            description: `Configuracao de pagamento: ${key}`,
            category: "payments"
          });
        } else {
          await SystemSettings.create({
            key,
            value,
            description: `Configuracao de pagamento: ${key}`,
            category: "payments"
          });
        }
      }
      
      alert("✅ Configuracoes de pagamento salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configuracoes:", error);
      alert("❌ Erro ao salvar configuracoes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePlan = () => {
    setPlanFormData({
      name: "",
      plan_type: "monthly",
      price: 0,
      duration_months: 1,
      discount_percent: 0,
      features: [],
      allowed_pages: ["Dashboard", "Transactions", "Accounts", "Categories", "Profile", "Plans"], // Páginas padrão para novos planos
      transaction_limit: 0,
      account_limit: 0,
      has_ai_consultant: false,
      has_reports: false,
      has_goals: false,
      is_popular: false,
      is_highlight: false,
      color_gradient: "from-blue-600 to-cyan-600",
      order: 0,
      is_active: true
    });
    setEditingPlan(null);
    setShowPlanModal(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      plan_type: plan.plan_type,
      price: plan.price,
      duration_months: plan.duration_months,
      discount_percent: plan.discount_percent || 0,
      features: plan.features || [],
      allowed_pages: plan.allowed_pages || ["Dashboard", "Profile", "Plans"],
      transaction_limit: plan.transaction_limit || 0,
      account_limit: plan.account_limit || 0,
      has_ai_consultant: plan.has_ai_consultant || false,
      has_reports: plan.has_reports || false,
      has_goals: plan.has_goals || false,
      is_popular: plan.is_popular || false,
      is_highlight: plan.is_highlight || false,
      color_gradient: plan.color_gradient,
      order: plan.order || 0,
      is_active: plan.is_active !== false
    });
    setShowPlanModal(true);
  };

  const handleDeletePlan = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;
    
    try {
      await SystemPlan.delete(id);
      loadPlans();
    } catch (error) {
      console.error("Erro ao excluir plano:", error);
      alert("Erro ao excluir plano.");
    }
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    
    setPlanFormData({
      ...planFormData,
      features: [...planFormData.features, featureInput.trim()]
    });
    setFeatureInput("");
  };

  const handleRemoveFeature = (index) => {
    setPlanFormData({
      ...planFormData,
      features: planFormData.features.filter((_, i) => i !== index)
    });
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPlan) {
        await SystemPlan.update(editingPlan.id, planFormData);
      } else {
        await SystemPlan.create(planFormData);
      }
      
      setShowPlanModal(false);
      loadPlans();
      alert("Plano salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      alert("Erro ao salvar plano.");
    }
  };

  const availablePages = [
    { value: "Dashboard", label: "Dashboard" },
    { value: "Transactions", label: "Transações" },
    { value: "Import", label: "Importar Dados" },
    { value: "Payables", label: "Contas a Pagar" },
    { value: "Receivables", label: "Contas a Receber" },
    { value: "Accounts", label: "Carteiras" },
    { value: "Categories", label: "Categorias" },
    { value: "Goals", label: "Metas Financeiras" },
    { value: "Statement", label: "Extrato Financeiro" },
    { value: "Reports", label: "Relatórios IA" },
    { value: "Consultor", label: "Consultor IA" },
    { value: "Tutorials", label: "Tutoriais" },
    { value: "DownloadApp", label: "Baixar App" }
  ];

  const togglePage = (page) => {
    const current = planFormData.allowed_pages || [];
    if (current.includes(page)) {
      setPlanFormData({
        ...planFormData,
        allowed_pages: current.filter(p => p !== page)
      });
    } else {
      setPlanFormData({
        ...planFormData,
        allowed_pages: [...current, page]
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="bg-purple-900/20 w-full grid grid-cols-2">
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="payment">Configurações PIX</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <Card className="glass-card border-0">
            <CardContent className="p-4">
              <Button
                onClick={handleCreatePlan}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Plano
              </Button>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`glass-card border-0 neon-glow h-full flex flex-col ${
                  plan.is_popular ? 'ring-2 ring-purple-500' : ''
                } ${plan.is_highlight ? 'ring-2 ring-green-500' : ''}`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${plan.color_gradient} flex items-center justify-center mb-3`}>
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                    {plan.is_popular && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-600 text-white inline-block mt-2">
                        POPULAR
                      </span>
                    )}
                    {plan.is_highlight && (
                      <span className="text-xs px-2 py-1 rounded bg-green-600 text-white inline-block mt-2">
                        DESTAQUE
                      </span>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-white">
                        R$ {plan.price.toFixed(2)}
                      </p>
                      <p className="text-purple-300 text-sm mt-1">
                        {plan.duration_months === 999 ? "Vitalicio" : `${plan.duration_months} ${plan.duration_months === 1 ? 'mês' : 'meses'}`}
                      </p>
                      {plan.discount_percent > 0 && (
                        <span className="text-xs px-2 py-1 rounded bg-red-600 text-white inline-block mt-2">
                          {plan.discount_percent}% OFF
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2 mb-4 flex-1 text-sm text-purple-200">
                      {(plan.features || []).map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>

                    <div className="flex gap-2 pt-3 border-t border-purple-900/30">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                        className="flex-1 border-purple-700 text-purple-300"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="flex-1 border-red-700 text-red-300"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card className="glass-card border-0 neon-glow">
            <CardHeader className="border-b border-purple-900/30">
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Configurações de Pagamento PIX
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="bg-cyan-900/20 p-4 rounded-lg border border-cyan-700/30">
                  <p className="text-cyan-200 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Configure sua chave PIX para receber pagamentos dos usuários
                  </p>
                </div>

                <div>
                  <Label className="text-purple-200">Tipo de Chave PIX</Label>
                  <Select
                    value={paymentSettings.pix_key_type}
                    onValueChange={(value) => setPaymentSettings({...paymentSettings, pix_key_type: value})}
                  >
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone/Celular</SelectItem>
                      <SelectItem value="random">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-purple-400 text-xs mt-1">
                    Selecione o tipo de chave PIX que você vai usar
                  </p>
                </div>

                <div>
                  <Label className="text-purple-200">Chave PIX</Label>
                  <Input
                    value={paymentSettings.pix_key}
                    onChange={(e) => setPaymentSettings({...paymentSettings, pix_key: e.target.value})}
                    placeholder={
                      paymentSettings.pix_key_type === 'cpf' ? '000.000.000-00' :
                      paymentSettings.pix_key_type === 'cnpj' ? '00.000.000/0000-00' :
                      paymentSettings.pix_key_type === 'email' ? 'seu@email.com' :
                      paymentSettings.pix_key_type === 'phone' ? '(00) 00000-0000' :
                      '00000000-0000-0000-0000-000000000000'
                    }
                    className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
                  />
                  <p className="text-purple-400 text-xs mt-1">
                    {paymentSettings.pix_key_type === 'cpf' && '📝 Digite apenas números do CPF'}
                    {paymentSettings.pix_key_type === 'cnpj' && '📝 Digite apenas números do CNPJ'}
                    {paymentSettings.pix_key_type === 'email' && '📧 Digite o e-mail cadastrado no PIX'}
                    {paymentSettings.pix_key_type === 'phone' && '📱 Digite o telefone com DDD (apenas números)'}
                    {paymentSettings.pix_key_type === 'random' && '🔑 Cole a chave aleatória completa'}
                  </p>
                </div>

                <div>
                  <Label className="text-purple-200">Nome do Beneficiário</Label>
                  <Input
                    value={paymentSettings.pix_name}
                    onChange={(e) => setPaymentSettings({...paymentSettings, pix_name: e.target.value})}
                    placeholder="Seu Nome Completo ou Nome da Empresa"
                    className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
                  />
                  <p className="text-purple-400 text-xs mt-1">
                    Nome que aparecerá para os usuários no momento do pagamento
                  </p>
                </div>

                {paymentSettings.pix_key && (
                  <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700/30">
                    <p className="text-purple-200 text-sm font-semibold mb-2">📋 Resumo da Configuração:</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-purple-300">
                        <strong>Tipo:</strong> {
                          paymentSettings.pix_key_type === 'cpf' ? 'CPF' :
                          paymentSettings.pix_key_type === 'cnpj' ? 'CNPJ' :
                          paymentSettings.pix_key_type === 'email' ? 'E-mail' :
                          paymentSettings.pix_key_type === 'phone' ? 'Telefone' :
                          'Chave Aleatória'
                        }
                      </p>
                      <p className="text-purple-300">
                        <strong>Chave:</strong> {paymentSettings.pix_key}
                      </p>
                      <p className="text-purple-300">
                        <strong>Nome:</strong> {paymentSettings.pix_name || '(não definido)'}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSavePaymentSettings}
                  disabled={isSaving || !paymentSettings.pix_key || !paymentSettings.pix_name}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Configurações PIX
                    </>
                  )}
                </Button>

                <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-700/30">
                  <p className="text-yellow-300 text-sm">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    <strong>Importante:</strong> Certifique-se de que a chave PIX está ativa e correta. Os usuários verão esta chave e um QR Code para pagamento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {editingPlan ? "Editar Plano" : "Novo Plano"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitPlan} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-purple-200">Nome do Plano</Label>
                <Input
                  value={planFormData.name}
                  onChange={(e) => setPlanFormData({...planFormData, name: e.target.value})}
                  required
                  placeholder="Ex: Mensal, Anual, etc"
                  className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-purple-200">Tipo</Label>
                <Select
                  value={planFormData.plan_type}
                  onValueChange={(value) => setPlanFormData({...planFormData, plan_type: value})}
                >
                  <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="semester">Semestral</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                    <SelectItem value="lifetime">Vitalicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-purple-200">Preco (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={planFormData.price}
                  onChange={(e) => setPlanFormData({...planFormData, price: parseFloat(e.target.value)})}
                  required
                  className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-purple-200">Duracao (meses)</Label>
                <Input
                  type="number"
                  value={planFormData.duration_months}
                  onChange={(e) => setPlanFormData({...planFormData, duration_months: parseInt(e.target.value)})}
                  required
                  placeholder="Use 999 para vitalicio"
                  className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-purple-200">Desconto (%)</Label>
                <Input
                  type="number"
                  value={planFormData.discount_percent}
                  onChange={(e) => setPlanFormData({...planFormData, discount_percent: parseInt(e.target.value)})}
                  placeholder="0"
                  className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-purple-200">Ordem</Label>
                <Input
                  type="number"
                  value={planFormData.order}
                  onChange={(e) => setPlanFormData({...planFormData, order: parseInt(e.target.value)})}
                  className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
                />
              </div>
            </div>

            <div>
              <Label className="text-purple-200">Cor do Plano</Label>
              <Select
                value={planFormData.color_gradient}
                onValueChange={(value) => setPlanFormData({...planFormData, color_gradient: value})}
              >
                <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorGradients.map(color => (
                    <SelectItem key={color.value} value={color.value}>{color.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-purple-200 mb-3 block">Páginas Permitidas Neste Plano</Label>
              <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/30 mb-3">
                <p className="text-xs text-blue-300 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>✅ Sempre permitidos:</strong> Dashboard, Profile e Plans (obrigatórios)
                    <br />
                    <strong>📋 Selecione abaixo</strong> quais páginas adicionais este plano terá acesso
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availablePages.map(page => {
                  const isSelected = (planFormData.allowed_pages || []).includes(page.value);
                  const isAlwaysAllowed = ["Dashboard", "Profile", "Plans"].includes(page.value);
                  
                  return (
                    <button
                      key={page.value}
                      type="button"
                      onClick={() => !isAlwaysAllowed && togglePage(page.value)}
                      disabled={isAlwaysAllowed}
                      className={`p-3 rounded-lg border-2 transition-all text-sm ${
                        isAlwaysAllowed
                          ? 'bg-green-900/20 border-green-700/50 text-green-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-purple-600/30 border-purple-500 text-white'
                          : 'bg-purple-900/20 border-purple-700/50 text-purple-300 hover:border-purple-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected || isAlwaysAllowed ? 'bg-purple-500 border-purple-500' : 'border-purple-500'
                        }`}>
                          {(isSelected || isAlwaysAllowed) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {page.label}
                      </div>
                      {isAlwaysAllowed && (
                        <span className="text-xs text-green-400 mt-1 block">Sempre permitido</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-purple-400 mt-2">
                ✅ Dashboard, Profile e Plans são sempre permitidos para todos os planos
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-purple-200">Limite de Transações/Mês</Label>
                <Input
                  type="number"
                  value={planFormData.transaction_limit}
                  onChange={(e) => setPlanFormData({...planFormData, transaction_limit: parseInt(e.target.value)})}
                  className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
                  placeholder="0 = ilimitado"
                />
              </div>

              <div>
                <Label className="text-purple-200">Limite de Contas</Label>
                <Input
                  type="number"
                  value={planFormData.account_limit}
                  onChange={(e) => setPlanFormData({...planFormData, account_limit: parseInt(e.target.value)})}
                  className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
                  placeholder="0 = ilimitado"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/20 border border-purple-700/50">
                    <Label className="text-purple-200">Consultor IA</Label>
                    <Switch
                        checked={planFormData.has_ai_consultant}
                        onCheckedChange={(checked) => setPlanFormData({...planFormData, has_ai_consultant: checked})}
                    />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/20 border border-purple-700/50">
                    <Label className="text-purple-200">Relatórios IA</Label>
                    <Switch
                        checked={planFormData.has_reports}
                        onCheckedChange={(checked) => setPlanFormData({...planFormData, has_reports: checked})}
                    />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/20 border border-purple-700/50">
                    <Label className="text-purple-200">Metas Financeiras</Label>
                    <Switch
                        checked={planFormData.has_goals}
                        onCheckedChange={(checked) => setPlanFormData({...planFormData, has_goals: checked})}
                    />
                </div>
            </div>

            <div>
              <Label className="text-purple-200">Funcionalidades</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Digite uma funcionalidade"
                  className="bg-purple-900/20 border-purple-700/50 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                />
                <Button type="button" onClick={handleAddFeature} variant="outline" className="border-purple-700 text-purple-300">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {planFormData.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-purple-900/20 border border-purple-700/50">
                    <span className="text-white text-sm">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/20 border border-purple-700/50">
              <Label className="text-purple-200">Marcar como Popular</Label>
              <Switch
                checked={planFormData.is_popular}
                onCheckedChange={(checked) => setPlanFormData({...planFormData, is_popular: checked})}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/20 border border-purple-700/50">
              <Label className="text-purple-200">Destacar Plano</Label>
              <Switch
                checked={planFormData.is_highlight}
                onCheckedChange={(checked) => setPlanFormData({...planFormData, is_highlight: checked})}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/20 border border-purple-700/50">
              <Label className="text-purple-200">Plano Ativo</Label>
              <Switch
                checked={planFormData.is_active}
                onCheckedChange={(checked) => setPlanFormData({...planFormData, is_active: checked})}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPlanModal(false)}
                className="flex-1 border-purple-700 text-purple-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {editingPlan ? "Atualizar" : "Criar"} Plano
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
