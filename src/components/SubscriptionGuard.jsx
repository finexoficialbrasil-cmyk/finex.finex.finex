import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, AlertCircle, Lock } from "lucide-react";
import { motion } from "framer-motion";

// ✅ FUNÇÃO CORRIGIDA: Verificar acesso ativo (NUNCA dar trial para quem já teve plano pago)
const hasActiveAccess = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // ✅ VERIFICAR TRIAL (apenas para quem NUNCA teve plano pago)
  if (user.subscription_status === 'trial' && user.trial_ends_at) {
    const [year, month, day] = user.trial_ends_at.split('-').map(Number);
    const trialEnd = new Date(year, month - 1, day);
    
    const trialActive = trialEnd >= today;
    
    console.log(`🎁 Verificação TRIAL:`, {
      email: user.email,
      trialEnd: user.trial_ends_at,
      today: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      trialActive,
      daysLeft: Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24))
    });
    
    // ✅ Se trial acabou, BLOQUEAR IMEDIATAMENTE
    if (!trialActive) {
      console.log(`❌ TRIAL EXPIRADO! Bloqueando acesso para: ${user.email}`);
      return false;
    }
    
    return true;
  }
  
  // ✅ VERIFICAR ASSINATURA PAGA
  if (user.subscription_status === 'active' && user.subscription_end_date) {
    const [year, month, day] = user.subscription_end_date.split('-').map(Number);
    const endDate = new Date(year, month - 1, day);
    
    const isActive = endDate >= today;
    
    console.log(`💳 Verificação ASSINATURA:`, {
      email: user.email,
      endDate: user.subscription_end_date,
      today: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      isActive,
      daysLeft: Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
    });
    
    // ✅ Se assinatura venceu, BLOQUEAR IMEDIATAMENTE (NÃO dar trial novamente)
    if (!isActive) {
      console.log(`❌ ASSINATURA VENCIDA! Bloqueando acesso para: ${user.email}`);
      return false;
    }
    
    return true;
  }
  
  // ✅ Sem trial e sem assinatura = BLOQUEADO
  console.log(`❌ SEM ACESSO ATIVO para: ${user.email}`);
  return false;
};

export default function SubscriptionGuard({ children, requireActive = false }) {
  const [hasAccess, setHasAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const user = await User.me();
      
      if (!requireActive) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      const isActive = hasActiveAccess(user);
      setHasAccess(isActive);
      
      // ✅ Guardar status para exibir mensagem correta
      if (!isActive) {
        if (user.subscription_status === 'trial') {
          setUserStatus('trial_expired');
        } else if (user.subscription_status === 'active') {
          setUserStatus('subscription_expired');
        } else {
          setUserStatus('no_access');
        }
      }
    } catch (error) {
      console.error("❌ Erro SubscriptionGuard:", error);
      setHasAccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return children;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <Card className="glass-card border-0 neon-glow border-2 border-red-500/50">
            <CardHeader className="text-center pb-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center mb-4 neon-glow">
                <Lock className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-3xl bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                {userStatus === 'trial_expired' && '🔒 Trial Expirado'}
                {userStatus === 'subscription_expired' && '🔒 Assinatura Vencida'}
                {userStatus === 'no_access' && '🔒 Acesso Bloqueado'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="text-center space-y-4">
                {userStatus === 'trial_expired' && (
                  <>
                    <p className="text-red-300 text-lg font-bold">
                      ⏰ Seu período de teste de 3 dias terminou!
                    </p>
                    <p className="text-purple-400">
                      Para continuar usando o sistema, você precisa escolher um plano.
                    </p>
                  </>
                )}
                
                {userStatus === 'subscription_expired' && (
                  <>
                    <p className="text-red-300 text-lg font-bold">
                      ⏰ Sua assinatura venceu!
                    </p>
                    <p className="text-purple-400">
                      Renove sua assinatura para continuar usando todas as funcionalidades.
                    </p>
                  </>
                )}
                
                {userStatus === 'no_access' && (
                  <>
                    <p className="text-red-300 text-lg font-bold">
                      ⚠️ Você não tem acesso ativo!
                    </p>
                    <p className="text-purple-400">
                      Escolha um plano para começar a usar o sistema.
                    </p>
                  </>
                )}
                
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/30 text-left">
                  <p className="text-red-200 text-sm">
                    <strong>⚠️ IMPORTANTE:</strong>
                  </p>
                  <ul className="text-red-300 text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>O acesso foi bloqueado automaticamente</li>
                    <li>Seus dados estão seguros</li>
                    <li>Após renovar, tudo voltará ao normal</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={createPageUrl("Plans")} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold text-lg py-6">
                    <Crown className="w-5 h-5 mr-2" />
                    {userStatus === 'subscription_expired' ? 'Renovar Agora' : 'Escolher Plano'}
                  </Button>
                </Link>
              </div>
              
              <p className="text-center text-xs text-purple-400">
                Dúvidas? Entre em contato com o suporte
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return children;
}