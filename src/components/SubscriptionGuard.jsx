import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// ✅ NOVA FUNÇÃO: Verificar se assinatura está ativa SEM conversão de timezone
const isSubscriptionActive = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin sempre tem acesso
  if (user.subscription_status !== 'active') return false;
  if (!user.subscription_end_date) return false;
  
  // Parse manual SEM timezone
  const [year, month, day] = user.subscription_end_date.split('-').map(Number);
  const endDate = new Date(year, month - 1, day);
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const isActive = endDate >= today;
  
  console.log(`🔍 SubscriptionGuard - Verificação:`, {
    user: user.email,
    endDateString: user.subscription_end_date,
    endDate: endDate.toLocaleDateString('pt-BR'),
    today: today.toLocaleDateString('pt-BR'),
    isActive
  });
  
  return isActive;
};

export default function SubscriptionGuard({ children, requireActive = false }) {
  const [hasAccess, setHasAccess] = useState(true); // ✅ Começar com true (otimista)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const user = await User.me();
      
      // Se não requer assinatura ativa, liberar
      if (!requireActive) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      // ✅ USAR NOVA FUNÇÃO para verificar se está ativo
      const isActive = isSubscriptionActive(user);
      setHasAccess(isActive);
    } catch (error) {
      console.error("Erro ao verificar assinatura:", error);
      setHasAccess(true); // ✅ Em caso de erro, liberar (melhor UX)
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

  // ✅ Mostra conteúdo imediatamente (mesmo se ainda carregando)
  return children;
}