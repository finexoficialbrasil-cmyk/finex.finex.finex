import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sendSubscriptionReminders } from "@/functions/sendSubscriptionReminders";
import { checkSubscriptionExpiry } from "@/functions/checkSubscriptionExpiry";
import { 
  Clock, 
  Play, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Calendar,
  Zap,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminCronJobs() {
  const [isRunningReminders, setIsRunningReminders] = useState(false);
  const [isRunningExpiry, setIsRunningExpiry] = useState(false);
  const [lastResultReminders, setLastResultReminders] = useState(null);
  const [lastResultExpiry, setLastResultExpiry] = useState(null);

  const handleRunReminders = async () => {
    if (isRunningReminders) return;
    
    setIsRunningReminders(true);
    setLastResultReminders(null);
    
    try {
      console.log("🔄 Executando envio de lembretes...");
      const response = await sendSubscriptionReminders();
      const result = response.data;
      
      console.log("✅ Resultado:", result);
      setLastResultReminders(result);
      
      if (result.success) {
        alert(`✅ Emails enviados com sucesso!\n\n📧 Total: ${result.results.emails_sent}\n📊 Processados: ${result.results.processed}\n❌ Erros: ${result.results.errors}`);
      } else {
        alert(`❌ Erro ao enviar emails:\n\n${result.error}`);
      }
    } catch (error) {
      console.error("❌ Erro:", error);
      alert(`❌ Erro ao executar: ${error.message}`);
      setLastResultReminders({ success: false, error: error.message });
    } finally {
      setIsRunningReminders(false);
    }
  };

  const handleRunExpiry = async () => {
    if (isRunningExpiry) return;
    
    setIsRunningExpiry(true);
    setLastResultExpiry(null);
    
    try {
      console.log("🔄 Verificando vencimentos...");
      const response = await checkSubscriptionExpiry();
      const result = response.data;
      
      console.log("✅ Resultado:", result);
      setLastResultExpiry(result);
      
      if (result.success) {
        alert(`✅ Verificação concluída!\n\n📧 Emails: ${result.report.emails_sent}\n📱 WhatsApp: ${result.report.whatsapp_sent}\n❌ Erros: ${result.report.errors}`);
      } else {
        alert(`❌ Erro na verificação:\n\n${result.error}`);
      }
    } catch (error) {
      console.error("❌ Erro:", error);
      alert(`❌ Erro ao executar: ${error.message}`);
      setLastResultExpiry({ success: false, error: error.message });
    } finally {
      setIsRunningExpiry(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Aviso Importante */}
      <div className="bg-yellow-900/20 border-2 border-yellow-500/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-yellow-300 font-bold text-lg mb-2">
              ⚠️ IMPORTANTE: Configure um Agendador Externo
            </h3>
            <p className="text-yellow-200 text-sm mb-3">
              Para os emails automáticos funcionarem, você precisa configurar um serviço de agendamento (cron job) 
              que execute essas funções diariamente.
            </p>
            <div className="bg-yellow-800/30 p-4 rounded-lg">
              <p className="text-yellow-100 text-sm font-semibold mb-2">
                📋 Opções Recomendadas:
              </p>
              <ul className="text-yellow-200 text-sm space-y-2 list-disc list-inside">
                <li><strong>EasyCron</strong> - https://www.easycron.com (Gratuito)</li>
                <li><strong>Cron-Job.org</strong> - https://cron-job.org (Gratuito)</li>
                <li><strong>Zapier</strong> - Agendar chamadas HTTP</li>
              </ul>
            </div>
            <div className="mt-4 bg-cyan-900/30 p-4 rounded-lg">
              <p className="text-cyan-200 text-sm font-semibold mb-2">
                ⚙️ Como Configurar:
              </p>
              <ol className="text-cyan-200 text-sm space-y-2 list-decimal list-inside">
                <li>Crie uma conta em um dos serviços acima</li>
                <li>Configure para executar <strong>todos os dias às 9h</strong></li>
                <li>Use as URLs das funções que aparecem abaixo</li>
                <li>Pronto! Os emails serão enviados automaticamente 🎉</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Job 1: Lembretes de Assinatura */}
      <Card className="glass-card border-purple-700/50">
        <CardHeader className="border-b border-purple-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-600/20">
                <Mail className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  📧 Lembretes de Vencimento
                </CardTitle>
                <p className="text-purple-300 text-sm mt-1">
                  Envia emails 3, 2 e 1 dia antes, no dia, e após vencimento
                </p>
              </div>
            </div>
            <Button
              onClick={handleRunReminders}
              disabled={isRunningReminders}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isRunningReminders ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Executar Agora
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="bg-purple-900/20 p-4 rounded-lg">
              <p className="text-purple-200 text-sm font-semibold mb-2">
                📅 Quando envia:
              </p>
              <ul className="text-purple-300 text-sm space-y-1">
                <li>• 3 dias antes do vencimento</li>
                <li>• 2 dias antes do vencimento</li>
                <li>• 1 dia antes do vencimento</li>
                <li>• No dia do vencimento</li>
                <li>• 1, 5, 15 e 30 dias após vencimento</li>
                <li>• Mensalmente após 30 dias</li>
              </ul>
            </div>

            {lastResultReminders && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 ${
                  lastResultReminders.success
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-red-900/20 border-red-500/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {lastResultReminders.success ? (
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`font-bold mb-2 ${
                      lastResultReminders.success ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {lastResultReminders.success ? '✅ Executado com Sucesso!' : '❌ Erro na Execução'}
                    </p>
                    {lastResultReminders.success && lastResultReminders.results && (
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-purple-900/30 p-2 rounded">
                          <p className="text-purple-400 text-xs">Processados</p>
                          <p className="text-white font-bold">{lastResultReminders.results.processed}</p>
                        </div>
                        <div className="bg-green-900/30 p-2 rounded">
                          <p className="text-green-400 text-xs">Enviados</p>
                          <p className="text-white font-bold">{lastResultReminders.results.emails_sent}</p>
                        </div>
                        <div className="bg-red-900/30 p-2 rounded">
                          <p className="text-red-400 text-xs">Erros</p>
                          <p className="text-white font-bold">{lastResultReminders.results.errors}</p>
                        </div>
                      </div>
                    )}
                    {!lastResultReminders.success && (
                      <p className="text-red-200 text-sm">
                        {lastResultReminders.error}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-cyan-900/20 border border-cyan-700/30 p-4 rounded-lg">
              <p className="text-cyan-300 text-sm font-semibold mb-2">
                🔗 URL para Agendador (Cron):
              </p>
              <code className="block bg-black/30 p-3 rounded text-cyan-200 text-xs break-all">
                {window.location.origin}/api/functions/sendSubscriptionReminders
              </code>
              <p className="text-cyan-400 text-xs mt-2">
                Configure para executar todos os dias às 9h da manhã
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job 2: Verificação de Vencimentos */}
      <Card className="glass-card border-purple-700/50">
        <CardHeader className="border-b border-purple-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-600/20">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  🔔 Verificação de Vencimentos
                </CardTitle>
                <p className="text-purple-300 text-sm mt-1">
                  Verifica vencimentos e envia notificações por email e WhatsApp
                </p>
              </div>
            </div>
            <Button
              onClick={handleRunExpiry}
              disabled={isRunningExpiry}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {isRunningExpiry ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Executar Agora
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="bg-blue-900/20 p-4 rounded-lg">
              <p className="text-blue-200 text-sm font-semibold mb-2">
                📅 Notificações enviadas:
              </p>
              <ul className="text-blue-300 text-sm space-y-1">
                <li>• 7 dias antes (email + WhatsApp)</li>
                <li>• 3 dias antes (email + WhatsApp)</li>
                <li>• 1 dia antes (email + WhatsApp)</li>
                <li>• No dia do vencimento (email + WhatsApp)</li>
                <li>• 1, 3 e 7 dias após (email + WhatsApp)</li>
              </ul>
            </div>

            {lastResultExpiry && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 ${
                  lastResultExpiry.success
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-red-900/20 border-red-500/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {lastResultExpiry.success ? (
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`font-bold mb-2 ${
                      lastResultExpiry.success ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {lastResultExpiry.success ? '✅ Verificação Concluída!' : '❌ Erro na Verificação'}
                    </p>
                    {lastResultExpiry.success && lastResultExpiry.report && (
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="bg-purple-900/30 p-2 rounded">
                          <p className="text-purple-400 text-xs">Total</p>
                          <p className="text-white font-bold">{lastResultExpiry.report.total_users}</p>
                        </div>
                        <div className="bg-green-900/30 p-2 rounded">
                          <p className="text-green-400 text-xs">Emails</p>
                          <p className="text-white font-bold">{lastResultExpiry.report.emails_sent}</p>
                        </div>
                        <div className="bg-cyan-900/30 p-2 rounded">
                          <p className="text-cyan-400 text-xs">WhatsApp</p>
                          <p className="text-white font-bold">{lastResultExpiry.report.whatsapp_sent}</p>
                        </div>
                        <div className="bg-red-900/30 p-2 rounded">
                          <p className="text-red-400 text-xs">Erros</p>
                          <p className="text-white font-bold">{lastResultExpiry.report.errors}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-cyan-900/20 border border-cyan-700/30 p-4 rounded-lg">
              <p className="text-cyan-300 text-sm font-semibold mb-2">
                🔗 URL para Agendador (Cron):
              </p>
              <code className="block bg-black/30 p-3 rounded text-cyan-200 text-xs break-all">
                {window.location.origin}/api/functions/checkSubscriptionExpiry
              </code>
              <p className="text-cyan-400 text-xs mt-2">
                Configure para executar todos os dias às 10h da manhã
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guia de Configuração */}
      <Card className="glass-card border-green-700/50">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" />
            📚 Guia: Como Configurar Agendador Automático
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Opção 1: EasyCron */}
            <div className="bg-green-900/20 border border-green-700/30 p-5 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">1️⃣</span>
                <h3 className="text-green-300 font-bold text-base">
                  EasyCron (Recomendado - Gratuito)
                </h3>
              </div>
              <ol className="text-green-200 text-sm space-y-2 list-decimal list-inside">
                <li>Acesse: <a href="https://www.easycron.com" target="_blank" className="text-cyan-300 underline">https://www.easycron.com</a></li>
                <li>Crie uma conta gratuita</li>
                <li>Clique em "Add Cron Job"</li>
                <li>
                  <strong>URL:</strong> Cole a URL da função acima
                  <code className="block bg-black/30 p-2 rounded text-xs mt-1 break-all">
                    {window.location.origin}/api/functions/sendSubscriptionReminders
                  </code>
                </li>
                <li><strong>Frequência:</strong> Escolha "Once a day" às 9:00 AM (GMT-3)</li>
                <li>Salve e ative!</li>
              </ol>
            </div>

            {/* Opção 2: Cron-Job.org */}
            <div className="bg-blue-900/20 border border-blue-700/30 p-5 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">2️⃣</span>
                <h3 className="text-blue-300 font-bold text-base">
                  Cron-Job.org (Gratuito)
                </h3>
              </div>
              <ol className="text-blue-200 text-sm space-y-2 list-decimal list-inside">
                <li>Acesse: <a href="https://cron-job.org" target="_blank" className="text-cyan-300 underline">https://cron-job.org</a></li>
                <li>Crie uma conta</li>
                <li>Vá em "Cronjobs" → "Create Cronjob"</li>
                <li>
                  <strong>URL:</strong> Cole a URL da função
                  <code className="block bg-black/30 p-2 rounded text-xs mt-1 break-all">
                    {window.location.origin}/api/functions/checkSubscriptionExpiry
                  </code>
                </li>
                <li><strong>Schedule:</strong> Every day at 10:00</li>
                <li>Salve!</li>
              </ol>
            </div>

            {/* Status Visual */}
            <div className="bg-yellow-900/20 border border-yellow-700/30 p-5 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="w-5 h-5 text-yellow-400" />
                <h3 className="text-yellow-300 font-bold">
                  ⚙️ Status do Sistema
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 p-3 rounded-lg">
                  <p className="text-purple-400 text-xs mb-1">Lembretes</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <p className="text-white text-sm font-semibold">Manual</p>
                  </div>
                  <p className="text-purple-300 text-xs mt-1">Configure agendador</p>
                </div>
                <div className="bg-black/20 p-3 rounded-lg">
                  <p className="text-blue-400 text-xs mb-1">Verificação</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <p className="text-white text-sm font-semibold">Manual</p>
                  </div>
                  <p className="text-blue-300 text-xs mt-1">Configure agendador</p>
                </div>
              </div>
            </div>

            {/* Teste Manual */}
            <div className="bg-purple-900/20 border border-purple-700/30 p-5 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Play className="w-5 h-5 text-purple-400" />
                <h3 className="text-purple-300 font-bold">
                  🧪 Teste Manual
                </h3>
              </div>
              <p className="text-purple-200 text-sm mb-3">
                Enquanto você não configura o agendador automático, use os botões acima para executar manualmente:
              </p>
              <ul className="text-purple-300 text-sm space-y-2">
                <li>
                  <strong className="text-purple-200">📧 Lembretes:</strong> Execute uma vez por dia (manhã)
                </li>
                <li>
                  <strong className="text-purple-200">🔔 Verificação:</strong> Execute uma vez por dia (tarde)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}