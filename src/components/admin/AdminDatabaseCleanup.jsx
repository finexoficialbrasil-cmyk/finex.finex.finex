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
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [cleanupStatus, setCleanupStatus] = useState(null);

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

  const handleCleanDuplicates = async () => {
    if (!confirm("⚠️ REMOVER CONTAS DUPLICADAS\n\nEsta operação irá:\n1. Identificar contas duplicadas (mesmo nome e tipo para o mesmo usuário)\n2. Manter apenas a conta mais antiga\n3. Transferir saldo da conta duplicada para a original\n4. Excluir as duplicatas\n\nDeseja continuar?")) {
      return;
    }

    setIsCleaningDuplicates(true);
    setCleanupStatus(null);
    
    try {
      const { Account } = await import("@/entities/all");
      
      // Buscar todas as contas
      const allAccounts = await Account.list("-created_date", 1000);
      
      // Agrupar por usuário
      const accountsByUser = {};
      for (const acc of allAccounts) {
        if (!accountsByUser[acc.created_by]) {
          accountsByUser[acc.created_by] = [];
        }
        accountsByUser[acc.created_by].push(acc);
      }
      
      let duplicatesRemoved = 0;
      let balanceMerged = 0;
      
      // Para cada usuário, verificar duplicatas
      for (const userEmail in accountsByUser) {
        const userAccounts = accountsByUser[userEmail];
        
        // Agrupar por nome + tipo
        const grouped = {};
        for (const acc of userAccounts) {
          const key = `${acc.name}_${acc.type}`;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(acc);
        }
        
        // Para cada grupo, manter apenas a mais antiga
        for (const key in grouped) {
          const accounts = grouped[key];
          
          if (accounts.length > 1) {
            // Ordenar por data de criação (mais antiga primeiro)
            accounts.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
            
            const originalAccount = accounts[0]; // Mais antiga
            const duplicates = accounts.slice(1); // Resto são duplicatas
            
            // Somar saldo das duplicatas
            let totalBalance = originalAccount.balance;
            for (const dup of duplicates) {
              totalBalance += dup.balance;
            }
            
            // Atualizar saldo da conta original
            await Account.update(originalAccount.id, { balance: totalBalance });
            balanceMerged += totalBalance - originalAccount.balance;
            
            // Excluir duplicatas
            for (const dup of duplicates) {
              await Account.delete(dup.id);
              duplicatesRemoved++;
            }
          }
        }
      }
      
      setCleanupStatus({
        type: "success",
        title: "Limpeza Concluída!",
        message: `${duplicatesRemoved} conta(s) duplicada(s) removida(s)`,
        details: `Saldo total mesclado: R$ ${balanceMerged.toFixed(2)}`
      });
    } catch (error) {
      console.error("Erro ao limpar duplicatas:", error);
      setCleanupStatus({
        type: "error",
        title: "Erro na Limpeza",
        message: "Ocorreu um erro ao remover duplicatas",
        details: error.message
      });
    } finally {
      setIsCleaningDuplicates(false);
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

          <Card className="bg-red-900/20 border-red-700/30">
            <CardHeader>
              <CardTitle className="text-lg text-white">Remover Contas Duplicadas</CardTitle>
              <CardDescription className="text-red-300">
                Remove contas bancárias duplicadas (mesmo nome e tipo) mantendo apenas a mais antiga e somando os saldos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCleanDuplicates}
                disabled={isCleaningDuplicates}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                {isCleaningDuplicates ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Limpando...
                  </>
                ) : (
                  <>
                    <DatabaseZap className="w-4 h-4 mr-2" />
                    Remover Duplicatas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {cleanupStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert variant={cleanupStatus.type === "success" ? "default" : "destructive"} className={cleanupStatus.type === "success" ? "bg-green-900/20 border-green-500/30 text-green-300" : "bg-red-900/20 border-red-500/30 text-red-300"}>
                {cleanupStatus.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle className="font-bold">{cleanupStatus.title}</AlertTitle>
                <AlertDescription>
                  {cleanupStatus.message}
                  {cleanupStatus.details && <p className="text-xs mt-2">{cleanupStatus.details}</p>}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

        </CardContent>
      </Card>
    </motion.div>
  );
}