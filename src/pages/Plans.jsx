import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Crown,
  Check,
  Sparkles,
  Upload,
  Copy,
  Loader2,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  FileText,
  Zap,
  Lock,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const calculateDaysLeft = (endDateString) => {
  if (!endDateString) return 0;
  const [year, month, day] = endDateString.split('-').map(Number);
  const endDate = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const hasActiveAccess = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (user.subscription_status === 'trial' && user.trial_ends_at) {
    const [year, month, day] = user.trial_ends_at.split('-').map(Number);
    const trialEnd = new Date(year, month - 1, day);
    return trialEnd >= today;
  }
  
  if (user.subscription_status === 'active' && user.subscription_end_date) {
    const [year, month, day] = user.subscription_end_date.split('-').map(Number);
    const endDate = new Date(year, month - 1, day);
    return endDate >= today;
  }
  
  return false;
};

export default function Plans() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentData, setPaymentData] = useState({
    payment_proof_url: "",
    notes: "",
    pix_code: "",
    pix_qrcode_base64: "",
    asaas_payment_id: ""
  });

  useEffect(() => {
    document.title = "Planos - FINEX";
  }, []);

  // ✅ OTIMIZADO: React Query com cache
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['plans-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5,
    retry: 1
  });

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['system-plans'],
    queryFn: async () => {
      const { SystemPlan } = await import("@/entities/SystemPlan");
      const allPlans = await SystemPlan.list("order");
      return allPlans.filter(p => p.is_active);
    },
    staleTime: 1000 * 60 * 10, // ✅ 10 min - planos mudam pouco
    enabled: !!user
  });

  const { data: paymentSettings = {} } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const { SystemSettings } = await import("@/entities/SystemSettings");
      const settings = await SystemSettings.list();
      const pixConfig = {};
      settings.forEach(s => {
        if (s.key.startsWith('pix_') || s.key.startsWith('asaas_') || s.key === 'payment_mode') {
          pixConfig[s.key] = s.value;
        }
      });
      return pixConfig;
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!user
  });

  const isLoading = loadingUser || loadingPlans;

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      if (a.price === 0 && b.price > 0) return 1;
      if (a.price > 0 && b.price === 0) return -1;
      if (a.price > 0 && b.price > 0) {
        return (b.order || 0) - (a.order || 0);
      }
      return (a.order || 0) - (b.order || 0);
    });
  }, [plans]);

  const handleSelectPlan = async (plan) => {
    try {
      const alreadyUsedFreeTrial = user?.trial_started_at || 
                                   user?.subscription_plan === 'free' ||
                                   (user?.subscription_plan && user?.subscription_plan !== 'free');
      
      if (plan.price === 0 && alreadyUsedFreeTrial) {
        alert('❌ O trial de 3 dias é ÚNICO e pode ser usado apenas UMA VEZ.\n\n💡 Escolha um plano pago para continuar.');
        return;
      }
      
      if (hasActiveAccess(user)) {
        if (plan.price === 0) {
          alert(`❌ BLOQUEADO!\n\n🔒 Você já possui acesso ativo.\n\n⚠️ Não é possível ativar o plano gratuito enquanto seu acesso estiver ativo.`);
          return;
        }
      }

      setSelectedPlan(plan);

      if (plan.price === 0) {
        handleActivateFreePlan(plan);
        return;
      }

      const mode = paymentSettings.payment_mode || "manual";
      
      if (mode === "automatic" && paymentSettings.asaas_api_key) {
        handleAsaasPayment(plan);
      } else {
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
    setErrorMessage("");

    try {
      const { asaasCreatePayment } = await import("@/functions/asaasCreatePayment");
      
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

      const responseData = await asaasCreatePayment(paymentPayload);
      const response = responseData.data;

      if (response?.success === true) {
        const { Subscription } = await import("@/entities/Subscription");
        await Subscription.create({
          user_email: user.email,
          plan_type: plan.plan_type,
          status: "pending",
          amount_paid: plan.price,
          payment_method: "pix",
          transaction_id: response.payment_id,
          notes: `Pagamento Asaas ID: ${response.payment_id}`
        });

        setPaymentData({
          payment_proof_url: "",
          notes: "",
          pix_code: response.pix_code,
          pix_qrcode_base64: response.pix_qrcode_base64,
          asaas_payment_id: response.payment_id
        });
      } else {
        const errorMsg = response?.error || response?.message || "Erro desconhecido";
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("❌ Erro ao criar pagamento:", error);
      setErrorMessage(error.message);
      alert(`❌ Erro: ${error.message}`);
      setShowPaymentModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateFreePlan = async (plan) => {
    try {
      if (user.trial_started_at) {
        alert(`❌ Você já usou o trial de 3 dias.\n\n⚠️ O trial só pode ser usado UMA VEZ.`);
        return;
      }
      
      if (user.subscription_plan && user.subscription_plan !== 'free') {
        alert(`❌ Você já teve uma assinatura paga.\n\n⚠️ Trial não disponível.`);
        return;
      }
      
      try {
        const { Subscription } = await import("@/entities/Subscription");
        const allSubscriptions = await Subscription.list();
        const userSubscriptions = allSubscriptions.filter(s => s.user_email === user.email);
        const hadFreeTrial = userSubscriptions.some(s => s.payment_method === 'free');
        
        if (hadFreeTrial) {
          alert(`❌ Trial já utilizado anteriormente.`);
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar:", error);
      }
      
      const now = new Date();
      const trialStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + 3);
      
      const trialStartStr = `${trialStart.getFullYear()}-${String(trialStart.getMonth() + 1).padStart(2, '0')}-${String(trialStart.getDate()).padStart(2, '0')}`;
      const trialEndStr = `${trialEnd.getFullYear()}-${String(trialEnd.getMonth() + 1).padStart(2, '0')}-${String(trialEnd.getDate()).padStart(2, '0')}`;
      
      const { User } = await import("@/entities/User");
      await User.updateMyUserData({
        subscription_plan: null,
        subscription_status: 'trial',
        subscription_end_date: null,
        trial_started_at: trialStartStr,
        trial_ends_at: trialEndStr
      });

      const { Subscription } = await import("@/entities/Subscription");
      await Subscription.create({
        user_email: user.email,
        plan_type: plan.plan_type,
        status: "active",
        amount_paid: 0,
        payment_method: "free",
        notes: "Trial de 3 dias ativado - ÚNICO USO"
      });

      alert(`✅ Trial ativado até ${trialEnd.toLocaleDateString('pt-BR')}!`);
      window.location.reload();
    } catch (error) {
      console.error("Erro:", error);
      alert("❌ Erro ao ativar trial.");
    }
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { UploadFile } = await import("@/integrations/Core");
      const { file_url } = await UploadFile({ file });
      setPaymentData({ ...paymentData, payment_proof_url: file_url });
      alert("✅ Comprovante carregado!");
    } catch (error) {
      alert("❌ Erro ao fazer upload.");
    }
  };

  const handleCopyPixKey = () => {
    const keyToCopy = paymentData.pix_code || paymentSettings.pix_key;
    if (keyToCopy) {
      navigator.clipboard.writeText(keyToCopy);
      alert("✅ Chave PIX copiada!");
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!paymentData.payment_proof_url && !paymentData.pix_code) {
      alert("❌ Envie o comprovante PIX!");
      return;
    }

    setIsSubmitting(true);

    try {
      const { Subscription } = await import("@/entities/Subscription");
      await Subscription.create({
        user_email: user.email,
        plan_type: selectedPlan.plan_type,
        status: "pending",
        amount_paid: selectedPlan.price,
        payment_method: "pix",
        payment_proof_url: paymentData.payment_proof_url,
        transaction_id: paymentData.asaas_payment_id || null,
        notes: paymentData.notes || `Pagamento manual - ${selectedPlan.name}`
      });

      alert(`✅ Pagamento registrado!\n\n⏱️ Aguarde análise (até 24h).`);
      setShowPaymentModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Erro:", error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-purple-300">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-6 py-2 mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Escolha o Melhor Plano
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Planos FINEX
            </span>
          </h1>
          
          <p className="text-purple-300 text-lg max-w-2xl mx-auto">
            Controle total das suas finanças
          </p>
        </motion.div>

        {/* Current Plan Info */}
        {user?.subscription_status === 'trial' && user?.trial_ends_at && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <Card className="glass-card border-0 border-l-4 border-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-yellow-600/20">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-2">🎁 Trial Ativo</h3>
                    <p className="text-yellow-300 mb-2">
                      Acesso completo até: <strong>{new Date(user.trial_ends_at + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
                    </p>
                    <p className="text-cyan-300 text-sm">
                      ⏱️ Faltam <strong>{calculateDaysLeft(user.trial_ends_at)} dias</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {hasActiveAccess(user) && user?.subscription_status === 'active' && user?.subscription_end_date && (
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
                      Válido até: <strong>{new Date(user.subscription_end_date + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
                    </p>
                    <p className="text-cyan-300 text-sm">
                      ⏱️ Faltam <strong>{calculateDaysLeft(user.subscription_end_date)} dias</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {sortedPlans.map((plan, index) => {
            const isCurrentPlan = user?.subscription_plan === plan.plan_type;
            const hasActivePlan = hasActiveAccess(user);
            const isFreePlan = plan.price === 0;
            const alreadyUsedFreeTrial = user?.trial_started_at || 
                                         user?.subscription_plan === 'free' ||
                                         (user?.subscription_plan && user?.subscription_plan !== 'free');
            const isBlocked = isFreePlan && (hasActivePlan || alreadyUsedFreeTrial);

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
                } ${isBlocked ? 'opacity-60' : ''}`}>
                  
                  {isBlocked && (
                    <div className="absolute top-2 left-2">
                      <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        BLOQUEADO
                      </span>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${plan.color_gradient} flex items-center justify-center mb-3`}>
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    
                    <CardTitle className="text-white text-xl mb-3">{plan.name}</CardTitle>
                    
                    <div>
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
                    </div>
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
                        <Button disabled className="w-full bg-gray-600">
                          <Lock className="w-4 h-4 mr-2" />
                          Bloqueado
                        </Button>
                      ) : isCurrentPlan ? (
                        <Button disabled className="w-full bg-green-600">
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
                              {plan.price === 0 ? '🎁 Testar Grátis' : 'Assinar'}
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

      {/* Payment Modal - Simplificado, igual ao anterior mas sem logs excessivos */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              <DollarSign className="w-6 h-6 inline mr-2 text-green-400" />
              Pagamento - {selectedPlan?.name}
            </DialogTitle>
          </DialogHeader>

          {errorMessage && (
            <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-red-300 font-bold mb-2">Erro no Pagamento</p>
                  <p className="text-red-200 text-sm whitespace-pre-line">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {isSubmitting && !paymentData.pix_code ? (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-bold text-lg">Gerando QR Code PIX...</p>
            </div>
          ) : paymentData.pix_code ? (
            <div className="space-y-6">
              <div className="text-center p-6 rounded-xl bg-green-600/20 border-2 border-green-500/40">
                <p className="text-green-300 text-sm font-semibold mb-2">💰 Valor Total</p>
                <p className="text-5xl font-bold text-white">R$ {selectedPlan.price.toFixed(2)}</p>
              </div>

              {paymentData.pix_qrcode_base64 && (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <img
                      src={`data:image/png;base64,${paymentData.pix_qrcode_base64}`}
                      alt="QR Code PIX"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                  <p className="text-purple-400 text-sm mt-3">Escaneie com seu banco</p>
                </div>
              )}

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
                  <Button onClick={handleCopyPixKey} className="bg-green-600 hover:bg-green-700">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => setShowPaymentModal(false)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Fechar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitPayment} className="space-y-6">
              <div className="text-center p-6 rounded-xl bg-green-600/20 border-2 border-green-500/40">
                <p className="text-5xl font-bold text-white">R$ {selectedPlan?.price.toFixed(2)}</p>
              </div>

              <div>
                <Label className="text-purple-200 font-bold mb-2 block">Chave PIX</Label>
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
              </div>

              <div>
                <Label className="text-purple-200 font-bold mb-2 block">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Comprovante *
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
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border-purple-700 text-purple-200"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
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
                      Enviar
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