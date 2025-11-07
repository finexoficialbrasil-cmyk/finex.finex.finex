import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Subscription } from "@/entities/Subscription";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PaymentSuccessNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [checkCount, setCheckCount] = useState(0);
  const MAX_CHECKS = 3; // ✅ Máximo de 3 verificações automáticas

  useEffect(() => {
    // ✅ Verificar imediatamente ao carregar
    checkRecentActivation();
    
    // ✅ NOVO: Verificar apenas 3 vezes, com intervalo de 2 minutos
    const interval = setInterval(() => {
      setCheckCount(prev => {
        const newCount = prev + 1;
        
        // Se já verificou MAX_CHECKS vezes, parar
        if (newCount >= MAX_CHECKS) {
          console.log("🛑 Atingiu limite de verificações automáticas");
          clearInterval(interval);
          return newCount;
        }
        
        console.log(`🔄 Verificação automática ${newCount + 1}/${MAX_CHECKS}`);
        checkRecentActivation();
        return newCount;
      });
    }, 120000); // ✅ 2 minutos (120000ms) ao invés de 30 segundos

    return () => clearInterval(interval);
  }, []);

  const checkRecentActivation = async () => {
    try {
      console.log("🔍 Verificando ativação recente de assinatura...");
      const user = await User.me();
      
      // Verificar se usuário está com assinatura ativa
      if (user.subscription_status === 'active') {
        // ✅ NOVO: Buscar apenas uma vez, não fazer loop
        try {
          const subscriptions = await Subscription.filter({
            user_email: user.email
          }, "-created_date", 10); // Buscar apenas últimas 10
          
          if (subscriptions.length > 0) {
            // Ordenar por data de criação
            const sortedSubs = subscriptions.sort((a, b) => 
              new Date(b.created_date) - new Date(a.created_date)
            );
            
            const lastSub = sortedSubs[0];
            
            // Se a assinatura foi ativada nos últimos 10 minutos
            if (lastSub.status === 'active' && lastSub.start_date) {
              const startDate = new Date(lastSub.start_date);
              const now = new Date();
              const diffMinutes = (now - startDate) / (1000 * 60);
              
              // Se ativada há menos de 10 minutos E ainda não foi visto
              const wasNotified = localStorage.getItem(`payment_notified_${lastSub.id}`);
              
              if (diffMinutes < 10 && !wasNotified) {
                console.log("✅ Nova assinatura ativada! Mostrando notificação...");
                setSubscriptionData(lastSub);
                setShowNotification(true);
              } else if (wasNotified) {
                console.log("ℹ️ Notificação já foi vista anteriormente");
              } else {
                console.log("ℹ️ Assinatura não é recente o suficiente");
              }
            }
          }
        } catch (subError) {
          // ✅ Se der erro de rate limit, não fazer mais nada
          if (subError.message && subError.message.includes('429')) {
            console.warn("⚠️ Rate limit ao buscar assinaturas. Parando verificações.");
            setCheckCount(MAX_CHECKS); // Parar verificações
          } else {
            console.error("❌ Erro ao buscar assinaturas:", subError);
          }
        }
      } else {
        console.log("ℹ️ Usuário não tem assinatura ativa");
      }
    } catch (error) {
      // ✅ Se der erro de rate limit no User.me(), não fazer mais nada
      if (error.message && error.message.includes('429')) {
        console.warn("⚠️ Rate limit ao verificar usuário. Parando verificações.");
        setCheckCount(MAX_CHECKS); // Parar verificações
      } else {
        console.error("❌ Erro ao verificar ativação:", error);
      }
    }
  };

  const handleDismiss = () => {
    if (subscriptionData) {
      localStorage.setItem(`payment_notified_${subscriptionData.id}`, 'true');
    }
    setShowNotification(false);
  };

  const handleReload = () => {
    handleDismiss();
    window.location.reload();
  };

  if (!showNotification || !subscriptionData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-2xl px-4"
      >
        <Card className="glass-card border-0 neon-glow shadow-2xl bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-2 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="p-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500"
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>

              <div className="flex-1">
                <motion.h3
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2 flex items-center gap-2"
                >
                  🎉 Pagamento Confirmado!
                  <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-green-200 mb-4"
                >
                  Sua assinatura <strong>{subscriptionData.plan_type === 'monthly' ? 'Mensal' : 
                    subscriptionData.plan_type === 'semester' ? 'Semestral' :
                    subscriptionData.plan_type === 'annual' ? 'Anual' : 'Vitalícia'}</strong> foi ativada com sucesso!
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-green-950/40 rounded-lg p-4 mb-4 border border-green-700/30"
                >
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-green-400 font-semibold">💰 Valor Pago</p>
                      <p className="text-white font-bold text-lg">R$ {subscriptionData.amount_paid.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-green-400 font-semibold">📅 Válido Até</p>
                      <p className="text-white font-bold text-lg">
                        {new Date(subscriptionData.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap gap-3"
                >
                  <Button
                    onClick={handleReload}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex-1 min-w-[200px]"
                    size="lg"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Atualizar e Começar a Usar
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    className="border-green-700 text-green-300 hover:bg-green-900/20"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Fechar
                  </Button>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-xs text-green-400 mt-3 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Agora você tem acesso completo a todas as funcionalidades!
                </motion.p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-green-300 hover:text-white flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}