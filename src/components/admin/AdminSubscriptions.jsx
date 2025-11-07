
import React, { useState, useEffect } from "react";
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
import { Search, CheckCircle, XCircle, Clock, Eye, Download, DollarSign, RefreshCw } from "lucide-react";
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subsData, usersData] = await Promise.all([
        Subscription.list("-created_date"),
        User.list()
      ]);
      setSubscriptions(subsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NOVA FUNÇÃO: Bloquear todos os usuários sem plano ativo
  const handleBlockAllWithoutPlan = async () => {
    if (!confirm("⚠️ ATENÇÃO!\n\nEsta ação irá BLOQUEAR todos os usuários que não têm plano ativo (exceto admins).\n\nOs usuários bloqueados terão que escolher um plano para continuar usando o sistema.\n\nDeseja continuar?")) {
      return;
    }

    setIsBlocking(true);
    try {
      let blocked = 0;
      
      for (const user of users) {
        // Pular admins
        if (user.role === 'admin') continue;
        
        // Verificar se tem plano ativo
        const hasActivePlan = user.subscription_status === 'active' && 
                             user.subscription_end_date && 
                             new Date(user.subscription_end_date) > new Date();
        
        const hasLifetime = user.subscription_plan === 'lifetime';
        
        // Se não tem plano ativo, bloquear
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
      // Calcular data de término
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      if (subscription.plan_type === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (subscription.plan_type === 'semester') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (subscription.plan_type === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (subscription.plan_type === 'lifetime') {
        endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime, effectively
      }

      // Atualizar assinatura para ativa
      await Subscription.update(subscription.id, {
        ...subscription,
        status: "active",
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      // Atualizar dados do usuário
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
    return <div className="text-purple-300 text-center py-12">Carregando assinaturas...</div>;
  }

  return (
    <div className="space-y-6">
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
