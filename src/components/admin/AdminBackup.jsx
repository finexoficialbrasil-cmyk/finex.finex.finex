import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { User, Transaction, Account, Category, Goal, Bill, Transfer, SystemCategory, SystemSettings, SystemNotification, SystemTutorial, SystemPlan, Subscription } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, Database, Calendar, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminBackup() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  const exportFullBackup = async () => {
    if (!confirm("📦 EXPORTAR BACKUP COMPLETO?\n\n✅ Todos os dados serão salvos em JSON\n✅ Você poderá restaurar depois\n\nContinuar?")) {
      return;
    }

    setIsExporting(true);
    try {
      console.log("📊 Iniciando backup completo...");

      // ✅ Usar métodos normais das entidades (sem asServiceRole)
      const [
        users,
        transactions,
        accounts,
        categories,
        goals,
        bills,
        transfers,
        systemCategories,
        systemSettings,
        systemNotifications,
        systemTutorials,
        systemPlans,
        subscriptions
      ] = await Promise.all([
        User.list(),
        Transaction.list("-created_date", 10000),
        Account.list(),
        Category.list(),
        Goal.list(),
        Bill.list(),
        Transfer.list(),
        SystemCategory.list(),
        SystemSettings.list(),
        SystemNotification.list(),
        SystemTutorial.list(),
        SystemPlan.list(),
        Subscription.list()
      ]);

      const backup = {
        backup_info: {
          created_at: new Date().toISOString(),
          version: "1.0",
          app_name: "FINEX",
          total_records: users.length + transactions.length + accounts.length + categories.length + goals.length + bills.length + transfers.length
        },
        users: users,
        transactions: transactions,
        accounts: accounts,
        categories: categories,
        goals: goals,
        bills: bills,
        transfers: transfers,
        system_categories: systemCategories,
        system_settings: systemSettings,
        system_notifications: systemNotifications,
        system_tutorials: systemTutorials,
        system_plans: systemPlans,
        subscriptions: subscriptions
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finex_backup_completo_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastBackup(new Date().toISOString());

      alert(`✅ BACKUP COMPLETO CRIADO COM SUCESSO!\n\n📊 Total de registros:\n• ${users.length} usuários\n• ${transactions.length} transações\n• ${accounts.length} contas\n• ${categories.length} categorias\n• ${goals.length} metas\n• ${bills.length} contas a pagar/receber\n• ${transfers.length} transferências\n• ${subscriptions.length} assinaturas\n\n💾 Arquivo salvo para restauração futura.`);

    } catch (error) {
      console.error("❌ Erro ao criar backup:", error);
      alert(`❌ Erro ao criar backup: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const importFullBackup = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!confirm("⚠️ RESTAURAR BACKUP COMPLETO?\n\n❗ ATENÇÃO:\n• Os dados atuais NÃO serão apagados\n• Os dados do backup serão ADICIONADOS\n• Pode haver duplicação se o backup for do mesmo sistema\n\n✅ Recomendado apenas para:\n- Restaurar dados perdidos\n- Migrar de outro servidor\n- Recuperação de desastre\n\nContinuar?")) {
        return;
      }

      setIsImporting(true);
      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        if (!backup.backup_info) {
          throw new Error("Arquivo de backup inválido!");
        }

        alert(`📦 Restaurando backup de: ${new Date(backup.backup_info.created_at).toLocaleString('pt-BR')}\n\nAguarde, isso pode demorar alguns minutos...`);

        let restored = {
          categories: 0,
          accounts: 0,
          transactions: 0,
          goals: 0,
          bills: 0,
          transfers: 0
        };

        // Mapeamento de IDs antigos para novos
        const categoryIdMap = {};
        const accountIdMap = {};

        // 1. Restaurar Categorias
        for (const cat of backup.categories || []) {
          try {
            const newCat = await Category.create({
              name: cat.name,
              type: cat.type,
              color: cat.color,
              icon: cat.icon,
              budget_limit: cat.budget_limit
            });
            categoryIdMap[cat.id] = newCat.id;
            restored.categories++;
          } catch (err) {
            console.error("Erro ao restaurar categoria:", err);
          }
        }

        // 2. Restaurar Contas
        for (const acc of backup.accounts || []) {
          try {
            const newAcc = await Account.create({
              name: acc.name,
              type: acc.type,
              balance: acc.balance,
              currency: acc.currency,
              color: acc.color,
              icon: acc.icon,
              is_active: acc.is_active
            });
            accountIdMap[acc.id] = newAcc.id;
            restored.accounts++;
          } catch (err) {
            console.error("Erro ao restaurar conta:", err);
          }
        }

        // 3. Restaurar Transações
        for (const tx of backup.transactions || []) {
          try {
            await Transaction.create({
              description: tx.description,
              amount: tx.amount,
              type: tx.type,
              category_id: categoryIdMap[tx.category_id] || tx.category_id,
              account_id: accountIdMap[tx.account_id] || tx.account_id,
              date: tx.date,
              is_recurring: tx.is_recurring,
              status: tx.status,
              notes: tx.notes
            });
            restored.transactions++;
          } catch (err) {
            console.error("Erro ao restaurar transação:", err);
          }
        }

        // 4. Restaurar Metas
        for (const goal of backup.goals || []) {
          try {
            await Goal.create({
              title: goal.title,
              description: goal.description,
              target_amount: goal.target_amount,
              current_amount: goal.current_amount,
              deadline: goal.deadline,
              icon: goal.icon,
              color: goal.color,
              status: goal.status
            });
            restored.goals++;
          } catch (err) {
            console.error("Erro ao restaurar meta:", err);
          }
        }

        // 5. Restaurar Contas a Pagar/Receber
        for (const bill of backup.bills || []) {
          try {
            await Bill.create({
              description: bill.description,
              amount: bill.amount,
              type: bill.type,
              category_id: categoryIdMap[bill.category_id] || bill.category_id,
              account_id: accountIdMap[bill.account_id] || bill.account_id,
              due_date: bill.due_date,
              payment_date: bill.payment_date,
              status: bill.status,
              is_recurring: bill.is_recurring,
              recurring_type: bill.recurring_type,
              notes: bill.notes,
              contact_phone: bill.contact_phone,
              contact_name: bill.contact_name
            });
            restored.bills++;
          } catch (err) {
            console.error("Erro ao restaurar conta:", err);
          }
        }

        // 6. Restaurar Transferências
        for (const transfer of backup.transfers || []) {
          try {
            await Transfer.create({
              from_account_id: accountIdMap[transfer.from_account_id] || transfer.from_account_id,
              to_account_id: accountIdMap[transfer.to_account_id] || transfer.to_account_id,
              amount: transfer.amount,
              description: transfer.description,
              date: transfer.date,
              receipt_url: transfer.receipt_url
            });
            restored.transfers++;
          } catch (err) {
            console.error("Erro ao restaurar transferência:", err);
          }
        }

        alert(`✅ BACKUP RESTAURADO COM SUCESSO!\n\n📊 Dados restaurados:\n• ${restored.categories} categorias\n• ${restored.accounts} contas\n• ${restored.transactions} transações\n• ${restored.goals} metas\n• ${restored.bills} contas a pagar/receber\n• ${restored.transfers} transferências\n\n🔄 Recarregue a página para ver os dados.`);

      } catch (error) {
        console.error("❌ Erro ao restaurar backup:", error);
        alert(`❌ Erro ao restaurar backup: ${error.message}`);
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-cyan-900/20 border-cyan-500/50">
        <Database className="h-5 w-5 text-cyan-400" />
        <AlertDescription className="text-cyan-300 mt-2">
          <p className="font-semibold mb-2">💾 Sistema de Backup Completo</p>
          <ul className="text-sm space-y-1 ml-4 list-disc">
            <li>Exporta TODOS os dados do sistema em JSON</li>
            <li>Backup inclui: usuários, transações, contas, metas, configurações, etc</li>
            <li>Permite restauração completa em caso de perda de dados</li>
            <li>Recomendado: fazer backup semanal ou antes de mudanças grandes</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Exportar Backup */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-green-400" />
            Exportar Backup Completo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-purple-300 text-sm">
            Cria um arquivo JSON com TODOS os dados do sistema. Guarde em local seguro!
          </p>

          {lastBackup && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle className="w-4 h-4" />
              Último backup: {new Date(lastBackup).toLocaleString('pt-BR')}
            </div>
          )}

          <Button
            onClick={exportFullBackup}
            disabled={isExporting}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            size="lg"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                💾 Baixar Backup Completo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Importar Backup */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-400" />
            Restaurar Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Alert className="bg-yellow-900/20 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300 text-xs">
              ⚠️ Os dados do backup serão ADICIONADOS aos dados atuais. Não apaga nada existente.
            </AlertDescription>
          </Alert>

          <p className="text-purple-300 text-sm">
            Restaura dados de um arquivo de backup anterior. Use apenas em caso de necessidade!
          </p>

          <Button
            onClick={importFullBackup}
            disabled={isImporting}
            variant="outline"
            className="w-full border-orange-700 text-orange-400 hover:bg-orange-900/20"
            size="lg"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Restaurando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                📥 Restaurar de Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card className="glass-card border-0 border-l-4 border-blue-500">
        <CardContent className="p-4">
          <p className="text-white font-semibold mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            💡 Recomendações de Backup
          </p>
          <ul className="text-sm text-blue-300 space-y-2 ml-6 list-disc">
            <li><strong>Backup Semanal:</strong> Faça todo domingo à noite</li>
            <li><strong>Antes de Mudanças:</strong> Sempre antes de alterações grandes</li>
            <li><strong>Múltiplas Cópias:</strong> Guarde em 2-3 locais diferentes (Google Drive, Dropbox, HD externo)</li>
            <li><strong>Teste de Restauração:</strong> Teste restaurar o backup 1x por mês para garantir que funciona</li>
            <li><strong>Rotatividade:</strong> Mantenha os últimos 4 backups (1 por semana no mês)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}