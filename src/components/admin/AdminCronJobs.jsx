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
  RefreshCw,
  Copy,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  Check
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminCronJobs() {
  const [isRunningReminders, setIsRunningReminders] = useState(false);
  const [isRunningExpiry, setIsRunningExpiry] = useState(false);
  const [lastResultReminders, setLastResultReminders] = useState(null);
  const [lastResultExpiry, setLastResultExpiry] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);

  const functionUrl1 = `${window.location.origin}/api/functions/sendSubscriptionReminders`;
  const functionUrl2 = `${window.location.origin}/api/functions/checkSubscriptionExpiry`;

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

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
      {/* Header Explicativo */}
      <Card className="glass-card border-cyan-700/50">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-600/20">
              <HelpCircle className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-xl">💡 Como Funciona a Automação de Emails</p>
              <p className="text-purple-300 text-sm font-normal mt-1">
                Entenda o processo e configure em 5 minutos
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="bg-purple-900/20 p-5 rounded-xl border border-purple-700/30">
              <p className="text-white font-bold mb-3 text-lg">📚 O que você precisa saber:</p>
              <div className="space-y-3 text-purple-200 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">1️⃣</span>
                  <div>
                    <p className="font-semibold text-white mb-1">O sistema FINEX já está pronto</p>
                    <p>As funções de email já estão criadas e funcionando perfeitamente!</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">2️⃣</span>
                  <div>
                    <p className="font-semibold text-white mb-1">Mas elas precisam ser "acionadas"</p>
                    <p>Como um despertador que toca todo dia, você precisa de um serviço que "chame" essas funções automaticamente.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">3️⃣</span>
                  <div>
                    <p className="font-semibold text-white mb-1">Usamos um serviço GRATUITO</p>
                    <p>O <strong className="text-cyan-300">EasyCron</strong> é um site que faz isso de graça! Ele vai "tocar o despertador" todo dia.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-900/20 border-2 border-green-500/50 p-5 rounded-xl">
              <p className="text-green-300 font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                ✅ Quando Configurado, o Sistema Faz Tudo Sozinho:
              </p>
              <ul className="text-green-200 text-sm space-y-2 list-disc list-inside">
                <li>Envia emails 3, 2, 1 dia ANTES do vencimento ⏰</li>
                <li>Envia no DIA do vencimento 📅</li>
                <li>Envia DEPOIS que vence (1, 5, 15, 30 dias) 📧</li>
                <li>Tudo AUTOMÁTICO, sem você precisar fazer NADA! 🎉</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TUTORIAL PASSO A PASSO - SUPER DETALHADO */}
      <Card className="glass-card border-yellow-700/50">
        <CardHeader className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-b border-yellow-700/30">
          <CardTitle className="text-white flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-600/20">
              <Zap className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl">🚀 TUTORIAL COMPLETO - Configure em 5 Minutos</p>
              <p className="text-yellow-300 text-sm font-normal mt-1">
                Siga EXATAMENTE estes passos (é mais fácil do que parece!)
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* PASSO 1 */}
            <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-2 border-blue-500/50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  1
                </div>
                <h3 className="text-white font-bold text-xl">🌐 Criar Conta no EasyCron</h3>
              </div>
              
              <div className="space-y-3 ml-13">
                <div className="bg-black/30 p-4 rounded-lg">
                  <p className="text-blue-200 mb-3">
                    <ArrowRight className="w-4 h-4 inline mr-2" />
                    Abra uma nova aba e acesse:
                  </p>
                  <a 
                    href="https://www.easycron.com/user/signup" 
                    target="_blank"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Abrir EasyCron (Nova Aba)
                  </a>
                </div>

                <div className="bg-blue-900/40 p-4 rounded-lg border border-blue-600/30">
                  <p className="text-blue-100 text-sm mb-2 font-semibold">📝 Na página do EasyCron:</p>
                  <ol className="text-blue-200 text-sm space-y-2 list-decimal list-inside">
                    <li>Clique em <strong className="text-white">"Sign Up"</strong> (Cadastrar)</li>
                    <li>Preencha seu email</li>
                    <li>Escolha uma senha</li>
                    <li>Clique em <strong className="text-white">"Create Account"</strong></li>
                    <li>Confirme seu email (cheque a caixa de entrada)</li>
                    <li>Faça login</li>
                  </ol>
                </div>

                <div className="bg-green-900/20 border border-green-600/30 p-3 rounded-lg">
                  <p className="text-green-200 text-xs">
                    ✅ <strong>Dica:</strong> É grátis e leva 2 minutos! Use o mesmo email que usa no FINEX.
                  </p>
                </div>
              </div>
            </div>

            {/* PASSO 2 */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  2
                </div>
                <h3 className="text-white font-bold text-xl">⏰ Criar Primeiro Cron Job (Lembretes)</h3>
              </div>
              
              <div className="space-y-3 ml-13">
                <div className="bg-purple-900/40 p-4 rounded-lg border border-purple-600/30">
                  <p className="text-purple-100 text-sm mb-3 font-semibold">📝 No painel do EasyCron:</p>
                  <ol className="text-purple-200 text-sm space-y-3 list-decimal list-inside">
                    <li className="font-semibold">
                      Clique no botão <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">+ New Cron Job</span>
                    </li>
                    <li>Preencha o formulário EXATAMENTE assim:</li>
                  </ol>
                </div>

                {/* Formulário Visual */}
                <div className="bg-black/40 p-5 rounded-lg border-2 border-cyan-500/50 space-y-4">
                  <div>
                    <Label className="text-cyan-300 text-sm font-bold mb-2 block">
                      📝 Cron Job Name (Nome):
                    </Label>
                    <div className="bg-white/10 p-3 rounded border border-cyan-600/50">
                      <code className="text-cyan-200 font-mono">FINEX - Lembretes de Vencimento</code>
                    </div>
                  </div>

                  <div>
                    <Label className="text-cyan-300 text-sm font-bold mb-2 block">
                      🔗 URL to Call (URL para chamar):
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/10 p-3 rounded border border-cyan-600/50 overflow-x-auto">
                        <code className="text-cyan-200 font-mono text-xs">{functionUrl1}</code>
                      </div>
                      <Button
                        onClick={() => handleCopy(functionUrl1, 'url1')}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        {copiedUrl === 'url1' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-cyan-400 text-xs mt-2">
                      👆 Clique no botão para COPIAR e depois COLE no campo do EasyCron
                    </p>
                  </div>

                  <div>
                    <Label className="text-cyan-300 text-sm font-bold mb-2 block">
                      ⏰ When to Execute (Quando executar):
                    </Label>
                    <div className="bg-yellow-900/30 p-4 rounded border border-yellow-600/50">
                      <p className="text-yellow-200 text-sm mb-2">
                        Selecione: <strong className="text-white">Every Day</strong> (Todo Dia)
                      </p>
                      <p className="text-yellow-200 text-sm mb-2">
                        Hora: <strong className="text-white">09:00</strong> (9 da manhã)
                      </p>
                      <p className="text-yellow-200 text-sm">
                        Timezone: <strong className="text-white">America/Sao_Paulo</strong> (Brasília)
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-cyan-300 text-sm font-bold mb-2 block">
                      📊 HTTP Method:
                    </Label>
                    <div className="bg-white/10 p-3 rounded border border-cyan-600/50">
                      <code className="text-cyan-200">GET</code>
                    </div>
                    <p className="text-cyan-400 text-xs mt-1">
                      (Deixe como GET - é o padrão)
                    </p>
                  </div>

                  <div className="bg-green-900/30 border border-green-600/50 p-4 rounded-lg">
                    <p className="text-green-200 text-sm">
                      ✅ Depois de preencher tudo, clique em <strong className="text-white">"Create Cron Job"</strong>
                    </p>
                  </div>
                </div>

                <div className="bg-green-900/20 border border-green-600/30 p-3 rounded-lg">
                  <p className="text-green-200 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <strong>Pronto!</strong> Agora o EasyCron vai executar essa função TODO DIA às 9h!
                  </p>
                </div>
              </div>
            </div>

            {/* PASSO 3 */}
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-500/50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
                  3
                </div>
                <h3 className="text-white font-bold text-xl">🔔 Criar Segundo Cron Job (Verificação)</h3>
              </div>
              
              <div className="space-y-3 ml-13">
                <p className="text-green-200 text-sm mb-3">
                  Agora repita o mesmo processo, mas com outra URL:
                </p>

                <div className="bg-black/40 p-5 rounded-lg border-2 border-cyan-500/50 space-y-4">
                  <div>
                    <Label className="text-cyan-300 text-sm font-bold mb-2 block">
                      📝 Nome:
                    </Label>
                    <div className="bg-white/10 p-3 rounded border border-cyan-600/50">
                      <code className="text-cyan-200 font-mono">FINEX - Verificação de Vencimentos</code>
                    </div>
                  </div>

                  <div>
                    <Label className="text-cyan-300 text-sm font-bold mb-2 block">
                      🔗 URL:
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/10 p-3 rounded border border-cyan-600/50 overflow-x-auto">
                        <code className="text-cyan-200 font-mono text-xs">{functionUrl2}</code>
                      </div>
                      <Button
                        onClick={() => handleCopy(functionUrl2, 'url2')}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        {copiedUrl === 'url2' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-cyan-300 text-sm font-bold mb-2 block">
                      ⏰ Quando:
                    </Label>
                    <div className="bg-yellow-900/30 p-4 rounded border border-yellow-600/50">
                      <p className="text-yellow-200 text-sm">
                        <strong className="text-white">Every Day às 10:00</strong> (uma hora depois do primeiro)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-900/20 border border-green-600/30 p-3 rounded-lg">
                  <p className="text-green-200 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <strong>Feito!</strong> Agora você tem 2 cron jobs configurados!
                  </p>
                </div>
              </div>
            </div>

            {/* PASSO 4 - VERIFICAR */}
            <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                  4
                </div>
                <h3 className="text-white font-bold text-xl">✅ Verificar se Funcionou</h3>
              </div>
              
              <div className="space-y-3 ml-13">
                <div className="bg-cyan-900/40 p-4 rounded-lg border border-cyan-600/30">
                  <p className="text-cyan-100 text-sm mb-3 font-semibold">No painel do EasyCron:</p>
                  <ul className="text-cyan-200 text-sm space-y-2 list-disc list-inside">
                    <li>Você verá seus 2 cron jobs listados</li>
                    <li>Status: <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs">Enabled</span> (Ativado)</li>
                    <li>Next Run: mostra quando vai executar (amanhã 9h e 10h)</li>
                    <li>Você pode clicar em "Run Now" para testar imediatamente!</li>
                  </ul>
                </div>

                <div className="bg-green-900/30 border-2 border-green-500/50 p-4 rounded-lg">
                  <p className="text-green-200 text-sm font-bold mb-2">
                    🎉 PARABÉNS! Está configurado!
                  </p>
                  <p className="text-green-300 text-sm">
                    A partir de agora, TODO DIA às 9h e 10h, o sistema vai verificar automaticamente 
                    e enviar emails para usuários que precisam renovar!
                  </p>
                </div>
              </div>
            </div>

            {/* Teste Manual Enquanto Configura */}
            <div className="bg-orange-900/20 border-2 border-orange-500/50 p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-orange-400" />
                <h3 className="text-orange-300 font-bold text-lg">
                  ⚠️ ENQUANTO NÃO CONFIGURAR:
                </h3>
              </div>
              <p className="text-orange-200 text-sm mb-4">
                Use os botões abaixo para executar MANUALMENTE (pelo menos 1x por dia):
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <Button
                  onClick={handleRunReminders}
                  disabled={isRunningReminders}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-14"
                >
                  {isRunningReminders ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      📧 Executar Lembretes AGORA
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleRunExpiry}
                  disabled={isRunningExpiry}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-14"
                >
                  {isRunningExpiry ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      🔔 Executar Verificação AGORA
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados dos Testes */}
      {(lastResultReminders || lastResultExpiry) && (
        <Card className="glass-card border-purple-700/50">
          <CardHeader>
            <CardTitle className="text-white">📊 Últimos Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      📧 Lembretes: {lastResultReminders.success ? 'Executado com Sucesso!' : 'Erro'}
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
                  </div>
                </div>
              </motion.div>
            )}

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
                      🔔 Verificação: {lastResultExpiry.success ? 'Concluída!' : 'Erro'}
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
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      <Card className="glass-card border-purple-700/50">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            ❓ Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="bg-purple-900/20 p-4 rounded-lg">
              <p className="text-white font-semibold mb-2">
                ❓ Preciso pagar algo?
              </p>
              <p className="text-purple-200 text-sm">
                ✅ <strong>NÃO!</strong> O plano gratuito do EasyCron permite até 100 cron jobs. 
                Você só precisa de 2, então está perfeito!
              </p>
            </div>

            <div className="bg-purple-900/20 p-4 rounded-lg">
              <p className="text-white font-semibold mb-2">
                ❓ É seguro dar minha URL para o EasyCron?
              </p>
              <p className="text-purple-200 text-sm">
                ✅ <strong>SIM!</strong> A URL é pública e segura. O EasyCron só chama a função, 
                e a função verifica se quem está chamando é admin antes de executar.
              </p>
            </div>

            <div className="bg-purple-900/20 p-4 rounded-lg">
              <p className="text-white font-semibold mb-2">
                ❓ E se eu esquecer de configurar?
              </p>
              <p className="text-purple-200 text-sm">
                ⚠️ Os emails não serão enviados automaticamente. Você terá que clicar nos botões 
                "Executar Agora" manualmente todo dia.
              </p>
            </div>

            <div className="bg-purple-900/20 p-4 rounded-lg">
              <p className="text-white font-semibold mb-2">
                ❓ Quanto tempo leva para configurar?
              </p>
              <p className="text-purple-200 text-sm">
                ⏱️ <strong>5 minutos!</strong> É bem rápido: criar conta (2min) + criar 2 cron jobs (3min).
              </p>
            </div>

            <div className="bg-purple-900/20 p-4 rounded-lg">
              <p className="text-white font-semibold mb-2">
                ❓ Como sei se está funcionando?
              </p>
              <p className="text-purple-200 text-sm">
                🔍 Vá na aba <strong className="text-white">"Emails"</strong> aqui no painel admin. 
                Lá você vê TODOS os emails enviados automaticamente!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternativas */}
      <Card className="glass-card border-blue-700/50">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            🔄 Outras Opções (se EasyCron não funcionar)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-600/30">
              <p className="text-blue-200 font-semibold mb-2">
                2️⃣ Cron-Job.org
              </p>
              <p className="text-blue-300 text-sm mb-2">
                Funciona igual ao EasyCron. Use as mesmas URLs.
              </p>
              <a 
                href="https://cron-job.org" 
                target="_blank"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Cron-Job.org
              </a>
            </div>

            <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-600/30">
              <p className="text-purple-200 font-semibold mb-2">
                3️⃣ UptimeRobot
              </p>
              <p className="text-purple-300 text-sm mb-2">
                Monitora URLs e pode "chamar" elas periodicamente.
              </p>
              <a 
                href="https://uptimerobot.com" 
                target="_blank"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir UptimeRobot
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component
function Label({ children, className = "" }) {
  return <label className={`block font-medium ${className}`}>{children}</label>;
}