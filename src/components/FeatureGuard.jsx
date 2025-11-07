import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { SystemPlan } from "@/entities/SystemPlan";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function FeatureGuard({ pageName, children }) {
  const [hasAccess, setHasAccess] = useState(true); // ✅ Começar com true (otimista)
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    checkAccess();
  }, [pageName]);

  const checkAccess = async () => {
    try {
      const user = await User.me();
      
      // Admin sempre tem acesso
      if (user.role === 'admin') {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      // Páginas sempre liberadas
      const alwaysAllowedPages = ["Dashboard", "Profile", "Plans", "Import"];
      if (alwaysAllowedPages.includes(pageName)) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      // ✅ Verificar se tem assinatura ativa
      if (user.subscription_status !== 'active') {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      // Buscar plano do usuário
      const plans = await SystemPlan.list();
      const userPlan = plans.find(p => p.plan_type === user.subscription_plan);
      
      if (!userPlan) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      setCurrentPlan(userPlan);

      // Verificar se a página está permitida no plano
      const allowedPages = userPlan.allowed_pages || [];
      setHasAccess(allowedPages.includes(pageName));
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      setHasAccess(true); // ✅ Em caso de erro, liberar (melhor UX)
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ REMOVIDO O LOADING - Mostra conteúdo imediatamente (modo otimista)

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
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center mb-4 neon-glow">
                <Lock className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-3xl bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Acesso Restrito
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="text-center space-y-4">
                <p className="text-purple-300 text-lg">
                  Esta funcionalidade não está disponível no seu plano atual
                </p>
                <p className="text-purple-400">
                  Faça upgrade para desbloquear acesso a <strong>{pageName}</strong> e muito mais!
                </p>
              </div>

              {currentPlan && (
                <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-purple-300 text-sm">Seu plano atual:</p>
                      <p className="text-white font-bold text-xl">{currentPlan.name}</p>
                    </div>
                    <Badge className="bg-purple-600">
                      {currentPlan.price === 0 ? 'GRÁTIS' : `R$ ${currentPlan.price}`}
                    </Badge>
                  </div>
                  
                  <p className="text-purple-400 text-sm">
                    💡 Para acessar <strong>{pageName}</strong>, você precisa de um plano superior.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={createPageUrl("Dashboard")} className="flex-1">
                  <Button variant="outline" className="w-full border-purple-700 text-purple-300">
                    Voltar ao Dashboard
                  </Button>
                </Link>
                <Link to={createPageUrl("Plans")} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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

  // ✅ Mostra conteúdo imediatamente
  return children;
}