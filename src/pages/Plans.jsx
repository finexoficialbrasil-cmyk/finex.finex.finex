import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/entities/User";
import { SystemPlan } from "@/entities/SystemPlan";
import { Subscription } from "@/entities/Subscription";
import { SystemSettings } from "@/entities/SystemSettings";
import XhopanPaymentFlow from "@/components/XhopanPaymentFlow.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UploadFile } from "@/integrations/Core";
import { asaasCreatePayment } from "@/functions/asaasCreatePayment";
import { base44 } from "@/api/base44Client";
import { xhopanPayment } from "@/functions/xhopanPayment";
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
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ NOVA FUNÇÃO: Calcular dias restantes SEM conversão de timezone
const calculateDaysLeft = (endDateString) => {
  if (!endDateString) return 0;
  
  try {
    // Parse the date string as YYYY-MM-DD
    const [year, month, day] = endDateString.split('-').map(Number);
    // Create a Date object in local timezone
    // Month is 0-indexed in Date constructor, so month - 1
    const endDate = new Date(year, month - 1, day);
    
    const now = new Date();
    // Create a Date object for today, also in local timezone
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate difference in milliseconds
    const diffTime = endDate.getTime() - today.getTime();
    // Convert to days and ceil to count partial days as a full day left
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (e) {
    return 0;
  }
};

// ✅ FUNÇÃO CORRIGIDA: NUNCA dar trial para quem já teve plano pago
const hasActiveAccess = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // ✅ VERIFICAR TRIAL
  if (user.subscription_status === 'trial' && user.trial_ends_at) {
    try {
      const [year, month, day] = user.trial_ends_at.split('-').map(Number);
      const trialEnd = new Date(year, month - 1, day);
      return trialEnd >= today;
    } catch (e) {
      return false;
    }
  }
  
  // ✅ VERIFICAR ASSINATURA PAGA
  if (user.subscription_status === 'active' && user.subscription_end_date) {
    try {
      const [year, month, day] = user.subscription_end_date.split('-').map(Number);
      const endDate = new Date(year, month - 1, day);
      return endDate >= today;
    } catch (e) {
      return false;
    }
  }
  
  return false;
};

export default function Plans() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({});
  const [showComparison, setShowComparison] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // ✅ NOVO: Estado para mensagem de erro
  const [paymentData, setPaymentData] = useState({
    payment_proof_url: "",
    notes: "",
    pix_code: "",
    pix_qrcode_base64: "",
    asaas_payment_id: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("pix"); // "pix" ou "xhopan"
  const [xhopanState, setXhopanState] = useState({
    loading: false,
    token: null,
    qrcode: null,
    qrcode_base64: null,
    balance: null,
    confirmed: false,
    error: null
  });

  useEffect(() => {
    loadData();
    document.title = "Planos - FINEX";
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
        if (s.key.startsWith('pix_') || s.key.startsWith('asaas_') || s.key === 'payment_mode') { // ✅ NOVO
          pixConfig[s.key] = s.value;
        }
      });
      
      setPaymentSettings(pixConfig);
      console.log("✅ Configurações carregadas:", pixConfig);
      console.log("🔧 Modo de pagamento:", pixConfig.payment_mode || "manual"); // ✅ NOVO
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const getCurrentPlan = () => {
    if (!user || !user.subscription_plan) return null;
    return plans.find(p => p.plan_type === user.subscription_plan);
  };

  const getPlanValue = (planType) => {
    const values = {
      'monthly': 1,
      'semester': 2,
      'annual': 3,
      'lifetime': 4
    };
    return values[planType] || 0;
  };

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
      // ✅ CRÍTICO: Verificar se JÁ USOU o plano FREE antes
      // Um usuário já usou o trial se:
      // 1. Ele tem um registro em trial_started_at
      // 2. O subscription_plan dele é 'free' (mesmo que trial_started_at não esteja setado, indica que ele pegou um plano "gratuito")
      // 3. Ele teve um plano pago antes (indicado por subscription_plan não 'free' e existente)
      const alreadyUsedFreeTrial = user?.trial_started_at || 
                                   user?.subscription_plan === 'free' ||
                                   (user?.subscription_plan && user?.subscription_plan !== 'free');
      
      // ✅ BLOQUEAR TRIAL se já usou antes (trial OU plano pago)
      if (plan.price === 0 && alreadyUsedFreeTrial) {
        let message = '❌ ACESSO AO TRIAL BLOQUEADO!\n\n';
        
        if (user.trial_started_at) {
          message += '🔒 Você já usou o período de teste gratuito anteriormente.\n\n';
        } else if (user.subscription_plan && user.subscription_plan !== 'free') {
          message += '🔒 Você já teve uma assinatura paga anteriormente.\n\n';
        }
        
        message += '⚠️ O trial de 3 dias é ÚNICO e pode ser usado apenas UMA VEZ.\n\n';
        message += '💡 Escolha um plano pago para continuar usando o sistema.';
        
        alert(message);
        return;
      }
      
      // ✅ Se tem acesso ativo
      if (hasActiveAccess(user)) {
        // ✅ Se está tentando escolher plano free (e o bloqueio acima já não pegou)
        if (plan.price === 0) {
          alert(`❌ BLOQUEADO!\n\n🔒 Você já possui acesso ativo ao sistema.\n\n⚠️ Não é possível ativar o plano gratuito enquanto seu acesso estiver ativo.\n\n💡 Aguarde o vencimento ou entre em contato com o suporte.`);
          return;
        }
        
        // ✅ Se está tentando fazer downgrade
        const currentPlanValue = getPlanValue(user.subscription_plan);
        const newPlanValue = getPlanValue(plan.plan_type);
        
        if (newPlanValue < currentPlanValue) {
          if (!confirm(`⚠️ ATENÇÃO: DOWNGRADE\n\nVocê está tentando mudar de um plano SUPERIOR para um plano INFERIOR.\n\nPlano atual: ${formatPlanName(user.subscription_plan)}\nNovo plano: ${plan.name}\n\n🔄 O downgrade só terá efeito após o vencimento da sua assinatura atual.\n\nDeseja continuar?`)) {
            return;
          }
        }
      }

      setSelectedPlan(plan);

      if (plan.price === 0) {
        handleActivateFreePlan(plan);
        return;
      }

      // ✅ SEMPRE USAR MODO MANUAL
      console.log("📝 Usando pagamento manual");
      setPaymentData({
        payment_proof_url: "",
        notes: "",
        pix_code: "",
        pix_qrcode_base64: "",
        asaas_payment_id: ""
      });
      setPaymentMethod("pix");
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Erro ao selecionar plano:", error);
      alert("Erro ao processar. Tente novamente.");
    }
  };

  const handleAsaasPayment = async (plan) => {
    setIsSubmitting(true);
    setSelectedPlan(plan);
    setShowPaymentModal(true);
    setErrorMessage(""); // ✅ LIMPAR erro anterior

    try {
      console.log("📊 Dados do usuário:", {
        email: user.email,
        full_name: user.full_name,
        phone: user.phone
      });

      console.log("🔧 Configurações:", {
        mode: paymentSettings.payment_mode,
        has_key: !!paymentSettings.asaas_api_key,
        key_preview: paymentSettings.asaas_api_key?.substring(0, 20) + "..."
      });

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

      console.log("🔄 Payload completo:", JSON.stringify(paymentPayload, null, 2));
      console.log("🔄 Chamando asaasCreatePayment...");

      // ✅ CORRIGIDO: Chamar função diretamente importada
      const responseData = await asaasCreatePayment(paymentPayload);
      const response = responseData.data; // A resposta vem em .data

      console.log("📦 Resposta completa:", response);
      console.log("📊 Status:", response?.status);
      console.log("✅ Success:", response?.success);
      console.log("❌ Error:", response?.error);

      // ✅ TRATAMENTO MAIS ROBUSTO
      if (response?.success === true) {
        console.log("✅ Pagamento criado com sucesso!");
        
        // Criar registro de assinatura pendente
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
        // ✅ ERRO MAIS DETALHADO
        const errorMsg = response?.error || response?.message || "Erro desconhecido ao criar pagamento";
        const errorDetails = response?.details || "";
        
        console.error("❌ Erro na resposta:", errorMsg);
        console.error("📋 Detalhes:", errorDetails);
        
        throw new Error(`${errorMsg}\n\n${errorDetails}`);
      }
    } catch (error) {
      console.error("❌ ERRO CAPTURADO:", error);
      console.error("📋 Tipo:", error.constructor.name);
      console.error("📋 Mensagem:", error.message);
      console.error("📋 Stack:", error.stack);
      
      // ✅ MOSTRAR ERRO DETALHADO
      const errorText = `❌ Erro ao criar pagamento:\n\n${error.message}\n\nPor favor:\n1. Verifique se a API Key do Asaas está configurada\n2. Verifique se está no ambiente correto (sandbox/produção)\n3. Entre em contato com o suporte se o problema persistir`;
      
      setErrorMessage(errorText);
      alert(errorText);
      setShowPaymentModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateFreePlan = async (plan) => {
    try {
      console.log("🆓 Tentando ativar plano FREE...");
      
      // ✅ DUPLA VERIFICAÇÃO: Não pode ativar se já usou trial antes (via user.trial_started_at)
      if (user.trial_started_at) {
        alert(`❌ BLOQUEADO!\n\n🔒 Você já usou o trial de 3 dias anteriormente.\n\n⚠️ O trial só pode ser usado UMA VEZ por usuário.\n\n💡 Escolha um plano pago para continuar.`);
        return;
      }
      
      // ✅ Não pode ativar se já teve plano pago (via user.subscription_plan)
      if (user.subscription_plan && user.subscription_plan !== 'free') {
        alert(`❌ BLOQUEADO!\n\n🔒 Você já teve uma assinatura paga anteriormente.\n\n⚠️ Não é possível ativar o trial gratuito novamente.\n\n💡 Escolha um plano pago para renovar.`);
        return;
      }
      
      // ✅ VERIFICAR NO BANCO: Se já existe algum registro de trial na tabela Subscriptions
      try {
        const allSubscriptions = await Subscription.list();
        const userSubscriptions = allSubscriptions.filter(s => s.user_email === user.email);
        const hadFreeTrial = userSubscriptions.some(s => s.payment_method === 'free');
        
        if (hadFreeTrial) {
          console.log(`🚫 Usuário ${user.email} já tinha trial no histórico de subscriptions!`);
          alert(`❌ BLOQUEADO!\n\n🔒 Detectamos que você já usou o trial gratuito anteriormente.\n\n⚠️ O trial é ÚNICO e não pode ser ativado novamente.\n\n💡 Escolha um plano pago para continuar.`);
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar histórico de trials:", error);
        // Não bloquear completamente, mas logar o erro
      }
      
      console.log("✅ Usuário NUNCA usou trial. Ativando...");
      
      // ✅ FREE = TRIAL de 3 dias (apenas para NOVOS usuários)
      const now = new Date();
      const trialStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + 3); // 3 dias
      
      const trialStartStr = `${trialStart.getFullYear()}-${String(trialStart.getMonth() + 1).padStart(2, '0')}-${String(trialStart.getDate()).padStart(2, '0')}`;
      const trialEndStr = `${trialEnd.getFullYear()}-${String(trialEnd.getMonth() + 1).padStart(2, '0')}-${String(trialEnd.getDate()).padStart(2, '0')}`;
      
      // ✅ ATIVAR TRIAL - Agora SÓ SE NUNCA USOU ANTES
      await User.updateMyUserData({
        subscription_plan: null, // ✅ SEM plano específico (o acesso é o trial)
        subscription_status: 'trial', // ✅ Status TRIAL
        subscription_end_date: null, // ✅ SEM data de vencimento de assinatura paga
        trial_started_at: trialStartStr, // ✅ MARCA QUE JÁ USOU
        trial_ends_at: trialEndStr
      });

      await Subscription.create({
        user_email: user.email,
        plan_type: plan.plan_type,
        status: "active",
        amount_paid: 0,
        payment_method: "free",
        notes: "Trial de 3 dias ativado - ÚNICO USO"
      });

      alert(`✅ Trial de 3 dias ativado!\n\n🎉 Você tem acesso completo até ${trialEnd.toLocaleDateString('pt-BR')}.\n\n⚠️ IMPORTANTE: Este é seu ÚNICO trial. Após o vencimento, escolha um plano pago para continuar.\n\nAtualize a página para começar!`);
      loadData();
    } catch (error) {
      console.error("Erro ao ativar trial:", error);
      alert("❌ Erro ao ativar trial.");
    }
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Upload do arquivo
      const { file_url } = await UploadFile({ file });
      setPaymentData({ ...paymentData, payment_proof_url: file_url });
      
      // ✅ Validação rápida com IA (só para dar feedback)
      try {
        const quickCheck = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise esta imagem rapidamente e responda:
          
          1. É um comprovante bancário PIX válido?
          2. Tem as informações básicas visíveis (valor, banco, data)?
          
          Retorne JSON curto.`,
          add_context_from_internet: false,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              is_valid_receipt: { type: "boolean" },
              message: { type: "string" }
            },
            required: ["is_valid_receipt", "message"]
          }
        });

        if (quickCheck.is_valid_receipt) {
          setErrorMessage(""); // Limpar erro anterior
        } else {
          setErrorMessage(`⚠️ ATENÇÃO: ${quickCheck.message}\n\nSe você tem certeza que é um comprovante válido, pode continuar.`);
        }
      } catch (aiError) {
        console.log("Erro na validação rápida:", aiError);
        // Continuar mesmo se a validação falhar
      }
      
    } catch (error) {
      setErrorMessage("❌ Erro ao fazer upload. Tente novamente.");
    } finally {
      setIsSubmitting(false);
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

    if (!paymentData.payment_proof_url) {
      alert("❌ Por favor, envie o comprovante de pagamento PIX!");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🤖 Analisando comprovante com IA...");
      
      // Criar subscription
      const subscriptionData = {
        user_email: user.email,
        plan_type: selectedPlan.plan_type,
        status: "pending",
        amount_paid: selectedPlan.price,
        payment_method: "pix",
        payment_proof_url: paymentData.payment_proof_url,
        notes: paymentData.notes || `Aguardando análise - ${selectedPlan.name}`
      };
      
      const newSubscription = await Subscription.create(subscriptionData);

      // Processar com IA
      const response = await base44.functions.invoke('processPaymentProof', {
        subscription_id: newSubscription.id,
        proof_url: paymentData.payment_proof_url,
        expected_amount: selectedPlan.price,
        plan_type: selectedPlan.plan_type
      });

      const result = response.data;

      // 🚫 COMPROVANTE DUPLICADO
      if (result.duplicate_proof) {
        await Subscription.delete(newSubscription.id);
        setErrorMessage(`DUPLICATE:${result.used_by_email}`);
        setIsSubmitting(false);
        return;
      }

      if (result.success && result.auto_approved) {
        // ✅ APROVADO - Mostrar sucesso e recarregar
        setShowPaymentModal(false);
        setErrorMessage("");
        
        alert(`✅ COMPROVANTE APROVADO!\n\n🎉 Sua assinatura foi ativada!\n\n📊 Plano: ${selectedPlan.name}\n💰 Valor: R$ ${selectedPlan.price.toFixed(2)}\n📅 Válido até: ${new Date(result.activation.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}\n\n🚀 Recarregando...`);
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // ❌ RECUSADO - Mostrar tarja vermelha no modal
        setErrorMessage(
          `❌ COMPROVANTE RECUSADO\n\n` +
          `⚠️ Seu comprovante não atende aos padrões exigidos.\n\n` +
          `📋 Motivos possíveis:\n` +
          `• Valor diferente de R$ ${selectedPlan.price.toFixed(2)}\n` +
          `• Nome do recebedor incorreto\n` +
          `• Data fora das últimas 24 horas\n` +
          `• Não é um comprovante PIX válido\n\n` +
          `⏳ PRÓXIMOS PASSOS:\n` +
          `🔍 Um administrador analisará seu comprovante em até 24 horas.\n` +
          `📞 Ou entre em contato com o suporte:\n` +
          `💬 WhatsApp: (65) 98129-7511`
        );
        
        // Manter modal aberto para o usuário ver o erro
        setIsSubmitting(false);
      }
      
    } catch (error) {
      console.error("❌ ERRO:", error);
      alert(`❌ Erro ao processar.\n\n${error.message}\n\nO admin revisará manualmente.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPlan = getCurrentPlan();
  const hasUserActiveAccess = hasActiveAccess(user); // ✅ USAR NOVA FUNÇÃO

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

          {!hasUserActiveAccess && (
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

        {/* Current Plan Info - Trial */}
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
                    <h3 className="text-white font-bold text-lg mb-2">🎁 Trial Gratuito Ativo</h3>
                    <p className="text-yellow-300 mb-2">
                      Você tem acesso completo a TODAS as funcionalidades!
                    </p>
                    <p className="text-purple-300 text-sm">
                      Válido até: <strong>{new Date(user.trial_ends_at + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
                    </p>
                    {(() => {
                      const daysLeft = calculateDaysLeft(user.trial_ends_at);
                      return (
                        <p className="text-cyan-300 text-sm mt-1">
                          ⏱️ Faltam <strong>{daysLeft} dias</strong> de teste grátis
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Current Plan Info - Active Subscription */}
        {hasUserActiveAccess && user?.subscription_status === 'active' && user?.subscription_end_date && (() => {
          const daysLeft = calculateDaysLeft(user.subscription_end_date);
          const needsRenewal = daysLeft <= 30; // Considera "precisa renovar" quando faltam 30 dias ou menos
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto mb-8"
            >
              <Card className={`glass-card border-0 border-l-4 ${needsRenewal ? 'border-yellow-500' : 'border-green-500'}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${needsRenewal ? 'bg-yellow-600/20' : 'bg-green-600/20'}`}>
                      {needsRenewal ? (
                        <AlertTriangle className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-2">
                        {needsRenewal ? '⚠️ Renovação Necessária' : '✅ Assinatura Ativa'}
                      </h3>
                      <p className={needsRenewal ? 'text-yellow-300 mb-2' : 'text-green-300 mb-2'}>
                        Plano: <strong>{formatPlanName(user.subscription_plan)}</strong>
                      </p>
                      <p className="text-purple-300 text-sm">
                        Válido até: <strong>{new Date(user.subscription_end_date + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
                      </p>
                      <p className={`text-sm mt-1 font-bold ${daysLeft <= 7 ? 'text-red-400' : needsRenewal ? 'text-yellow-300' : 'text-cyan-300'}`}>
                        ⏱️ Faltam <strong>{daysLeft} dias</strong> {needsRenewal ? '- Renove agora!' : 'para renovação'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

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
            const hasActivePlan = hasActiveAccess(user); // ✅ USAR NOVA FUNÇÃO
            
            const isFreePlan = plan.price === 0;
            
            // ✅ Calcular dias restantes para renovação
            const daysLeft = user?.subscription_end_date ? calculateDaysLeft(user.subscription_end_date) : 999;
            const needsRenewal = daysLeft <= 30; // Menos de 30 dias = precisa renovar
            
            // ✅ NOVO: Verificar se já usou trial ANTES
            const alreadyUsedFreeTrial = user?.trial_started_at || 
                                         user?.subscription_plan === 'free' ||
                                         (user?.subscription_plan && user?.subscription_plan !== 'free');
            
            // ✅ Bloquear FREE se:
            // 1. Tem acesso ativo (a qualquer plano) OU
            // 2. Já usou trial antes (marcado em user.trial_started_at ou histórico)
            const isBlocked = isFreePlan && (hasActivePlan || alreadyUsedFreeTrial);
            
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
                  
                  {isCurrentPlan && hasActiveAccess(user) && (
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

                  {plan.is_popular && !isBlocked && (
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
                      
                      {isFreePlan && !isBlocked && (
                        <p className="text-yellow-300 text-sm mt-1">
                          🎁 3 dias de teste - ÚNICO USO
                        </p>
                      )}
                      
                      {isFreePlan && isBlocked && alreadyUsedFreeTrial && (
                        <p className="text-red-300 text-xs mt-2 font-bold">
                          ⚠️ JÁ UTILIZADO
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
                            {alreadyUsedFreeTrial && isFreePlan ? 
                              '⚠️ Trial já foi utilizado' : 
                              '⚠️ Você já possui acesso ativo'}
                          </p>
                        </div>
                      ) : isCurrentPlan && !needsRenewal ? (
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
                          className={`w-full bg-gradient-to-r ${plan.color_gradient} ${needsRenewal && isCurrentPlan ? 'animate-pulse' : ''}`}
                        >
                          {isSubmitting && selectedPlan?.id === plan.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              {isCurrentPlan && needsRenewal ? '🔄 Renovar Agora' : hasActivePlan ? 'Fazer Upgrade' : plan.price === 0 ? '🎁 Testar 3 Dias Grátis' : 'Assinar Agora'}
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

          {/* ✅ Mostrar erro se houver */}
          {errorMessage && errorMessage.startsWith("DUPLICATE:") ? (
            <div className="bg-red-950/60 border-2 border-red-500 rounded-xl p-5 mb-4 shadow-lg shadow-red-900/40">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <p className="text-red-300 font-bold text-lg mb-1">⛔ Comprovante Já Utilizado!</p>
                  <p className="text-red-200 text-sm mb-3">
                    Este comprovante de pagamento já foi usado para ativar outra conta.
                  </p>
                  <div className="bg-red-900/50 border border-red-600/50 rounded-lg px-4 py-3 inline-block">
                    <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-1">Conta que utilizou este comprovante:</p>
                    <p className="text-red-200 font-bold text-base tracking-wide">
                      {errorMessage.replace("DUPLICATE:", "")}
                    </p>
                  </div>
                  <p className="text-red-300 text-xs mt-3">
                    Por favor, envie um comprovante diferente ou entre em contato com o suporte.
                  </p>
                </div>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-red-300 font-bold mb-2">Erro no Pagamento</p>
                  <p className="text-red-200 text-sm whitespace-pre-line">{errorMessage}</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* ✅ Seleção de Método de Pagamento */}
          {!paymentData.pix_code && (
            <div className="flex gap-3 mb-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === "pix"
                    ? "border-green-500 bg-green-900/30 text-green-300"
                    : "border-purple-700/40 bg-purple-900/20 text-purple-300 hover:border-purple-500"
                }`}
              >
                <span className="text-lg">💳</span>
                <span className="font-semibold text-sm">PIX Manual</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("xhopan")}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === "xhopan"
                    ? "border-cyan-500 bg-cyan-900/30 text-cyan-300"
                    : "border-purple-700/40 bg-purple-900/20 text-purple-300 hover:border-cyan-500"
                }`}
              >
                <span className="text-lg">🏦</span>
                <span className="font-semibold text-sm">Banco Xhopan</span>
              </button>
            </div>
          )}

          {paymentMethod === "xhopan" && !paymentData.pix_code ? (
            /* Pagamento via Banco Xhopan - QR Code de saldo */
            <XhopanPaymentFlow
              selectedPlan={selectedPlan}
              user={user}
              xhopanState={xhopanState}
              setXhopanState={setXhopanState}
              onSuccess={async () => {
                // Cria subscription e ativa
                try {
                  const sub = await Subscription.create({
                    user_email: user.email,
                    plan_type: selectedPlan.plan_type,
                    status: "pending",
                    amount_paid: selectedPlan.price,
                    payment_method: "pix",
                    notes: `Pagamento via Banco Xhopan - token: ${xhopanState.token}`
                  });
                  const response = await base44.functions.invoke('processPaymentProof', {
                    subscription_id: sub.id,
                    proof_url: null,
                    expected_amount: selectedPlan.price,
                    plan_type: selectedPlan.plan_type,
                    xhopan_confirmed: true
                  });
                  setShowPaymentModal(false);
                  alert(`✅ Pagamento confirmado!\n\n🎉 Sua assinatura ${selectedPlan.name} foi ativada!\n\n🚀 Recarregando...`);
                  setTimeout(() => window.location.reload(), 1500);
                } catch (err) {
                  alert("❌ Erro ao ativar assinatura: " + err.message);
                }
              }}
              onCancel={() => setShowPaymentModal(false)}
            />
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
                    disabled={isSubmitting}
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

                {/* Preview do Comprovante */}
                {paymentData.payment_proof_url && (
                  <div className="mt-3 p-3 rounded-lg bg-purple-900/30 border border-purple-700/50">
                    <p className="text-purple-200 text-sm font-bold mb-2">📄 Comprovante Enviado:</p>
                    <img 
                      src={paymentData.payment_proof_url}
                      alt="Comprovante"
                      className="w-full max-h-64 object-contain rounded border border-purple-700/50 bg-black/20"
                    />
                  </div>
                )}
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
                <h4 className="text-cyan-300 font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Como Funciona - Ativação Automática por IA
                </h4>
                <ol className="text-cyan-200 text-sm space-y-2 list-decimal list-inside">
                  <li>Copie a chave PIX acima</li>
                  <li>Faça o pagamento de <strong>EXATAMENTE R$ {selectedPlan?.price.toFixed(2)}</strong></li>
                  <li>Tire um print do comprovante e envie aqui</li>
                  <li>🤖 Nossa IA analisa o comprovante INSTANTANEAMENTE</li>
                  <li>✅ Se o valor corresponder, sua assinatura é ATIVADA AUTOMATICAMENTE!</li>
                </ol>
                <div className="mt-3 p-3 bg-green-900/30 rounded-lg border border-green-700/40">
                  <p className="text-green-300 text-xs flex items-start gap-2">
                    <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>IMPORTANTE:</strong> Pague o valor EXATO (R$ {selectedPlan?.price.toFixed(2)}) 
                      para ativação automática. Caso o valor seja diferente, o admin fará a revisão manual.
                    </span>
                  </p>
                </div>
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
                      Analisando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Enviar e Analisar
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