import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { SystemPlan } from "@/entities/SystemPlan";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// ✅ NOVA FUNÇÃO: Verificar se assinatura está ativa SEM conversão de timezone
const isSubscriptionActive = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.subscription_status !== 'active') return false;
  if (!user.subscription_end_date) return false;
  
  const [year, month, day] = user.subscription_end_date.split('-').map(Number);
  const endDate = new Date(year, month - 1, day);
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const isActive = endDate >= today;
  
  console.log(`🔍 FeatureGuard - Verificação:`, {
    user: user.email,
    endDateString: user.subscription_end_date,
    endDate: endDate.toLocaleDateString('pt-BR'),
    today: today.toLocaleDateString('pt-BR'),
    isActive
  });
  
  return isActive;
};

export default function FeatureGuard({ children, pageName, featureName, featureLabel }) {
  const [hasAccess, setHasAccess] = useState(true); // ✅ Otimista
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const user = await User.me();
      
      // Admin sempre tem acesso
      if (user.role === 'admin') {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      // ✅ USAR NOVA FUNÇÃO para verificar se está ativo
      const isActive = isSubscriptionActive(user);
      
      if (!isActive) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      // Se tem plano ativo, verificar permissões de página
      if (user.subscription_plan) {
        const plans = await SystemPlan.list();
        const plan = plans.find(p => p.plan_type === user.subscription_plan);
        
        if (plan) {
          setCurrentPlan(plan);
          
          // Se está verificando por página
          if (pageName) {
            const hasPageAccess = plan.allowed_pages?.includes(pageName) || 
                                 ['Dashboard', 'Profile', 'Plans'].includes(pageName);
            setHasAccess(hasPageAccess);
          }
          // Se está verificando por feature
          else if (featureName) {
            setHasAccess(plan[featureName] === true);
          }
          else {
            setHasAccess(true);
          }
        } else {
          setHasAccess(false);
        }
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      setHasAccess(true); // ✅ Em caso de erro, liberar
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasAccess && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <Card className="glass-card border-0 neon-glow">
            <CardHeader className="text-center pb-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-4 neon-glow">
                <Lock className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-3xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Acesso Restrito
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="text-center space-y-4">
                <p className="text-purple-300 text-lg">
                  Esta funcionalidade não está disponível no seu plano atual
                </p>
                {currentPlan && (
                  <div className="inline-block px-4 py-2 rounded-lg bg-purple-900/30 border border-purple-700/50">
                    <p className="text-sm text-purple-400">Seu plano atual:</p>
                    <p className="text-white font-bold">{currentPlan.name}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={createPageUrl("Dashboard")} className="flex-1">
                  <Button variant="outline" className="w-full border-purple-700 text-purple-300">
                    Voltar ao Dashboard
                  </Button>
                </Link>
                <Link to={createPageUrl("Plans")} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Crown className="w-4 h-4 mr-2" />
                    Fazer Upgrade
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return children;
}