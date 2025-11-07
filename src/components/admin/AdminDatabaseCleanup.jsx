import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DatabaseZap, Loader2, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDatabaseCleanup() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculateStatus, setRecalculateStatus] = useState(null);

  const handleRecalculateBalances = async () => {
    if (!confirm("⚠️ ATENÇÃO: Esta operação irá recalcular o saldo de TODAS as contas de TODOS os usuários.\n\n✅ Corrige saldos incorretos\n✅ Baseado em transações reais\n✅ Pode levar alguns minutos\n\nDeseja continuar?")) {
      return;
    }

    setIsRecalculating(true);
    setRecalculateStatus(null);
    try {
      console.log("🚀 Iniciando recálculo global de saldos...");
      const { data } = await base44.functions.invoke("recalculateAllBalances");
      console.log("✅ Recálculo concluído:", data);
      
      setRecalculateStatus({
        type: "success",
        title: "✅ Sucesso Total!",
        message: data.message || "Operação concluída com sucesso.",
        details: `📊 Contas processadas: ${data.accountsProcessed}\n✅ Contas corrigidas: ${data.accountsUpdated}\n🎯 Todos os saldos estão corretos agora!`
      });
    } catch (error) {
      console.error("❌ Erro ao recalcular saldos:", error);
      setRecalculateStatus({
        type: "error",
        title: "❌ Erro na Operação",
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
            🛠️ Manutenção do Banco de Dados
          </CardTitle>
          <CardDescription>
            Ferramentas para garantir a integridade e consistência dos dados. Use quando necessário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Card Principal */}
          <Card className="bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-purple-900/30 border-purple-700/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">⚡ Correção de Saldos</CardTitle>
                  <CardDescription className="text-purple-300 mt-1">
                    Recalcula TODOS os saldos baseado nas transações reais
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informações */}
              <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-700/30">
                <p className="text-white font-semibold mb-2">🎯 O que esta função faz:</p>
                <ul className="text-purple-300 text-sm space-y-1 list-disc list-inside">
                  <li>✅ Busca TODAS as transações de cada conta</li>
                  <li>✅ Calcula o saldo correto: entradas - saídas</li>
                  <li>✅ Atualiza o saldo da conta se estiver incorreto</li>
                  <li>✅ Corrige problemas causados pelo agente IA</li>
                  <li>✅ 100% seguro - apenas recalcula, não deleta nada</li>
                </ul>
              </div>

              {/* Quando usar */}
              <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-600/30">
                <p className="text-yellow-300 font-semibold mb-2">⚠️ Quando usar:</p>
                <ul className="text-yellow-200 text-sm space-y-1 list-disc list-inside">
                  <li>Saldo da conta não bate com as transações</li>
                  <li>Agente IA criou transações mas não atualizou saldo</li>
                  <li>Após importar dados de outros sistemas</li>
                  <li>Usuários reportando saldos incorretos</li>
                </ul>
              </div>

              {/* Botão de Ação */}
              <Button
                onClick={handleRecalculateBalances}
                disabled={isRecalculating}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
              >
                {isRecalculating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ⚙️ Recalculando Todos os Saldos...
                  </>
                ) : (
                  <>
                    <DatabaseZap className="w-5 h-5 mr-2" />
                    🚀 Corrigir TODOS os Saldos Agora
                  </>
                )}
              </Button>

              <p className="text-xs text-purple-400 text-center">
                💡 Esta operação pode levar alguns minutos dependendo da quantidade de contas
              </p>
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
                  ? "bg-green-900/30 border-green-500/50 text-green-200 shadow-lg shadow-green-500/20" 
                  : "bg-red-900/30 border-red-500/50 text-red-200 shadow-lg shadow-red-500/20"
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