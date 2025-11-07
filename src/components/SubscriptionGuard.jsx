import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// ✅ FUNÇÃO CORRIGIDA: Verificar se assinatura está ativa
const isSubscriptionActive = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin sempre tem acesso
  
  // ✅ MUDANÇA CRÍTICA: Considerar "active" E verificar data
  if (user.subscription_status === 'active' && user.subscription_end_date) {
    const [year, month, day] = user.subscription_end_date.split('-').map(Number);
    const endDate = new Date(year, month - 1, day);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return endDate >= today;
  }
  
  return false;
};

export default function SubscriptionGuard({ children, requireActive = false }) {
  const [hasAccess, setHasAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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

      const isActive = isSubscriptionActive(user);
      
      console.log(`✅ SubscriptionGuard:`, {
        email: user.email,
        status: user.subscription_status,
        endDate: user.subscription_end_date,
        hasAccess: isActive
      });
      
      setHasAccess(isActive);
    } catch (error) {
      console.error("❌ Erro SubscriptionGuard:", error);
      setHasAccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NÃO BLOQUEAR ENQUANTO CARREGA
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
          <Card className="glass-card border-0 neon-glow">
            <CardHeader className="text-center pb-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center mb-4 neon-glow">
                <AlertCircle className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-3xl bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Assinatura Necessária
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="text-center space-y-4">
                <p className="text-purple-300 text-lg">
                  Você precisa de uma assinatura ativa para acessar esta funcionalidade
                </p>
                <p className="text-purple-400">
                  Escolha um plano e desbloqueie todo o potencial do FINEX!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={createPageUrl("Dashboard")} className="flex-1">
                  <Button variant="outline" className="w-full border-purple-700 text-purple-300">
                    Voltar ao Dashboard
                  </Button>
                </Link>
                <Link to={createPageUrl("Plans")} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                    <Crown className="w-4 h-4 mr-2" />
                    Ver Planos
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