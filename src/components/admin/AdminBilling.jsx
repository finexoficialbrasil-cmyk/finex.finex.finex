
import React, { useState, useEffect } from "react";
import { BillingNotification } from "@/entities/BillingNotification";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkSubscriptionExpiry } from "@/functions/checkSubscriptionExpiry";
import {
  Bell,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  TrendingUp,
  Users,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Phone,
  Copy,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminBilling() {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [lastReport, setLastReport] = useState(null);
  const [stats, setStats] = useState({
    total_sent: 0,
    sent_today: 0,
    failed: 0,
    users_to_notify: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notificationsData, usersData] = await Promise.all([
        BillingNotification.list("-created_date", 100),
        User.list()
      ]);
      
      setNotifications(notificationsData);
      setUsers(usersData);
      
      calculateStats(notificationsData, usersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (notifs, allUsers) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = notifs.filter(n => {
      const nDate = new Date(n.created_date);
      return nDate.toDateString() === today.toDateString();
    }).length;

    const failed = notifs.filter(n => n.status === 'failed').length;

    // Calcular usuários que precisam de notificação
    let usersToNotify = 0;
    allUsers.forEach(user => {
      if (user.role === 'admin' || !user.subscription_end_date || user.subscription_plan === 'lifetime') return;
      
      const [year, month, day] = user.subscription_end_date.split('-').map(Number);
      const expiryDate = new Date(year, month - 1, day);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if ([7, 3, 1, 0, -1, -3, -7].includes(diffDays)) {
        usersToNotify++;
      }
    });

    setStats({
      total_sent: notifs.length,
      sent_today: sentToday,
      failed: failed,
      users_to_notify: usersToNotify
    });
  };

  const handleSendNotifications = async () => {
    if (!confirm("Deseja verificar vencimentos e enviar cobranças agora?")) return;

    setIsSending(true);
    try {
      const response = await checkSubscriptionExpiry({});
      const data = response.data;
      
      if (data.success) {
        setLastReport(data.report);
        
        // ✅ NOVO: Enriquecer relatório com dados dos usuários (telefones)
        if (data.report.details && data.report.details.length > 0) {
          const enrichedDetails = data.report.details.map(detail => {
            const user = users.find(u => u.email === detail.email);
            return {
              ...detail,
              phone: user?.phone || null,
              full_name: user?.full_name || 'Usuário',
              whatsapp_enabled: user?.whatsapp_notifications || false
            };
          });
          setLastReport({ ...data.report, details: enrichedDetails });
        }
        
        alert(`✅ Processo concluído!\n\n📧 Emails enviados: ${data.report.emails_sent || data.report.notifications_sent}\n📱 WhatsApp enviados: ${data.report.whatsapp_sent || 0}\n❌ Erros: ${data.report.errors}\n\nVeja os detalhes abaixo.`);
        await loadData();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao enviar notificações:", error);
      alert("❌ Erro ao processar. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`✅ ${label} copiado para a área de transferência!\n\n${text}`);
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    // Remove tudo que não é número
    const numbers = phone.replace(/\D/g, '');
    // Se não começa com 55, adiciona (Brasil)
    return numbers.startsWith('55') ? numbers : `55${numbers}`;
  };

  const openWhatsApp = (phone, name, type, expiryDate) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    if (!formattedPhone) return;
    
    // Template de mensagem baseado no tipo
    let message = '';
    const date = new Date(expiryDate).toLocaleDateString('pt-BR');
    
    if (type.includes('before')) {
      const days = type.includes('7') ? '7' : type.includes('3') ? '3' : '1';
      message = `⚠️ *FINEX - Aviso de Vencimento*\n\nOlá, *${name}*! 👋\n\n🚨 Seu plano vence em *${days} DIAS*!\n📅 Vencimento: *${date}*\n\n💡 Renove agora:\n👉 ${window.location.origin}/Plans\n\n✨ FINEX - Inteligência Financeira`;
    } else if (type === 'on_expiry') {
      message = `🔴 *FINEX - VENCE HOJE!*\n\n*${name}*, seu acesso será bloqueado EM BREVE! ⏰\n\n📅 Vence HOJE: *${date}*\n\n⚡ RENOVE IMEDIATAMENTE:\n👉 ${window.location.origin}/Plans\n\n✨ FINEX - Inteligência Financeira`;
    } else {
      message = `🔒 *FINEX - Acesso Bloqueado*\n\nOlá, *${name}*\n\nSeu plano venceu e seu acesso está *BLOQUEADO*.\n\n😢 Seus dados estão seguros, mas você não pode acessá-los.\n\n🔓 Renove e desbloqueie:\n👉 ${window.location.origin}/Plans\n\n✨ FINEX - Inteligência Financeira`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  };

  const getTypeLabel = (type) => {
    const labels = {
      '7_days_before': '📅 7 dias antes',
      '3_days_before': '⚠️ 3 dias antes',
      '1_day_before': '🚨 1 dia antes',
      'on_expiry': '🔴 No vencimento',
      '1_day_after': '🔒 1 dia após',
      '3_days_after': '🔒 3 dias após',
      '7_days_after': '💔 7 dias após'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    if (type.includes('before')) return 'bg-yellow-600';
    if (type === 'on_expiry') return 'bg-red-600';
    return 'bg-gray-600';
  };

  if (isLoading) {
    return <div className="text-purple-300 text-center py-12">Carregando dados de cobrança...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de envio */}
      <Card className="glass-card border-0 border-l-4 border-cyan-500">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Bell className="w-6 h-6 text-cyan-400" />
                Sistema de Cobranças Automáticas
              </h2>
              <p className="text-purple-300">
                Envie avisos de vencimento por email automaticamente
              </p>
            </div>
            <Button
              onClick={handleSendNotifications}
              disabled={isSending}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-lg px-8 py-6"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Verificar e Enviar Cobranças
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-300 text-sm">Total Enviados</p>
                <p className="text-3xl font-bold text-white">{stats.total_sent}</p>
                <p className="text-purple-400 text-xs mt-1">todos os tempos</p>
              </div>
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-cyan-300 text-sm">Enviados Hoje</p>
                <p className="text-3xl font-bold text-white">{stats.sent_today}</p>
                <p className="text-cyan-400 text-xs mt-1">nas últimas 24h</p>
              </div>
              <Send className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-yellow-300 text-sm">Para Notificar</p>
                <p className="text-3xl font-bold text-white">{stats.users_to_notify}</p>
                <p className="text-yellow-400 text-xs mt-1">usuários pendentes</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-300 text-sm">Erros</p>
                <p className="text-3xl font-bold text-white">{stats.failed}</p>
                <p className="text-red-400 text-xs mt-1">envios falhados</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ NOVO: Último Relatório COM TELEFONES */}
      {lastReport && (
        <Card className="glass-card border-0 border-l-4 border-green-500">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Último Relatório de Envio
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-green-900/20 border border-green-700/30">
                <p className="text-green-300 text-sm">Emails Enviados</p>
                <p className="text-3xl font-bold text-white">{lastReport.emails_sent || lastReport.notifications_sent}</p>
              </div>
              <div className="p-4 rounded-lg bg-cyan-900/20 border border-cyan-700/30">
                <p className="text-cyan-300 text-sm">WhatsApp Enviados</p>
                <p className="text-3xl font-bold text-white">{lastReport.whatsapp_sent || 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/30">
                <p className="text-red-300 text-sm">Erros</p>
                <p className="text-3xl font-bold text-white">{lastReport.errors}</p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-3">Por Tipo de Notificação:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(lastReport.by_type).map(([type, count]) => (
                  <div key={type} className="p-2 rounded bg-purple-900/20 border border-purple-700/30">
                    <p className="text-purple-300 text-xs">{getTypeLabel(type)}</p>
                    <p className="text-white font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ NOVO: Detalhes COM TELEFONES E BOTÕES WHATSAPP */}
            {lastReport.details && lastReport.details.length > 0 && (
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  Contatos para WhatsApp Manual:
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {lastReport.details.map((detail, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-xl glass-card border-l-4 border-cyan-500"
                    >
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-purple-600/20">
                              <Users className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-white font-bold">{detail.full_name || 'Usuário'}</p>
                              <p className="text-purple-300 text-sm">{detail.email}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 items-center ml-11">
                            <Badge className={getTypeColor(detail.type)}>
                              {getTypeLabel(detail.type)}
                            </Badge>
                            <span className="text-purple-300 text-xs">
                              📅 Vence: {new Date(detail.expiry_date).toLocaleDateString('pt-BR')}
                            </span>
                            {detail.sent_via && (
                              <Badge className="bg-cyan-600">
                                {detail.sent_via === 'both' && '📧📱 Email + WhatsApp'}
                                {detail.sent_via === 'email' && '📧 Email'}
                                {detail.sent_via === 'whatsapp' && '📱 WhatsApp'}
                              </Badge>
                            )}
                          </div>

                          {/* ✅ TELEFONE COM BOTÕES */}
                          {detail.phone ? (
                            <div className="ml-11 p-3 rounded-lg bg-green-900/20 border border-green-700/30">
                              <div className="flex items-center gap-3 mb-2">
                                <Phone className="w-4 h-4 text-green-400" />
                                <p className="text-green-300 font-mono text-lg">{detail.phone}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => copyToClipboard(detail.phone, 'Telefone')}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copiar Telefone
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => openWhatsApp(detail.phone, detail.full_name, detail.type, detail.expiry_date)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Abrir WhatsApp
                                </Button>
                              </div>
                              {detail.whatsapp_enabled && (
                                <p className="text-green-400 text-xs mt-2">
                                  ✅ Usuário aceita receber WhatsApp
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="ml-11 p-3 rounded-lg bg-red-900/20 border border-red-700/30">
                              <p className="text-red-300 text-sm">
                                ⚠️ Telefone não cadastrado
                              </p>
                            </div>
                          )}
                        </div>

                        <Badge className={
                          detail.status === 'sent' ? 'bg-green-600' :
                          detail.status === 'error' ? 'bg-red-600' :
                          'bg-gray-600'
                        }>
                          {detail.status === 'sent' && '✅ Enviado'}
                          {detail.status === 'error' && '❌ Erro'}
                          {detail.status === 'skipped' && '⏭️ Pulado'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações do Sistema */}
      <Card className="glass-card border-0">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Como Funciona o Sistema de Cobranças
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-cyan-900/20 border border-cyan-700/30">
              <h4 className="text-cyan-300 font-semibold mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Avisos Antes do Vencimento:
              </h4>
              <ul className="text-cyan-200 text-sm space-y-1 list-disc list-inside">
                <li>📅 <strong>7 dias antes:</strong> Aviso suave lembrando do vencimento</li>
                <li>⚠️ <strong>3 dias antes:</strong> Aviso mais urgente</li>
                <li>🚨 <strong>1 dia antes:</strong> Última chamada antes do bloqueio</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/30">
              <h4 className="text-red-300 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                No Dia e Após Vencimento:
              </h4>
              <ul className="text-red-200 text-sm space-y-1 list-disc list-inside">
                <li>🔴 <strong>No vencimento:</strong> Aviso urgente de vencimento HOJE</li>
                <li>🔒 <strong>1 dia após:</strong> Notifica que o acesso foi bloqueado</li>
                <li>🔒 <strong>3 dias após:</strong> Lembrete de renovação</li>
                <li>💔 <strong>7 dias após:</strong> Última chamada para renovar</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-green-900/20 border border-green-700/30">
              <h4 className="text-green-300 font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Proteções do Sistema:
              </h4>
              <ul className="text-green-200 text-sm space-y-1 list-disc list-inside">
                <li>✅ Cada usuário recebe no máximo 1 email por dia</li>
                <li>✅ Não envia emails duplicados</li>
                <li>✅ Registra todos os envios para auditoria</li>
                <li>✅ Link direto para renovação em cada email</li>
                <li>✅ Emails personalizados por nome do usuário</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-green-900/20 border border-green-700/30">
              <h4 className="text-green-300 font-semibold mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp Manual:
              </h4>
              <ul className="text-green-200 text-sm space-y-1 list-disc list-inside">
                <li>✅ Sistema envia EMAIL automaticamente</li>
                <li>✅ Você vê os TELEFONES no relatório</li>
                <li>✅ Botão "Abrir WhatsApp" com mensagem pronta</li>
                <li>✅ Botão "Copiar Telefone" para uso manual</li>
                <li>✅ Dupla cobertura: Email + WhatsApp</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
              <h4 className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recomendação de Uso:
              </h4>
              <p className="text-purple-200 text-sm">
                💡 <strong>Execute esta verificação 1 vez por dia</strong> (de preferência pela manhã) 
                para garantir que todos os usuários recebam os avisos no momento certo. Após o envio automático de emails,
                use os botões de WhatsApp para enviar mensagens manualmente e aumentar a taxa de renovação em 3-4x!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico Recente */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white">Histórico de Notificações (Últimas 50)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 mx-auto mb-4 text-purple-400" />
              <p className="text-purple-300 text-lg">Nenhuma notificação enviada ainda</p>
              <p className="text-purple-400 text-sm mt-2">
                Clique em "Verificar e Enviar Cobranças" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.slice(0, 50).map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center justify-between p-4 rounded-xl glass-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <p className="text-white font-medium">{notif.user_email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge className={getTypeColor(notif.notification_type)}>
                        {getTypeLabel(notif.notification_type)}
                      </Badge>
                      <span className="text-purple-300 text-xs">
                        📅 Vencimento: {new Date(notif.expiry_date).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-purple-400 text-xs">
                        • Enviado: {new Date(notif.created_date).toLocaleDateString('pt-BR')} às {new Date(notif.created_date).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <Badge className={
                    notif.status === 'sent' ? 'bg-green-600' :
                    notif.status === 'failed' ? 'bg-red-600' :
                    'bg-blue-600'
                  }>
                    {notif.status === 'sent' && '✅ Enviado'}
                    {notif.status === 'failed' && '❌ Erro'}
                    {notif.status === 'opened' && '👁️ Aberto'}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
