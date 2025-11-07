
import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/entities/User";
import { SystemPlan, Subscription, SystemSettings } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UploadFile } from "@/integrations/Core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Crown,
  Check,
  X,
  Sparkles,
  Upload,
  Copy,
  Loader2,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  FileText,
  CreditCard,
  Zap,
  Shield,
  TrendingUp,
  Target,
  BarChart3,
  Brain,
  Wallet,
  ChevronDown,
  Star,
  Lock // NEW: Import Lock icon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Plans() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({});
  const [showComparison, setShowComparison] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_proof_url: "",
    notes: "",
    pix_code: "",
    pix_qrcode_base64: "",
    asaas_payment_id: ""
  });

  useEffect(() => {
    loadData();
    document.title = "Planos - FINEX"; // ✅ Atualizar título da aba
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const plansData = await SystemPlan.list("order");
      const activePlans = plansData.filter(p => p.is_active);
      setPlans(activePlans);

      const settings = await SystemSettings.list();
      const pixConfig = {};
      
      settings.forEach(s => {
        if (s.key.startsWith('pix_') || s.key.startsWith('asaas_')) {
          pixConfig[s.key] = s.value;
        }
      });
      
      setPaymentSettings(pixConfig);
      console.log("✅ Configurações carregadas:", pixConfig);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const getCurrentPlan = () => {
    if (!user || !user.subscription_plan) return null;
    return plans.find(p => p.plan_type === user.subscription_plan);
  };

  const isUserPlanActive = () => {
    if (!user || user.subscription_status !== 'active') return false;
    if (!user.subscription_end_date) return false;
    
    const endDate = new Date(user.subscription_end_date);
    return endDate > new Date();
  };

  // ✅ NOVO: Função para atribuir valor numérico aos planos (para comparação)
  const getPlanValue = (planType) => {
    // Assuming plan_type corresponds to the duration for comparison
    const values = {
      'monthly': 1,
      'semester': 2,
      'annual': 3,
      'lifetime': 4
    };
    return values[planType] || 0;
  };

  // ✅ NOVO: Formatar nome do plano
  const formatPlanName = (planType) => {
    const names = {
      'monthly': 'Mensal',
      'semester': 'Semestral',
      'annual': 'Anual',
      'lifetime': 'Vitalício'
    };
    return names[planType] || planType;
  };

  const handleSelectPlan = async (plan) => {
    try {
      // ✅ NOVO: Verificar se usuário tem plano ativo e está tentando voltar para free ou fazer downgrade
      if (user && user.subscription_status === 'active' && user.subscription_end_date) {
        const endDate = new Date(user.subscription_end_date);
        const now = new Date();
        
        // Se ainda tem plano ativo
        if (endDate > now) {
          // Se está tentando escolher plano free (assumindo 'monthly' com price 0 é o free)
          if (plan.price === 0) { // Changed condition to check price directly as per the code
            alert(`❌ BLOQUEADO!\n\n🔒 Você já possui uma assinatura ATIVA até ${endDate.toLocaleDateString('pt-BR')}.\n\n⚠️ Não é possível fazer downgrade para o plano gratuito enquanto sua assinatura estiver ativa.\n\n💡 Aguarde o vencimento da sua assinatura ou entre em contato com o suporte para cancelamento.`);
            return;
          }
          
          // Se está tentando escolher plano inferior ao atual (pago para pago inferior)
          const currentPlanValue = getPlanValue(user.subscription_plan);
          const newPlanValue = getPlanValue(plan.plan_type);
          
          if (newPlanValue < currentPlanValue) {
            if (!confirm(`⚠️ ATENÇÃO: DOWNGRADE\n\nVocê está tentando mudar de um plano SUPERIOR para um plano INFERIOR.\n\nPlano atual: ${formatPlanName(user.subscription_plan)}\nNovo plano: ${plan.name}\n\n🔄 O downgrade só terá efeito após o vencimento da sua assinatura atual (${endDate.toLocaleDateString('pt-BR')}).\n\nDeseja continuar?`)) {
              return;
            }
          }
        }
      }

      setSelectedPlan(plan); // Moved this line as per outline's structure logic

      if (plan.price === 0) {
        handleActivateFreePlan(plan);
        return;
      }

      // Se Asaas configurado, usar pagamento automático
      if (paymentSettings.asaas_api_key) {
        handleAsaasPayment(plan);
      } else {
        // Senão, pagamento manual
        setPaymentData({
          payment_proof_url: "",
          notes: "",
          pix_code: "",
          pix_qrcode_base64: "",
          asaas_payment_id: ""
        });
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error("Erro ao selecionar plano:", error);
      alert("Erro ao processar. Tente novamente.");
    }
  };

  const handleAsaasPayment = async (plan) => {
    setIsSubmitting(true);
    setSelectedPlan(plan);
    setShowPaymentModal(true);

    try {
      const paymentPayload = {
        asaas_api_key: paymentSettings.asaas_api_key,
        customer_name: user.full_name || "Cliente",
        customer_email: user.email,
        customer_cpf: user.phone?.replace(/\D/g, '') || "00000000000",
        customer_external_id: user.id,
        amount: plan.price,
        description: `Assinatura ${plan.name} - FINEX`,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      console.log("🔄 Criando pagamento Asaas...", paymentPayload);

      const { asaasCreatePayment } = await import("@/functions/asaasCreatePayment");
      const response = await asaasCreatePayment(paymentPayload);

      console.log("✅ Resposta Asaas:", response);

      if (response.data?.success) {
        // Criar registro de assinatura pendente
        await Subscription.create({
          user_email: user.email,
          plan_type: plan.plan_type,
          status: "pending",
          amount_paid: plan.price,
          payment_method: "pix",
          transaction_id: response.data.payment_id,
          notes: `Pagamento Asaas ID: ${response.data.payment_id}`
        });

        setPaymentData({
          payment_proof_url: "",
          notes: "",
          pix_code: response.data.pix_code,
          pix_qrcode_base64: response.data.pix_qrcode_base64,
          asaas_payment_id: response.data.payment_id
        });
      } else {
        throw new Error(response.data?.error || "Erro desconhecido");
      }
    } catch (error) {
      console.error("❌ Erro ao criar pagamento:", error);
      alert(`❌ Erro ao criar pagamento:\n\n${error.response?.data?.error || error.message}\n\n${error.response?.data?.details || ''}`);
      setShowPaymentModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateFreePlan = async (plan) => {
    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration_months);
      
      await User.updateMyUserData({
        subscription_plan: plan.plan_type,
        subscription_status: 'active',
        subscription_end_date: endDate.toISOString().split('T')[0]
      });

      await Subscription.create({
        user_email: user.email,
        plan_type: plan.plan_type,
        status: "active",
        amount_paid: 0,
        payment_method: "free",
        notes: "Plano gratuito ativado automaticamente"
      });

      alert("✅ Plano gratuito ativado com sucesso! Atualize a página.");
      loadData();
    } catch (error) {
      console.error("Erro ao ativar plano gratuito:", error);
      alert("❌ Erro ao ativar plano.");
    }
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await UploadFile({ file });
      setPaymentData({ ...paymentData, payment_proof_url: file_url });
      alert("✅ Comprovante carregado com sucesso!");
    } catch (error) {
      alert("❌ Erro ao fazer upload do comprovante. Tente novamente.");
    }
  };

  const handleCopyPixKey = () => {
    const keyToCopy = paymentData.pix_code || paymentSettings.pix_key;
    if (keyToCopy) {
      navigator.clipboard.writeText(keyToCopy);
      alert("✅ Chave PIX copiada! Cole no seu app de pagamentos.");
    }
  };

  const getPixKeyTypeLabel = () => {
    const type = paymentSettings.pix_key_type;
    switch(type) {
      case 'cpf': return '📱 CPF';
      case 'cnpj': return '🏢 CNPJ';
      case 'email': return '📧 E-mail';
      case 'phone': return '📞 Telefone';
      case 'random': return '🔑 Chave Aleatória';
      default: return '🔑 Chave PIX';
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!paymentData.payment_proof_url && !paymentData.pix_code) {
      alert("❌ Por favor, envie o comprovante de pagamento PIX!");
      return;
    }

    setIsSubmitting(true);

    try {
      await Subscription.create({
        user_email: user.email,
        plan_type: selectedPlan.plan_type,
        status: "pending",
        amount_paid: selectedPlan.price,
        payment_method: "pix",
        payment_proof_url: paymentData.payment_proof_url,
        transaction_id: paymentData.asaas_payment_id || null,
        notes: paymentData.notes
      });

      alert("✅ Pagamento registrado! Aguarde a confirmação.");
      setShowPaymentModal(false);
      loadData();
    } catch (error) {
      console.error("Erro ao enviar pagamento:", error);
      alert("❌ Erro ao enviar comprovante. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPlan = getCurrentPlan();
  const planActive = isUserPlanActive();

  // ✅ NOVO: Ordenar planos - PAGOS PRIMEIRO, gratuito por último
  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      // Planos gratuitos vão para o final
      if (a.price === 0 && b.price > 0) return 1;
      if (a.price > 0 && b.price === 0) return -1;
      
      // Entre planos pagos, ordenar por order (maior primeiro)
      if (a.price > 0 && b.price > 0) {
        return (b.order || 0) - (a.order || 0); // Descending order
      }
      
      // Entre planos gratuitos, ordenar por order (menor primeiro)
      return (a.order || 0) - (b.order || 0); // Ascending order
    });
  }, [plans]);

  const allFeatures = [
    { name: "Contas Ilimitadas", free: true, monthly: true, semester: true, annual: true, lifetime: true },
    { name: "Categorias Personalizadas", free: true, monthly: true, semester: true, annual: true, lifetime: true },
    { name: "Relatórios Básicos", free: true, monthly: true, semester: true, annual: true, lifetime: true },
    { name: "Backup em Nuvem", free: false, monthly: true, semester: true, annual: true, lifetime: true },
    { name: "Metas Financeiras", free: false, monthly: true, semester: true, annual: true, lifetime: true },
    { name: "Relatórios Avançados", free: false, monthly: false, semester: true, annual: true, lifetime: true },
    { name: "Consultor IA", free: false, monthly: false, semester: true, annual: true, lifetime: true },
    { name: "Suporte Prioritário", free: false, monthly: false, semester: false, annual: false, lifetime: true },
    { name: "Acesso Vitalício", free: false, monthly: false, semester: false, annual: false, lifetime: true }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-6 py-2 mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Escolha o Melhor Plano Para Você
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Transforme Suas Finanças
            </span>
          </h1>
          
          <p className="text-purple-300 text-lg max-w-2xl mx-auto mb-8">
            Controle total, relatórios inteligentes e muito mais
          </p>

          {/* ✅ NOVO: Destacar vantagens dos planos pagos */}
          {!user?.subscription_plan && (
            <div className="max-w-3xl mx-auto mb-8 p-6 rounded-xl bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30">
              <h3 className="text-xl font-bold text-green-300 mb-3">
                💎 Por que escolher um plano Premium?
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Relatórios Avançados com IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Consultor Financeiro 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Suporte Prioritário</span>
                </div>
              </div>
            </div>
          )}

          {/* Toggle Comparação */}
          <Button
            onClick={() => setShowComparison(!showComparison)}
            variant="outline"
            className="glass-card border-purple-700/50 text-purple-200 hover:bg-purple-900/30"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showComparison ? "Ocultar" : "Ver"} Comparação Detalhada
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
          </Button>
        </motion.div>

        {/* Current Plan Info */}
        {user?.subscription_status === 'active' && user?.subscription_end_date && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <Card className="glass-card border-0 border-l-4 border-green-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-green-600/20">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-2">✅ Assinatura Ativa</h3>
                    <p className="text-green-300 mb-2">
                      Plano: <strong>{formatPlanName(user.subscription_plan)}</strong>
                    </p>
                    <p className="text-purple-300 text-sm">
                      Válido até: <strong>{new Date(user.subscription_end_date).toLocaleDateString('pt-BR')}</strong>
                    </p>
                    {(() => {
                      const daysLeft = Math.ceil((new Date(user.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24));
                      return (
                        <p className="text-cyan-300 text-sm mt-1">
                          ⏱️ Faltam <strong>{daysLeft} dias</strong> para renovação
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Comparison Table */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <Card className="glass-card border-purple-700/50">
                <CardHeader className="border-b border-purple-900/30">
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Comparação Completa de Planos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-purple-900/30">
                          <th className="p-4 text-left text-purple-200 font-semibold">Recursos</th>
                          {sortedPlans.map(plan => (
                            <th key={plan.id} className="p-4 text-center">
                              <div className="text-white font-bold">{plan.name}</div>
                              <div className="text-purple-300 text-sm mt-1">
                                {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allFeatures.map((feature, idx) => (
                          <tr key={idx} className="border-b border-purple-900/20 hover:bg-purple-900/10">
                            <td className="p-4 text-purple-200">{feature.name}</td>
                            {sortedPlans.map(plan => {
                              const planType = plan.plan_type;
                              const hasFeature = feature[planType];
                              return (
                                <td key={plan.id} className="p-4 text-center">
                                  {hasFeature ? (
                                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-red-400/40 mx-auto" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {sortedPlans.map((plan, index) => {
            const isCurrentPlan = user?.subscription_plan === plan.plan_type;
            const hasActivePlan = user?.subscription_status === 'active' && 
                                  user?.subscription_end_date && 
                                  new Date(user.subscription_end_date) > new Date();
            
            const isFreePlan = plan.price === 0;
            const isBlocked = hasActivePlan && isFreePlan;
            
            // ✅ Calcular preço original se houver desconto
            const originalPrice = plan.discount_percent > 0 
              ? plan.price / (1 - plan.discount_percent / 100) 
              : plan.price;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`${isCurrentPlan ? 'ring-2 ring-green-500' : ''} ${
                  isFreePlan ? 'opacity-75' : ''
                }`}
              >
                <Card className={`glass-card border-0 neon-glow h-full flex flex-col ${
                  plan.is_popular ? 'ring-2 ring-purple-500' : ''
                } ${plan.is_highlight ? 'ring-2 ring-yellow-500' : ''} ${
                  isBlocked ? 'opacity-60' : ''
                } ${isFreePlan ? '' : 'hover:scale-105 transition-transform'}`}>
                  
                  {isCurrentPlan && (
                    <div className="absolute top-2 right-2">
                      <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full font-bold">
                        ✅ ATIVO
                      </span>
                    </div>
                  )}

                  {isBlocked && (
                    <div className="absolute top-2 left-2">
                      <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        BLOQUEADO
                      </span>
                    </div>
                  )}

                  {plan.is_popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full font-bold">
                        ⭐ POPULAR
                      </span>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4 relative">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${plan.color_gradient} flex items-center justify-center mb-3 ${
                      isFreePlan ? '' : 'shadow-lg shadow-purple-500/50'
                    }`}>
                      <Crown className={`w-8 h-8 text-white ${isFreePlan ? '' : 'animate-pulse'}`} />
                    </div>
                    
                    <CardTitle className="text-white text-xl mb-3">{plan.name}</CardTitle>
                    
                    <div>
                      {plan.discount_percent > 0 && (
                        <p className="text-purple-400 text-lg line-through">
                          R$ {originalPrice.toFixed(2)}
                        </p>
                      )}
                      <p className="text-4xl font-bold text-white">
                        {plan.price === 0 ? 'GRÁTIS' : `R$ ${plan.price.toFixed(2)}`}
                      </p>
                      {plan.price > 0 && (
                        <p className="text-purple-300 text-sm mt-1">
                          {plan.duration_months === 999 ? '⭐ Vitalício' : 
                           plan.duration_months === 12 ? 'por ano' :
                           plan.duration_months === 6 ? 'por semestre' : 'por mês'}
                        </p>
                      )}
                      
                      {!isFreePlan && plan.duration_months >= 6 && (
                        <Badge className="mt-2 bg-green-600 text-white">
                          💰 Melhor Custo-Benefício
                        </Badge>
                      )}
                    </div>

                    {plan.discount_percent > 0 && (
                      <div className="mt-2">
                        <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full font-bold">
                          🎉 {plan.discount_percent}% OFF
                        </span>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col p-6">
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features?.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-purple-200 text-sm">
                          <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-4">
                      {isBlocked ? (
                        <div className="space-y-2">
                          <Button
                            disabled
                            className="w-full bg-gray-600 cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Bloqueado
                          </Button>
                          <p className="text-xs text-center text-red-400">
                            ⚠️ Você já possui uma assinatura ativa
                          </p>
                        </div>
                      ) : isCurrentPlan ? (
                        <Button
                          disabled
                          className="w-full bg-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Plano Atual
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSelectPlan(plan)}
                          disabled={isSubmitting}
                          className={`w-full bg-gradient-to-r ${plan.color_gradient}`}
                        >
                          {isSubmitting && selectedPlan?.id === plan.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              {hasActivePlan ? 'Fazer Upgrade' : plan.price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              <DollarSign className="w-6 h-6 inline mr-2 text-green-400" />
              Pagamento - {selectedPlan?.name}
            </DialogTitle>
          </DialogHeader>

          {isSubmitting && !paymentData.pix_code ? (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-bold text-lg mb-2">Gerando QR Code PIX...</p>
              <p className="text-purple-300 text-sm">Aguarde alguns segundos</p>
            </div>
          ) : paymentData.pix_code ? (
            /* Pagamento Asaas */
            <div className="space-y-6">
              {/* Valor */}
              <div className="text-center p-6 rounded-xl bg-green-600/20 border-2 border-green-500/40">
                <p className="text-green-300 text-sm font-semibold mb-2">💰 Valor Total</p>
                <p className="text-5xl font-bold text-white">R$ {selectedPlan.price.toFixed(2)}</p>
                <p className="text-green-300 text-sm mt-2">
                  {selectedPlan.duration_months === 999 ? '⭐ Acesso Vitalício' : `📅 ${selectedPlan.duration_months} ${selectedPlan.duration_months === 1 ? 'mês' : 'meses'}`}
                </p>
              </div>

              {/* QR Code */}
              {paymentData.pix_qrcode_base64 && (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <img
                      src={`data:image/png;base64,${paymentData.pix_qrcode_base64}`}
                      alt="QR Code PIX"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                  <p className="text-purple-400 text-sm mt-3">Escaneie com o app do seu banco</p>
                </div>
              )}

              {/* Código PIX */}
              <div>
                <Label className="text-purple-200 font-bold mb-2 block text-center">
                  Ou Copie o Código PIX
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={paymentData.pix_code}
                    readOnly
                    className="flex-1 bg-purple-900/50 border-purple-700/50 text-white font-mono text-xs"
                  />
                  <Button
                    onClick={handleCopyPixKey}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
              </div>

              {/* Instruções */}
              <div className="bg-cyan-900/20 p-5 rounded-lg border border-cyan-700/30">
                <h4 className="text-cyan-300 font-bold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Como Pagar
                </h4>
                <ol className="text-cyan-200 text-sm space-y-2 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha "PIX" → "Pagar com QR Code" ou "Pix Copia e Cola"</li>
                  <li>Escaneie o QR Code acima OU cole o código copiado</li>
                  <li>Confirme o pagamento de <strong>R$ {selectedPlan.price.toFixed(2)}</strong></li>
                  <li>✅ Sua assinatura será ativada automaticamente em até 5 minutos!</li>
                </ol>
              </div>

              {/* Pagamento Automático */}
              <div className="bg-green-900/20 p-5 rounded-lg border border-green-700/30">
                <p className="text-green-200 text-sm flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>⚡ Ativação Automática:</strong> Assim que você pagar, 
                    o sistema detecta e ativa sua assinatura instantaneamente!
                  </span>
                </p>
              </div>

              <Button
                onClick={() => setShowPaymentModal(false)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Fechar
              </Button>
            </div>
          ) : (
            /* Pagamento Manual */
            <form onSubmit={handleSubmitPayment} className="space-y-6">
              {/* Valor */}
              <div className="text-center p-6 rounded-xl bg-green-600/20 border-2 border-green-500/40">
                <p className="text-green-300 text-sm font-semibold mb-2">💰 Valor Total</p>
                <p className="text-5xl font-bold text-white">R$ {selectedPlan?.price.toFixed(2)}</p>
              </div>

              {/* Chave PIX */}
              <div>
                <Label className="text-purple-200 font-bold mb-2 block">
                  {getPixKeyTypeLabel()}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={paymentSettings.pix_key || "Não configurada"}
                    readOnly
                    className="flex-1 bg-purple-900/50 border-purple-700/50 text-white"
                  />
                  <Button
                    type="button"
                    onClick={handleCopyPixKey}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!paymentSettings.pix_key}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                {paymentSettings.pix_recipient_name && (
                  <p className="text-purple-300 text-sm mt-2">
                    👤 {paymentSettings.pix_recipient_name}
                  </p>
                )}
              </div>

              {/* Upload Comprovante */}
              <div>
                <Label className="text-purple-200 font-bold mb-2 block">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Comprovante de Pagamento *
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    onChange={handleProofUpload}
                    accept="image/*,.pdf"
                    className="flex-1 bg-purple-900/50 border-purple-700/50 text-purple-200"
                  />
                  {paymentData.payment_proof_url && (
                    <Badge className="bg-green-600 text-white">
                      <Check className="w-4 h-4 mr-1" />
                      Enviado
                    </Badge>
                  )}
                </div>
                <p className="text-purple-400 text-xs mt-2">
                  Envie o print do comprovante PIX do seu banco
                </p>
              </div>

              {/* Observações */}
              <div>
                <Label className="text-purple-200 font-bold mb-2 block">
                  Observações (Opcional)
                </Label>
                <Textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  placeholder="Alguma informação adicional..."
                  className="bg-purple-900/50 border-purple-700/50 text-white"
                  rows={3}
                />
              </div>

              {/* Instruções */}
              <div className="bg-cyan-900/20 p-5 rounded-lg border border-cyan-700/30">
                <h4 className="text-cyan-300 font-bold mb-3">📋 Como Funciona</h4>
                <ol className="text-cyan-200 text-sm space-y-2 list-decimal list-inside">
                  <li>Copie a chave PIX acima</li>
                  <li>Faça o pagamento no app do seu banco</li>
                  <li>Envie o comprovante aqui</li>
                  <li>Aguarde a aprovação do admin (até 24h)</li>
                </ol>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border-purple-700/50 text-purple-200 hover:bg-purple-900/30"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90"
                  disabled={isSubmitting || !paymentData.payment_proof_url}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Enviar Comprovante
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
