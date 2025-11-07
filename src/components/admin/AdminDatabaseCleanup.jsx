import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DatabaseZap, Loader2, CheckCircle, AlertTriangle, Zap, User } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDatabaseCleanup() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculateStatus, setRecalculateStatus] = useState(null);

  // ✅ NOVA FUNÇÃO: Recalcular apenas contas do usuário atual
  const handleRecalculateMyBalances = async () => {
    if (!confirm("⚠️ Deseja recalcular os saldos de SUAS contas?\n\n✅ Rápido e seguro\n✅ Baseado nas suas transações\n\nContinuar?")) {
      return;
    }

    setIsRecalculating(true);
    setRecalculateStatus(null);
    
    try {
      console.log("🚀 Recalculando suas contas...");
      const { data } = await base44.functions.invoke("recalculateUserBalances");
      console.log("✅ Sucesso:", data);
      
      setRecalculateStatus({
        type: "success",
        title: "✅ Sucesso!",
        message: data.message || "Seus saldos foram recalculados!",
        details: `📊 Contas processadas: ${data.accountsProcessed}\n✅ Contas corrigidas: ${data.accountsUpdated}\n\n🎯 Agora seus saldos estão corretos!`
      });
    } catch (error) {
      console.error("❌ Erro:", error);
      setRecalculateStatus({
        type: "error",
        title: "❌ Erro",
        message: "Erro ao recalcular saldos",
        details: error.response?.data?.error || error.message
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleRecalculateAllBalances = async () => {
    if (!confirm("⚠️ ATENÇÃO ADMIN: Vai recalcular saldos de TODOS os usuários!\n\n✅ Pode demorar alguns minutos\n✅ Processa todas as contas do sistema\n\nContinuar?")) {
      return;
    }

    setIsRecalculating(true);
    setRecalculateStatus(null);
    
    try {
      console.log("🚀 Recalculando TODAS as contas...");
      const { data } = await base44.functions.invoke("recalculateAllBalances");
      console.log("✅ Sucesso:", data);
      
      setRecalculateStatus({
        type: "success",
        title: "✅ Sucesso Total!",
        message: data.message || "Todos os saldos foram recalculados!",
        details: `📊 Contas processadas: ${data.accountsProcessed}\n✅ Contas corrigidas: ${data.accountsUpdated}\n🎯 Sistema 100% correto!`
      });
    } catch (error) {
      console.error("❌ Erro:", error);
      setRecalculateStatus({
        type: "error",
        title: "❌ Erro na Operação",
        message: "Erro ao recalcular todos os saldos",
        details: error.response?.data?.error || error.message
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card border-0 neon-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseZap className="w-6 h-6 text-purple-400" />
            🛠️ Correção de Saldos
          </CardTitle>
          <CardDescription>
            Ferramenta para corrigir saldos incorretos causados por bugs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* ✅ OPÇÃO 1: Minhas Contas (MAIS RÁPIDO) */}
          <Card className="bg-gradient-to-br from-blue-900/30 via-cyan-900/20 to-blue-900/30 border-blue-700/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">⚡ Minhas Contas (Rápido)</CardTitle>
                  <CardDescription className="text-blue-300 mt-1">
                    Recalcula apenas SUAS contas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700/30">
                <p className="text-white font-semibold mb-2">🎯 Quando usar:</p>
                <ul className="text-blue-300 text-sm space-y-1 list-disc list-inside">
                  <li>✅ Seus saldos estão errados</li>
                  <li>✅ Agente IA não atualizou seu saldo</li>
                  <li>✅ Solução RÁPIDA (segundos)</li>
                  <li>✅ Não afeta outros usuários</li>
                </ul>
              </div>

              <Button
                onClick={handleRecalculateMyBalances}
                disabled={isRecalculating}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 shadow-lg shadow-blue-500/30"
              >
                {isRecalculating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ⚙️ Recalculando...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 mr-2" />
                    ⚡ Corrigir Minhas Contas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* ✅ OPÇÃO 2: Todas as Contas (ADMIN) */}
          <Card className="bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-purple-900/30 border-purple-700/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">🔧 Todas as Contas (Admin)</CardTitle>
                  <CardDescription className="text-purple-300 mt-1">
                    Recalcula TODOS os usuários (pode demorar)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-600/30">
                <p className="text-yellow-300 font-semibold mb-2">⚠️ Admin only:</p>
                <ul className="text-yellow-200 text-sm space-y-1 list-disc list-inside">
                  <li>Recalcula TODAS as contas do sistema</li>
                  <li>Pode levar vários minutos</li>
                  <li>Use apenas se houver problema geral</li>
                </ul>
              </div>

              <Button
                onClick={handleRecalculateAllBalances}
                disabled={isRecalculating}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 shadow-lg shadow-purple-500/30"
              >
                {isRecalculating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ⚙️ Recalculando TUDO...
                  </>
                ) : (
                  <>
                    <DatabaseZap className="w-5 h-5 mr-2" />
                    🚀 Corrigir TODAS as Contas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultado */}
          {recalculateStatus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert 
                variant={recalculateStatus.type === "success" ? "default" : "destructive"} 
                className={recalculateStatus.type === "success" 
                  ? "bg-green-900/30 border-green-500/50 text-green-200 shadow-lg" 
                  : "bg-red-900/30 border-red-500/50 text-red-200 shadow-lg"
                }
              >
                {recalculateStatus.type === "success" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
                <AlertTitle className="font-bold text-lg">{recalculateStatus.title}</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">{recalculateStatus.message}</p>
                  {recalculateStatus.details && (
                    <pre className="text-xs mt-3 bg-black/20 rounded p-3 border border-current/20 whitespace-pre-wrap">
                      {recalculateStatus.details}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}