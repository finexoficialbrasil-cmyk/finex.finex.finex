import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Subscription } from "@/entities/Subscription";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Search, CheckCircle, XCircle, Clock, Eye, Download, DollarSign, RefreshCw, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log("════════════════════════════════════════");
      console.log("🔄 AdminSubscriptions - Carregando dados...");
      console.log("════════════════════════════════════════");
      
      // ✅ TESTE 1: Tentar com função backend
      try {
        console.log("📊 Teste 1: Usando backend function...");
        const { data: response } = await base44.functions.invoke('adminGetAllSubscriptions');
        
        console.log("📦 Resposta completa:", JSON.stringify(response, null, 2));
        
        if (response?.success && response?.subscriptions && response?.users) {
          console.log(`✅ Backend function OK: ${response.subscriptions.length} subs, ${response.users.length} users`);
          
          if (response.subscriptions.length === 0) {
            console.log("⚠️ ATENÇÃO: 0 subscriptions encontradas no banco!");
            console.log("💡 Isto significa que as subscriptions NÃO estão sendo criadas/salvas.");
          }
          
          setSubscriptions(response.subscriptions);
          setUsers(response.users);
          setDebugInfo(response.debug);
          return;
        } else {
          console.warn("⚠️ Backend function retornou dados inválidos:", response);
        }
      } catch (funcError) {
        console.error("❌ Erro na backend function:", funcError);
        console.error("   Message:", funcError.message);
        console.error("   Stack:", funcError.stack);
      }
      
      // ✅ TESTE 2: Tentar direto com SDK (fallback)
      console.log("📊 Teste 2: Fallback - buscando direto...");
      const subsData = await Subscription.list("-created_date", 500);
      const usersData = await User.list("-created_date", 500);
      
      console.log(`✅ Fallback OK: ${subsData.length} subs, ${usersData.length} users`);
      
      if (subsData.length === 0) {
        console.log("⚠️ FALLBACK TAMBÉM RETORNOU 0 subscriptions!");
        console.log("💡 Problema confirmado: Subscriptions não estão no banco.");
      }
      
      setSubscriptions(subsData);
      setUsers(usersData);
      
    } catch (error) {
      console.error("════════════════════════════════════════");
      console.error("❌ ERRO CRÍTICO ao carregar dados:");
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
      console.error("════════════════════════════════════════");
      alert(`❌ Erro ao carregar dados:\n\n${error.message}\n\nVerifique o console (F12) para mais detalhes.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockAllWithoutPlan = async () => {
    if (!confirm("⚠️ ATENÇÃO!\n\nEsta ação irá BLOQUEAR todos os usuários que não têm plano ativo (exceto admins).\n\nOs usuários bloqueados terão que escolher um plano para continuar usando o sistema.\n\nDeseja continuar?")) {
      return;
    }

    setIsBlocking(true);
    try {
      let blocked = 0;
      
      for (const user of users) {
        if (user.role === 'admin') continue;
        
        const hasActivePlan = user.subscription_status === 'active' && 
                             user.subscription_end_date && 
                             user.subscription_end_date.includes('-') &&
                             new Date(user.subscription_end_date) > new Date();
        
        const hasLifetime = user.subscription_plan === 'lifetime';
        
        if (!hasActivePlan && !hasLifetime) {
          await User.update(user.id, {
            subscription_status: "pending",
            subscription_plan: null,
            subscription_end_date: null
          });
          blocked++;
        }
      }
      
      alert(`✅ Varredura concluída!\n\n🔒 ${blocked} usuário(s) bloqueado(s)\n\nTodos os usuários sem plano ativo agora precisarão escolher um plano.`);
      await loadData();
    } catch (error) {
      console.error("Erro ao bloquear usuários:", error);
      alert("❌ Erro durante a varredura. Tente novamente.");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleApprove = async (subscription) => {
    if (!confirm(`Aprovar pagamento de ${subscription.user_email}?`)) return;

    try {
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      if (subscription.plan_type === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (subscription.plan_type === 'semester') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (subscription.plan_type === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (subscription.plan_type === 'lifetime') {
        endDate.setFullYear(endDate.getFullYear() + 100);
      }

      await Subscription.update(subscription.id, {
        ...subscription,
        status: "active",
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      const user = users.find(u => u.email === subscription.user_email);
      if (user) {
        await User.update(user.id, {
          subscription_status: "active",
          subscription_plan: subscription.plan_type,
          subscription_end_date: endDate.toISOString().split('T')[0]
        });
      }

      alert("✅ Assinatura aprovada com sucesso!");
      loadData();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("❌ Erro ao aprovar assinatura.");
    }
  };

  const handleReject = async (subscription) => {
    if (!confirm(`Rejeitar pagamento de ${subscription.user_email}?`)) return;

    try {
      await Subscription.update(subscription.id, {
        ...subscription,
        status: "cancelled"
      });

      alert("❌ Assinatura rejeitada.");
      loadData();
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      alert("❌ Erro ao rejeitar assinatura.");
    }
  };

  const handleViewDetails = (subscription) => {
    setSelectedSubscription(subscription);
    setShowDetailsModal(true);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscriptions.length,
    pending: subscriptions.filter(s => s.status === "pending").length,
    active: subscriptions.filter(s => s.status === "active").length,
    revenue: subscriptions
      .filter(s => s.status === "active")
      .reduce((sum, s) => sum + s.amount_paid, 0)
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-purple-300">Carregando assinaturas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      {debugInfo && (
        <Card className="glass-card border-0 border-l-4 border-cyan-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-cyan-400" />
              <div className="text-xs text-cyan-200">
                <p>Debug: {debugInfo.subscriptions_count} subs carregadas | {debugInfo.users_count} users | {debugInfo.timestamp}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aviso se não houver subscriptions */}
      {subscriptions.length === 0 && (
        <Card className="glass-card border-0 border-l-4 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white font-bold text-lg mb-2">⚠️ Nenhuma Assinatura Encontrada</p>
                <p className="text-yellow-300 mb-3">
                  Não há registros de assinaturas no sistema.
                </p>
                <div className="bg-yellow-900/20 p-3 rounded-lg text-sm space-y-1 text-yellow-200 mb-4">
                  <p><strong>Possíveis causas:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Nenhum usuário fez pagamento ainda</li>
                    <li>As subscriptions não estão sendo criadas corretamente</li>
                    <li>Problema de permissão no banco de dados (RLS)</li>
                  </ul>
                  <p className="mt-3"><strong>💡 Para testar:</strong></p>
                  <p>1. Abra uma aba anônima (Ctrl+Shift+N)</p>
                  <p>2. Faça login como usuário normal</p>
                  <p>3. Vá em Assinaturas → Escolha um plano</p>
                  <p>4. Envie um comprovante fake</p>
                  <p>5. Abra o console (F12) e veja se mostra "Subscription criada"</p>
                  <p>6. Volte aqui e clique em Recarregar</p>
                </div>
                <Button
                  onClick={loadData}
                  disabled={isLoading}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {isLoading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Recarregando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Recarregar Dados
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão de Varredura */}
      <Card className="glass-card border-0 border-l-4 border-red-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white font-semibold">Bloquear Usuários Sem Plano</p>
              <p className="text-purple-300 text-sm">
                Faça uma varredura e bloqueie todos os usuários que não têm plano ativo
              </p>
            </div>
            <Button
              onClick={handleBlockAllWithoutPlan}
              disabled={isBlocking}
              className="bg-gradient-to-r from-red-600 to-orange-600"
            >
              {isBlocking ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Fazer Varredura e Bloquear
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-300 text-sm">Total</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-yellow-300 text-sm">Pendentes</p>
                <p className="text-3xl font-bold text-white">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-300 text-sm">Ativas</p>
                <p className="text-3xl font-bold text-white">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-cyan-300 text-sm">Receita</p>
                <p className="text-2xl font-bold text-white">R$ {stats.revenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
              <Input
                placeholder="Buscar por email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-purple-900/20 border-purple-700/50 text-white"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 bg-purple-900/20 border-purple-700/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      {subscriptions.length > 0 && (
        <Card className="glass-card border-0 neon-glow">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="text-white">Assinaturas ({filteredSubscriptions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {filteredSubscriptions.map((sub, index) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex flex-col gap-3 p-4 rounded-xl glass-card"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{sub.user_email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className="bg-purple-600/20 text-purple-400">
                          {sub.plan_type === "monthly" && "Mensal"}
                          {sub.plan_type === "semester" && "Semestral"}
                          {sub.plan_type === "annual" && "Anual"}
                          {sub.plan_type === "lifetime" && "Vitalício"}
                        </Badge>
                        <Badge className={
                          sub.status === "active" ? "bg-green-600" :
                          sub.status === "pending" ? "bg-yellow-600" :
                          sub.status === "expired" ? "bg-red-600" :
                          "bg-gray-600"
                        }>
                          {sub.status === "active" && "✅ Ativo"}
                          {sub.status === "pending" && "⏳ Pendente"}
                          {sub.status === "expired" && "⏰ Expirado"}
                          {sub.status === "cancelled" && "❌ Cancelado"}
                        </Badge>
                        <Badge className="bg-cyan-600/20 text-cyan-400">
                          R$ {sub.amount_paid.toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-purple-300 text-sm mt-2">
                        Criado em: {new Date(sub.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Comprovante inline */}
                  {sub.payment_proof_url && (
                    <div className="mt-3 pt-3 border-t border-purple-900/30">
                      <p className="text-purple-300 text-xs mb-2">📄 Comprovante:</p>
                      <img 
                        src={sub.payment_proof_url}
                        alt="Comprovante"
                        className="w-full max-h-48 object-contain rounded border border-purple-700/50 bg-purple-900/10 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => handleViewDetails(sub)}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-purple-900/30">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(sub)}
                      className="border-purple-700 text-purple-300"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver Detalhes
                    </Button>

                    {sub.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(sub)}
                          className="border-green-700 text-green-300"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Aprovar Manualmente
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(sub)}
                          className="border-red-700 text-red-300"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Detalhes da Assinatura
            </DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-purple-300 text-sm">Email</p>
                  <p className="text-white font-medium">{selectedSubscription.user_email}</p>
                </div>
                <div>
                  <p className="text-purple-300 text-sm">Plano</p>
                  <p className="text-white font-medium">
                    {selectedSubscription.plan_type === "monthly" && "Mensal"}
                    {selectedSubscription.plan_type === "semester" && "Semestral"}
                    {selectedSubscription.plan_type === "annual" && "Anual"}
                    {selectedSubscription.plan_type === "lifetime" && "Vitalício"}
                  </p>
                </div>
                <div>
                  <p className="text-purple-300 text-sm">Valor</p>
                  <p className="text-white font-medium">R$ {selectedSubscription.amount_paid.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-purple-300 text-sm">Método</p>
                  <p className="text-white font-medium">
                    {selectedSubscription.payment_method === "pix" && "PIX"}
                    {selectedSubscription.payment_method === "credit_card" && "Cartão"}
                    {selectedSubscription.payment_method === "boleto" && "Boleto"}
                    {selectedSubscription.payment_method === "transfer" && "Transferência"}
                  </p>
                </div>
                <div>
                  <p className="text-purple-300 text-sm">Data Início</p>
                  <p className="text-white font-medium">
                    {selectedSubscription.start_date ? new Date(selectedSubscription.start_date).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-purple-300 text-sm">Data Fim</p>
                  <p className="text-white font-medium">
                    {selectedSubscription.end_date ? new Date(selectedSubscription.end_date).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>

              {selectedSubscription.notes && (
                <div>
                  <p className="text-purple-300 text-sm">Observações</p>
                  <p className="text-white">{selectedSubscription.notes}</p>
                </div>
              )}

              {selectedSubscription.payment_proof_url && (
                <div>
                  <p className="text-purple-300 text-sm mb-2">Comprovante de Pagamento</p>
                  <img 
                    src={selectedSubscription.payment_proof_url} 
                    alt="Comprovante" 
                    className="w-full max-h-96 object-contain rounded border border-purple-700/50"
                  />
                  <a 
                    href={selectedSubscription.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 text-sm hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download do comprovante
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}