import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { EmailLog } from "@/entities/EmailLog";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Mail, 
  Search, 
  CheckCircle, 
  XCircle, 
  Send,
  Loader2,
  Calendar,
  User as UserIcon,
  Filter,
  RefreshCw,
  MessageCircle,
  AlertTriangle,
  Clock,
  CheckSquare
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminEmailLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEmailType, setSelectedEmailType] = useState("3_days_before");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // ✅ NOVO: Estado para busca de usuário nos modais
  const [userSearchEmail, setUserSearchEmail] = useState("");
  const [userSearchWhatsApp, setUserSearchWhatsApp] = useState("");
  
  // ✅ NOVO: Estado para envio em massa
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkSearchTerm, setBulkSearchTerm] = useState("");
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsData, usersData] = await Promise.all([
        EmailLog.list("-created_date", 500),
        User.list("-created_date", 500)
      ]);
      
      setLogs(logsData);
      
      // ✅ Filtrar e calcular dias restantes
      const usersWithPlans = usersData.filter(u => u.role !== 'admin' && u.subscription_end_date);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const enrichedUsers = usersWithPlans.map(u => {
        const [year, month, day] = u.subscription_end_date.split('-').map(Number);
        const expiryDate = new Date(year, month - 1, day);
        expiryDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          ...u,
          daysUntilExpiry: diffDays
        };
      });
      
      setUsers(enrichedUsers);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar logs de email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendManualEmail = async () => {
    if (!selectedUser || !selectedEmailType) {
      alert("Selecione um usuário e tipo de email!");
      return;
    }

    setIsSending(true);
    try {
      console.log("📧 Enviando email manual...");
      
      const response = await base44.functions.invoke('sendManualReminderEmail', {
        user_email: selectedUser.email,
        email_type: selectedEmailType
      });

      if (response.data.success) {
        alert(`✅ Email enviado com sucesso para ${selectedUser.email}!`);
        setShowManualModal(false);
        setSelectedUser(null);
        setUserSearchEmail(""); // Limpar busca
        loadData();
      } else {
        throw new Error(response.data.error || "Erro ao enviar email");
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      alert(`❌ Erro ao enviar email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedUser) {
      alert("Selecione um usuário!");
      return;
    }

    if (!selectedUser.phone) {
      alert("❌ Este usuário não tem telefone cadastrado!");
      return;
    }

    if (!whatsappMessage.trim()) {
      alert("❌ Digite uma mensagem!");
      return;
    }

    setIsSending(true);
    try {
      const phone = selectedUser.phone.replace(/\D/g, '');
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      alert(`✅ WhatsApp aberto para ${selectedUser.full_name}!`);
      setShowWhatsAppModal(false);
      setWhatsappMessage("");
      setSelectedUser(null);
      setUserSearchWhatsApp(""); // Limpar busca
      
    } catch (error) {
      console.error("Erro ao abrir WhatsApp:", error);
      alert("❌ Erro ao abrir WhatsApp. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  };

  // ✅ NOVO: Função para enviar emails em massa
  const handleSendBulkEmails = async () => {
    if (selectedUsers.length === 0) {
      alert("❌ Selecione pelo menos um usuário!");
      return;
    }

    if (!confirm(`📧 Confirmar Envio em Massa\n\n✅ Enviar email de cobrança para ${selectedUsers.length} usuário(s)?\n\nTipo: ${formatEmailType(selectedEmailType)}`)) {
      return;
    }

    setIsSendingBulk(true);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      for (const userId of selectedUsers) {
        const user = users.find(u => u.id === userId);
        if (!user) continue;

        try {
          console.log(`📧 Enviando para: ${user.email}`);
          
          const response = await base44.functions.invoke('sendManualReminderEmail', {
            user_email: user.email,
            email_type: selectedEmailType
          });

          if (response.data.success) {
            successCount++;
            console.log(`   ✅ Enviado!`);
          } else {
            errorCount++;
            errors.push({ email: user.email, error: response.data.error });
            console.error(`   ❌ Erro:`, response.data.error);
          }

          // ✅ Pequeno delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          errorCount++;
          errors.push({ email: user.email, error: error.message });
          console.error(`   ❌ Erro ao enviar para ${user.email}:`, error);
        }
      }

      let message = `✅ ENVIO CONCLUÍDO!\n\n📊 Resultado:\n\n✅ Enviados: ${successCount}\n❌ Erros: ${errorCount}\n📧 Total: ${selectedUsers.length}`;
      
      if (errors.length > 0) {
        message += `\n\n❌ Erros:\n${errors.map(e => `• ${e.email}: ${e.error}`).join('\n')}`;
      }

      alert(message);
      
      setShowBulkEmailModal(false);
      setSelectedUsers([]);
      setBulkSearchTerm("");
      loadData();

    } catch (error) {
      console.error("❌ Erro no envio em massa:", error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setIsSendingBulk(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const selectAll = () => {
    const filtered = getFilteredUsersForBulk();
    setSelectedUsers(filtered.map(u => u.id));
  };

  const deselectAll = () => {
    setSelectedUsers([]);
  };

  const getFilteredUsersForBulk = () => {
    return users.filter(u => {
      const matchesSearch = !bulkSearchTerm || 
        u.email.toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(bulkSearchTerm.toLowerCase());
      
      return matchesSearch;
    }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  };

  const whatsappTemplates = {
    reminder: `Olá, {{USER_NAME}}! 👋

Passando para te lembrar que seu plano *{{PLAN_NAME}}* no FINEX está próximo do vencimento!

📅 *Vencimento:* {{EXPIRY_DATE}}

💜 Renove agora e mantenha acesso completo:
https://finex.base44.app

Qualquer dúvida, estou à disposição! 😊`,

    expired: `Olá, {{USER_NAME}}! 

Notamos que seu plano no FINEX expirou. 😔

Mas calma! Seus dados estão 100% seguros e você pode reativar a qualquer momento:

✅ Todo histórico preservado
✅ Reativação instantânea
✅ Acesso completo restaurado

🔓 Reative agora:
https://finex.base44.app

Estamos esperando você! 💜`,

    welcome: `Olá, {{USER_NAME}}! Seja muito bem-vindo(a) ao FINEX! 🎉

Estamos muito felizes em ter você conosco! 💜

🚀 *Próximos passos:*
1. Complete seu perfil
2. Escolha um plano
3. Comece a organizar suas finanças

📱 Precisa de ajuda? Responda esta mensagem!

Vamos juntos rumo ao sucesso financeiro! 💰✨`
  };

  const loadTemplate = (templateKey) => {
    const template = whatsappTemplates[templateKey];
    if (selectedUser && template) {
      const message = template
        .replace(/{{USER_NAME}}/g, selectedUser.full_name || selectedUser.email.split('@')[0])
        .replace(/{{PLAN_NAME}}/g, formatPlanName(selectedUser.subscription_plan))
        .replace(/{{EXPIRY_DATE}}/g, selectedUser.subscription_end_date ? 
          new Date(selectedUser.subscription_end_date).toLocaleDateString('pt-BR') : '-');
      
      setWhatsappMessage(message);
    }
  };

  // ✅ NOVO: Filtrar usuários para modal de Email
  const filteredUsersEmail = users.filter(u => {
    if (!userSearchEmail) return true;
    const search = userSearchEmail.toLowerCase();
    return (
      u.email.toLowerCase().includes(search) ||
      u.full_name?.toLowerCase().includes(search)
    );
  });

  // ✅ NOVO: Filtrar usuários para modal de WhatsApp
  const filteredUsersWhatsApp = users.filter(u => {
    if (!userSearchWhatsApp) return true;
    const search = userSearchWhatsApp.toLowerCase();
    return (
      u.email.toLowerCase().includes(search) ||
      u.full_name?.toLowerCase().includes(search)
    );
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || log.email_type === filterType;
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
    automatic: logs.filter(l => l.sent_by === 'automatic').length,
    manual: logs.filter(l => l.sent_by === 'manual').length
  };

  const formatEmailType = (type) => {
    const types = {
      '3_days_before': '3 Dias Antes',
      '2_days_before': '2 Dias Antes',
      '1_day_before': '1 Dia Antes',
      'expired_today': 'Vence Hoje',
      '1_day_after': '1 Dia Vencido',
      '5_days_after': '5 Dias Vencido',
      '15_days_after': '15 Dias Vencido',
      '30_days_after': '30 Dias Vencido',
      'monthly_after_30': 'Mensal (30+ dias)',
      'manual': 'Enviado Manualmente'
    };
    return types[type] || type;
  };

  const getEmailTypeColor = (type) => {
    if (type.includes('before')) return 'bg-green-600';
    if (type === 'expired_today') return 'bg-yellow-600';
    if (type.includes('after') || type === 'monthly_after_30') return 'bg-red-600';
    return 'bg-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-purple-300">Carregando logs de email...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-300 text-sm">Total Enviados</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-300 text-sm">Sucesso</p>
                <p className="text-3xl font-bold text-white">{stats.sent}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-300 text-sm">Falhas</p>
                <p className="text-3xl font-bold text-white">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-cyan-300 text-sm">Automáticos</p>
                <p className="text-3xl font-bold text-white">{stats.automatic}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-yellow-300 text-sm">Manuais</p>
                <p className="text-3xl font-bold text-white">{stats.manual}</p>
              </div>
              <Send className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-purple-900/20 border-purple-700/50 text-white"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto flex-wrap">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48 bg-purple-900/20 border-purple-700/50 text-white">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="3_days_before">3 Dias Antes</SelectItem>
                  <SelectItem value="2_days_before">2 Dias Antes</SelectItem>
                  <SelectItem value="1_day_before">1 Dia Antes</SelectItem>
                  <SelectItem value="expired_today">Vence Hoje</SelectItem>
                  <SelectItem value="1_day_after">1 Dia Vencido</SelectItem>
                  <SelectItem value="5_days_after">5 Dias Vencido</SelectItem>
                  <SelectItem value="15_days_after">15 Dias Vencido</SelectItem>
                  <SelectItem value="30_days_after">30 Dias Vencido</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-40 bg-purple-900/20 border-purple-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="sent">✅ Enviados</SelectItem>
                  <SelectItem value="failed">❌ Falhas</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setShowBulkEmailModal(true)}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 whitespace-nowrap"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                📧 Envio em Massa
              </Button>

              <Button
                onClick={() => setShowManualModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 whitespace-nowrap"
              >
                <Send className="w-4 h-4 mr-2" />
                📧 Email Individual
              </Button>

              <Button
                onClick={() => setShowWhatsAppModal(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                💬 WhatsApp
              </Button>

              <Button
                onClick={loadData}
                variant="outline"
                className="border-purple-700 text-purple-300"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white">
            Histórico de Emails ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="flex flex-col gap-3 p-4 rounded-xl glass-card border border-purple-700/30"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-purple-400" />
                      <p className="text-white font-semibold">{log.recipient_email}</p>
                      {log.status === 'sent' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>

                    <p className="text-purple-300 text-sm mb-2">{log.subject}</p>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={getEmailTypeColor(log.email_type)}>
                        {formatEmailType(log.email_type)}
                      </Badge>

                      {log.plan_type && (
                        <Badge className="bg-purple-600/20 text-purple-400">
                          {log.plan_type === 'monthly' && '📅 Mensal'}
                          {log.plan_type === 'semester' && '📅 Semestral'}
                          {log.plan_type === 'annual' && '📅 Anual'}
                          {log.plan_type === 'lifetime' && '♾️ Vitalício'}
                        </Badge>
                      )}

                      {log.days_difference !== undefined && (
                        <Badge variant="outline" className="border-cyan-600/40 text-cyan-400">
                          {log.days_difference > 0 ? `+${log.days_difference}` : log.days_difference} dias
                        </Badge>
                      )}

                      {log.sent_by === 'manual' && (
                        <Badge className="bg-yellow-600/20 text-yellow-400">
                          📧 Manual
                        </Badge>
                      )}

                      {log.status === 'sent' ? (
                        <Badge className="bg-green-600">✅ Enviado</Badge>
                      ) : (
                        <Badge className="bg-red-600">❌ Falhou</Badge>
                      )}
                    </div>

                    {log.error_message && (
                      <p className="text-red-400 text-xs mt-2">
                        ⚠️ Erro: {log.error_message}
                      </p>
                    )}

                    <p className="text-purple-400 text-xs mt-2">
                      📅 {new Date(log.created_date).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Email Modal */}
      <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              📧 Enviar Email Manual de Cobrança
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* ✅ NOVO: Campo de Busca */}
            <div>
              <Label className="text-purple-200 mb-2 block">
                <Search className="w-4 h-4 inline mr-2" />
                Buscar Usuário
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                <Input
                  placeholder="Digite nome ou email para buscar..."
                  value={userSearchEmail}
                  onChange={(e) => setUserSearchEmail(e.target.value)}
                  className="pl-10 bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>
              {userSearchEmail && (
                <p className="text-purple-400 text-xs mt-2">
                  📊 {filteredUsersEmail.length} usuário(s) encontrado(s)
                </p>
              )}
            </div>

            {/* Usuário */}
            <div>
              <Label className="text-purple-200 mb-2 block">Selecione o Usuário</Label>
              <Select 
                value={selectedUser?.id} 
                onValueChange={(value) => {
                  const user = users.find(u => u.id === value);
                  setSelectedUser(user);
                }}
              >
                <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredUsersEmail.length > 0 ? (
                    filteredUsersEmail.map(user => {
                      const [year, month, day] = user.subscription_end_date.split('-').map(Number);
                      const expiryDate = new Date(year, month - 1, day);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email} - Vence em {diffDays} dias
                        </SelectItem>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-purple-300 text-sm">
                      Nenhum usuário encontrado
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Email */}
            <div>
              <Label className="text-purple-200 mb-2 block">Tipo de Email</Label>
              <Select value={selectedEmailType} onValueChange={setSelectedEmailType}>
                <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3_days_before">⏰ 3 Dias Antes do Vencimento</SelectItem>
                  <SelectItem value="2_days_before">⚠️ 2 Dias Antes (Urgente)</SelectItem>
                  <SelectItem value="1_day_before">🔴 1 Dia Antes (Último Dia)</SelectItem>
                  <SelectItem value="expired_today">🔴 Vence Hoje</SelectItem>
                  <SelectItem value="1_day_after">❌ 1 Dia Vencido (Bloqueado)</SelectItem>
                  <SelectItem value="5_days_after">💜 5 Dias Vencido (Sentimos Falta)</SelectItem>
                  <SelectItem value="15_days_after">🎯 15 Dias Vencido (Última Chance)</SelectItem>
                  <SelectItem value="30_days_after">🚨 30 Dias Vencido (Crítico)</SelectItem>
                  <SelectItem value="monthly_after_30">💔 Mensal (Após 30 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedUser && (
              <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                <p className="text-sm text-purple-200 mb-2">
                  <strong>📧 Para:</strong> {selectedUser.email}
                </p>
                <p className="text-sm text-purple-200 mb-2">
                  <strong>👤 Nome:</strong> {selectedUser.full_name}
                </p>
                <p className="text-sm text-purple-200 mb-2">
                  <strong>📋 Plano:</strong> {selectedUser.subscription_plan}
                </p>
                <p className="text-sm text-purple-200">
                  <strong>📅 Vencimento:</strong> {new Date(selectedUser.subscription_end_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            <div className="bg-yellow-900/20 border border-yellow-700/30 p-4 rounded-lg">
              <p className="text-yellow-300 text-sm">
                ⚠️ <strong>ATENÇÃO:</strong> O email será enviado imediatamente após clicar em "Enviar".
                Certifique-se de escolher o tipo correto de acordo com a situação do usuário.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowManualModal(false);
                  setUserSearchEmail("");
                  setSelectedUser(null);
                }}
                disabled={isSending}
                className="flex-1 border-purple-700 text-purple-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendManualEmail}
                disabled={isSending || !selectedUser}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Email Modal */}
      <Dialog open={showBulkEmailModal} onOpenChange={setShowBulkEmailModal}>
        <DialogContent className="glass-card border-orange-700/50 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              📧 Envio em Massa - Selecione Usuários
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Info Card */}
            <div className="bg-orange-900/20 border border-orange-700/30 p-4 rounded-lg flex-shrink-0">
              <p className="text-orange-200 text-sm">
                ✅ Selecione os usuários que estão <strong>vencendo ou vencidos</strong> para enviar emails de cobrança.
              </p>
            </div>

            {/* Tipo de Email */}
            <div className="flex-shrink-0">
              <Label className="text-purple-200 mb-2 block font-semibold">Tipo de Email a Enviar</Label>
              <Select value={selectedEmailType} onValueChange={setSelectedEmailType}>
                <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3_days_before">⏰ 3 Dias Antes</SelectItem>
                  <SelectItem value="2_days_before">⚠️ 2 Dias Antes</SelectItem>
                  <SelectItem value="1_day_before">🔴 1 Dia Antes</SelectItem>
                  <SelectItem value="expired_today">🔴 Vence Hoje</SelectItem>
                  <SelectItem value="1_day_after">❌ 1 Dia Vencido</SelectItem>
                  <SelectItem value="5_days_after">💜 5 Dias Vencido</SelectItem>
                  <SelectItem value="15_days_after">🎯 15 Dias Vencido</SelectItem>
                  <SelectItem value="30_days_after">🚨 30 Dias Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Busca e Seleção */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-purple-200 font-semibold">
                  Usuários ({selectedUsers.length} selecionados)
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={selectAll}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    ✅ Todos
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={deselectAll}
                    variant="outline"
                    className="border-red-700 text-red-300"
                  >
                    ❌ Limpar
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={bulkSearchTerm}
                  onChange={(e) => setBulkSearchTerm(e.target.value)}
                  className="pl-10 bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>
            </div>

            {/* Lista de Usuários - Scrollable */}
            <div className="flex-1 overflow-y-auto border border-purple-700/30 rounded-lg bg-purple-900/10">
              <div className="p-3 space-y-2">
                {getFilteredUsersForBulk().map(user => {
                  const isSelected = selectedUsers.includes(user.id);
                  const daysUntil = user.daysUntilExpiry;
                  
                  let statusColor = 'text-green-400';
                  let statusText = `✅ ${daysUntil} dias`;
                  let statusIcon = <Clock className="w-4 h-4" />;
                  
                  if (daysUntil <= 0) {
                    statusColor = 'text-red-400';
                    statusText = `❌ Vencido há ${Math.abs(daysUntil)} dias`;
                    statusIcon = <XCircle className="w-4 h-4" />;
                  } else if (daysUntil <= 3) {
                    statusColor = 'text-yellow-400';
                    statusText = `⚠️ ${daysUntil} dias`;
                    statusIcon = <AlertTriangle className="w-4 h-4" />;
                  } else if (daysUntil <= 7) {
                    statusColor = 'text-orange-400';
                    statusText = `⏰ ${daysUntil} dias`;
                  }

                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-600/40 border-2 border-purple-500'
                          : 'bg-purple-900/20 border border-purple-700/30 hover:bg-purple-900/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-purple-600 border-purple-400' : 'border-purple-600'
                        }`}>
                          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm mb-1 truncate">
                            {user.full_name || user.email}
                          </p>
                          <p className="text-purple-300 text-xs mb-2 truncate">{user.email}</p>
                          
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className={`flex items-center gap-1 ${statusColor} text-xs`}>
                              {statusIcon}
                              <span className="font-semibold">{statusText}</span>
                            </div>
                            
                            <Badge className="bg-purple-600/20 text-purple-300 text-xs">
                              {user.subscription_plan === 'monthly' && '📅 Mensal'}
                              {user.subscription_plan === 'semester' && '📅 Semestral'}
                              {user.subscription_plan === 'annual' && '📅 Anual'}
                            </Badge>
                            
                            <span className="text-purple-400 text-xs">
                              📅 {new Date(user.subscription_end_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {getFilteredUsersForBulk().length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-purple-300">Nenhum usuário encontrado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resumo e Botões */}
            <div className="flex-shrink-0 space-y-3 border-t border-purple-700/30 pt-4">
              {selectedUsers.length > 0 && (
                <div className="bg-green-900/20 border border-green-700/30 p-3 rounded-lg">
                  <p className="text-green-200 text-sm font-semibold">
                    ✅ {selectedUsers.length} usuário(s) selecionado(s)
                  </p>
                  <p className="text-green-300 text-xs mt-1">
                    Tipo: <strong>{formatEmailType(selectedEmailType)}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowBulkEmailModal(false);
                    setSelectedUsers([]);
                    setBulkSearchTerm("");
                  }}
                  disabled={isSendingBulk}
                  className="flex-1 border-purple-700 text-purple-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendBulkEmails}
                  disabled={isSendingBulk || selectedUsers.length === 0}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  {isSendingBulk ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando {selectedUsers.length} emails...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      📧 Enviar para {selectedUsers.length} Usuário(s)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Modal */}
      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent className="glass-card border-green-700/50 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              💬 Enviar Mensagem WhatsApp
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* ✅ NOVO: Campo de Busca */}
            <div>
              <Label className="text-purple-200 mb-2 block">
                <Search className="w-4 h-4 inline mr-2" />
                Buscar Usuário
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                <Input
                  placeholder="Digite nome ou email para buscar..."
                  value={userSearchWhatsApp}
                  onChange={(e) => setUserSearchWhatsApp(e.target.value)}
                  className="pl-10 bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>
              {userSearchWhatsApp && (
                <p className="text-purple-400 text-xs mt-2">
                  📊 {filteredUsersWhatsApp.length} usuário(s) encontrado(s)
                </p>
              )}
            </div>

            {/* Usuário */}
            <div>
              <Label className="text-purple-200 mb-2 block">Selecione o Usuário</Label>
              <Select 
                value={selectedUser?.id} 
                onValueChange={(value) => {
                  const user = users.find(u => u.id === value);
                  setSelectedUser(user);
                  setWhatsappMessage("");
                }}
              >
                <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredUsersWhatsApp.length > 0 ? (
                    filteredUsersWhatsApp.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email} {!user.phone && '(⚠️ SEM TELEFONE)'}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-purple-300 text-sm">
                      Nenhum usuário encontrado
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Detalhes do Usuário */}
            {selectedUser && (
              <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                <p className="text-sm text-purple-200 mb-2">
                  <strong>📧 Email:</strong> {selectedUser.email}
                </p>
                <p className="text-sm text-purple-200 mb-2">
                  <strong>👤 Nome:</strong> {selectedUser.full_name}
                </p>
                <p className="text-sm text-purple-200 mb-2">
                  <strong>📱 Telefone:</strong> {selectedUser.phone || '❌ Não cadastrado'}
                </p>
                {selectedUser.subscription_end_date && (
                  <p className="text-sm text-purple-200">
                    <strong>📅 Vencimento:</strong> {new Date(selectedUser.subscription_end_date).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            )}

            {/* Templates Rápidos */}
            <div>
              <Label className="text-purple-200 mb-2 block">Templates Rápidos</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate('welcome')}
                  disabled={!selectedUser}
                  className="border-green-700 text-green-300 hover:bg-green-900/20"
                >
                  🎉 Boas-vindas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate('reminder')}
                  disabled={!selectedUser}
                  className="border-yellow-700 text-yellow-300 hover:bg-yellow-900/20"
                >
                  ⏰ Lembrete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate('expired')}
                  disabled={!selectedUser}
                  className="border-red-700 text-red-300 hover:bg-red-900/20"
                >
                  ❌ Expirado
                </Button>
              </div>
            </div>

            {/* Mensagem */}
            <div>
              <Label className="text-purple-200 mb-2 block">Mensagem</Label>
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                className="w-full min-h-[200px] bg-purple-900/20 border border-purple-700/50 text-white rounded-lg p-4 resize-y"
                required
              />
              <p className="text-purple-400 text-xs mt-2">
                💡 Use *negrito* para destacar palavras importantes
              </p>
            </div>

            {/* Aviso */}
            <div className="bg-yellow-900/20 border border-yellow-700/30 p-4 rounded-lg">
              <p className="text-yellow-300 text-sm">
                ⚠️ <strong>ATENÇÃO:</strong> Isso abrirá o WhatsApp Web com a mensagem pronta. 
                Você precisará clicar em "Enviar" manualmente no WhatsApp.
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowWhatsAppModal(false);
                  setWhatsappMessage("");
                  setSelectedUser(null);
                  setUserSearchWhatsApp("");
                }}
                disabled={isSending}
                className="flex-1 border-purple-700 text-purple-300"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={isSending || !selectedUser || !selectedUser.phone || !whatsappMessage.trim()}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Abrindo...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    💬 Abrir WhatsApp
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatPlanName(plan) {
  const plans = {
    monthly: 'Mensal',
    semester: 'Semestral',
    annual: 'Anual',
    lifetime: 'Vitalício'
  };
  return plans[plan] || plan || 'Premium';
}