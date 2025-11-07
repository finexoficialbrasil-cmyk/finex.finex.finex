import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DatabaseZap, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDatabaseCleanup() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculateStatus, setRecalculateStatus] = useState(null);

  const handleRecalculateBalances = async () => {
    if (!confirm("Esta operação irá recalcular o saldo de TODAS as contas de TODOS os usuários com base em suas transações. Pode levar alguns minutos. Deseja continuar?")) {
      return;
    }

    setIsRecalculating(true);
    setRecalculateStatus(null);
    try {
      const { data } = await base44.functions.invoke("recalculateAllBalances");
      setRecalculateStatus({
        type: "success",
        title: "Sucesso!",
        message: data.message || `Operação concluída com sucesso.`,
        details: `Contas processadas: ${data.accountsProcessed}, Contas atualizadas: ${data.accountsUpdated}`
      });
    } catch (error) {
      console.error("Erro ao recalcular saldos:", error);
      setRecalculateStatus({
        type: "error",
        title: "Erro na Operação",
        message: "Ocorreu um erro ao tentar recalcular os saldos.",
        details: error.response?.data?.error || error.message,
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
            Manutenção do Banco de Dados
          </CardTitle>
          <CardDescription>
            Ferramentas para garantir a integridade e consistência dos dados do sistema. Use com cuidado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="bg-purple-900/20 border-purple-700/30">
            <CardHeader>
              <CardTitle className="text-lg text-white">Recalcular Saldos das Contas</CardTitle>
              <CardDescription className="text-purple-300">
                Esta função varre todas as transações de todas as contas e corrige os saldos para garantir que estejam 100% corretos. Útil para corrigir quaisquer inconsistências.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleRecalculateBalances}
                disabled={isRecalculating}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 neon-glow"
              >
                {isRecalculating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recalculando...
                  </>
                ) : (
                  <>
                    <DatabaseZap className="w-4 h-4 mr-2" />
                    Corrigir Saldos de Todas as Contas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {recalculateStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert variant={recalculateStatus.type === "success" ? "default" : "destructive"} className={recalculateStatus.type === "success" ? "bg-green-900/20 border-green-500/30 text-green-300" : "bg-red-900/20 border-red-500/30 text-red-300"}>
                {recalculateStatus.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle className="font-bold">{recalculateStatus.title}</AlertTitle>
                <AlertDescription>
                  {recalculateStatus.message}
                  {recalculateStatus.details && <p className="text-xs mt-2">{recalculateStatus.details}</p>}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Adicionar mais ferramentas de limpeza aqui no futuro */}

        </CardContent>
      </Card>
    </motion.div>
  );
}