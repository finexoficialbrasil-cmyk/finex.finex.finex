
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
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
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  DollarSign,
  RefreshCw,
  Calendar,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Bug
} from "lucide-react";
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
  const [processingSubscriptions, setProcessingSubscriptions] = useState(new Set());

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log("🔄 AdminSubscriptions: Carregando dados via BACKEND...");
      setIsLoading(true);

      const response = await base44.functions.invoke('adminGetAllSubscriptions', {});

      if (response.data.success) {
        const { subscriptions: subsData, users: usersData } = response.data;

        console.log(`✅ AdminSubscriptions: ${subsData.length} assinaturas recebidas`);
        console.log(`✅ AdminSubscriptions: ${usersData.length} usuários recebidos`);

        setSubscriptions(subsData);
        setUsers(usersData);
      } else {
        console.error("❌ Erro ao carregar dados:", response.data.error);
        alert("❌ Erro ao carregar assinaturas. Verifique o console.");
      }

    } catch (error) {
      console.error("❌ AdminSubscriptions: Erro ao carregar dados:", error);
      alert("❌ Erro ao carregar assinaturas. Você é admin?");
    } finally {
      setIsLoading(false);
    }
  };

  const subscriptionsOfMonth = useMemo(() => {
    return subscriptions.filter(sub => {
      const subDate = new Date(sub.created_date);
      return subDate.getMonth() === selectedMonth &&
             subDate.getFullYear() === selectedYear;
    });
  }, [subscriptions, selectedMonth, selectedYear]);

  const monthStats = useMemo(() => {
    const total = subscriptionsOfMonth.length;
    const pending = subscriptionsOfMonth.filter(s => s.status === "pending").length;
    const active = subscriptionsOfMonth.filter(s => s.status === "active").length;
    const revenue = subscriptionsOfMonth
      .filter(s => s.status === "active" || s.status === "pending")
      .reduce((sum, s) => sum + s.amount_paid, 0);

    const byPlan = {
      monthly: 0,
      semester: 0,
      annual: 0,
      lifetime: 0
    };

    subscriptionsOfMonth
      .filter(s => s.status === "active" || s.status === "pending")
      .forEach(s => {
        if (byPlan[s.plan_type] !== undefined) {
          byPlan[s.plan_type] += s.amount_paid;
        }
      });

    return { total, pending, active, revenue, byPlan };
  }, [subscriptionsOfMonth]);

  const generalStats = useMemo(() => {
    const total = subscriptions.length;
    const pending = subscriptions.filter(s => s.status === "pending").length;
    const active = subscriptions.filter(s => s.status === "active").length;
    const totalRevenue = subscriptions
      .filter(s => s.status === "active")
      .reduce((sum, s) => sum + s.amount_paid, 0);

    return { total, pending, active, totalRevenue };
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptionsOfMonth.filter(sub => {
      const matchesSearch = sub.user_email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [subscriptionsOfMonth, searchTerm, filterStatus]);

  const duplicateUsers = useMemo(() => {
    const emailCounts = {};
    filteredSubscriptions.forEach(sub => {
      if (sub.status === 'pending') {
        emailCounts[sub.user_email] = (emailCounts[sub.user_email] || 0) + 1;
      }
    });
    return Object.entries(emailCounts).filter(([_, count]) => count > 1);
  }, [filteredSubscriptions]);

  const navigateMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

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
                             new Date(user.subscription_end_date) > new Date();

        const hasLifetime = user.subscription_plan === 'lifetime';

        if (!hasActivePlan && !hasLifetime) {
          await base44.entities.User.update(user.id, {
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

  // ✅ NOVO: Função de teste
  const handleTestApprove = async (subscription) => {
    if (processingSubscriptions.has(subscription.id)) {
      console.log("⚠️ Assinatura já está sendo processada");
      return;
    }

    if (!confirm(`🧪 TESTE DE APROVAÇÃO\n\nVou chamar a função de TESTE primeiro para verificar se tudo está OK.\n\nAssinatura: ${subscription.user_email}\n\nContinuar?`)) {
      return;
    }

    setProcessingSubscriptions(prev => new Set(prev).add(subscription.id));

    try {
      console.log("🧪 Chamando função de TESTE...");

      const response = await base44.functions.invoke('testAdminApprove', {
        subscription_id: subscription.id,
        user_email: subscription.user_email,
        plan_type: subscription.plan_type
      });

      console.log("📦 Resposta do TESTE:", response.data);

      if (response.data.success) {
        alert(`✅ TESTE PASSOU!\n\nTodos os checks funcionaram:\n• Autenticação: OK\n• Admin: OK\n• asServiceRole: OK\n• Entidades: OK\n\nAgora você pode tentar a aprovação real!`);
      } else {
        alert(`❌ TESTE FALHOU:\n\n${response.data.error}\n\nVeja o console (F12) para detalhes.`);
      }
    } catch (error) {
      console.error("❌ ERRO NO TESTE:", error);
      alert(`❌ Erro no teste:\n\n${error.message}\n\nVeja o console para mais detalhes.`);
    } finally {
      setProcessingSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(subscription.id);
        return newSet;
      });
    }
  };

  const handleApprove = async (subscription) => {
    if (processingSubscriptions.has(subscription.id)) {
      console.log("⚠️ Assinatura já está sendo processada, ignorando clique");
      return;
    }

    if (!confirm(`Aprovar pagamento de ${subscription.user_email}?\n\nPlano: ${subscription.plan_type}\nValor: R$ ${subscription.amount_paid.toFixed(2)}`)) {
      return;
    }

    setProcessingSubscriptions(prev => new Set(prev).add(subscription.id));

    try {
      console.log("🔄 Chamando backend function para aprovar...");
      console.log("📋 Dados:", {
        id: subscription.id,
        email: subscription.user_email,
        plan: subscription.plan_type
      });

      const response = await base44.functions.invoke('adminApproveSubscription', {
        subscription_id: subscription.id,
        user_email: subscription.user_email,
        plan_type: subscription.plan_type
      });

      console.log("📦 Resposta completa:", response.data);

      // ✅ NOVO: Mostrar logs do backend
      if (response.data.debugLog) {
        console.log("═══════════════════════════════════════");
        console.log("📋 LOGS DO BACKEND:");
        console.log("═══════════════════════════════════════");
        response.data.debugLog.forEach(log => console.log(log));
        console.log("═══════════════════════════════════════");
      }

      if (response.data.success) {
        alert("✅ Assinatura aprovada com sucesso!");
        await loadData();
      } else {
        // ✅ NOVO: Mostrar erro detalhado
        let errorMsg = `❌ Erro ao aprovar:\n\n${response.data.error}`;

        if (response.data.errorDetails) {
          errorMsg += `\n\nDetalhes:\n`;
          errorMsg += `Nome: ${response.data.errorDetails.name}\n`;
          errorMsg += `Mensagem: ${response.data.errorDetails.message}`;
        }

        if (response.data.debugLog) {
          errorMsg += `\n\n📋 Veja o console (F12) para logs completos do backend.`;
        }

        alert(errorMsg);
        throw new Error(response.data.error); // Re-throw to prevent generic catch alert
      }
    } catch (error) {
      console.error("❌ ERRO:", error);

      // Only show a generic alert if the more specific alerts weren't triggered by the try block
      // (e.g., for network errors or unexpected exceptions not caught by backend's 'success: false' path)
      if (!error.message.includes("Erro ao aprovar:") && !error.message.includes("Failed to fetch")) {
        alert(`❌ Erro ao aprovar: ${error.message}\n\nVerifique o console (F12) para mais detalhes.`);
      }
    } finally {
      setProcessingSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(subscription.id);
        return newSet;
      });
    }
  };

  const handleReject = async (subscription) => {
    if (processingSubscriptions.has(subscription.id)) {
      console.log("⚠️ Assinatura já está sendo processada, ignorando clique");
      return;
    }

    if (!confirm(`Rejeitar pagamento de ${subscription.user_email}?\n\nEsta ação NÃO pode ser desfeita!`)) {
      return;
    }

    setProcessingSubscriptions(prev => new Set(prev).add(subscription.id));

    try {
      console.log("🔄 Chamando backend function para rejeitar...");

      const response = await base44.functions.invoke('adminRejectSubscription', {
        subscription_id: subscription.id
      });

      console.log("📦 Resposta:", response.data);

      if (response.data.success) {
        alert("✅ Assinatura rejeitada com sucesso.");
        await loadData();
      } else {
        throw new Error(response.data.error || "Erro desconhecido");
      }
    } catch (error) {
      console.error("❌ Erro ao rejeitar:", error);
      alert("❌ Erro ao rejeitar assinatura.\n\nVerifique o console (F12) para mais detalhes.");
    } finally {
      setProcessingSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(subscription.id);
        return newSet;
      });
    }
  };

  const handleViewDetails = (subscription) => {
    setSelectedSubscription(subscription);
    setShowDetailsModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
        <p className="text-purple-300 text-center">Carregando assinaturas...</p>
        <p className="text-purple-400 text-sm mt-2">Isso pode levar alguns segundos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {duplicateUsers.length > 0 && (
        <Card className="glass-card border-0 border-l-4 border-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-300 font-semibold mb-2">⚠️ Assinaturas Duplicadas Detectadas</p>
                <p className="text-yellow-200 text-sm mb-3">
                  Os seguintes usuários têm múltiplas assinaturas pendentes:
                </p>
                <ul className="text-yellow-200 text-sm space-y-1">
                  {duplicateUsers.map(([email, count]) => (
                    <li key={email}>
                      • <strong>{email}</strong>: {count} assinaturas pendentes
                    </li>
                  ))}
                </ul>
                <p className="text-yellow-300 text-xs mt-3">
                  💡 Aprove apenas UMA por vez e verifique se o pagamento é válido antes de aprovar as demais.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Card className="glass-card border-0 border-l-4 border-cyan-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Estatísticas Gerais (Todos os Tempos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
              <p className="text-purple-300 text-sm">Total Assinaturas</p>
              <p className="text-3xl font-bold text-white">{generalStats.total}</p>
            </div>

            <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/30">
              <p className="text-yellow-300 text-sm">Pendentes</p>
              <p className="text-3xl font-bold text-white">{generalStats.pending}</p>
            </div>

            <div className="p-4 rounded-lg bg-green-900/20 border border-green-700/30">
              <p className="text-green-300 text-sm">Ativas</p>
              <p className="text-3xl font-bold text-white">{generalStats.active}</p>
            </div>

            <div className="p-4 rounded-lg bg-cyan-900/20 border border-cyan-700/30">
              <p className="text-cyan-300 text-sm">Receita Total</p>
              <p className="text-2xl font-bold text-white">R$ {generalStats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(-1)}
              className="border-purple-700 text-purple-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">
                  {monthNames[selectedMonth]} / {selectedYear}
                </h2>
              </div>
              <p className="text-purple-300 text-sm mt-1">
                {monthStats.total} assinatura(s) neste mês
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(1)}
              className="border-purple-700 text-purple-300"
              disabled={selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear()}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-300 text-sm">Assinaturas</p>
                <p className="text-3xl font-bold text-white">{monthStats.total}</p>
                <p className="text-purple-400 text-xs mt-1">neste mês</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-yellow-300 text-sm">Pendentes</p>
                <p className="text-3xl font-bold text-white">{monthStats.pending}</p>
                <p className="text-yellow-400 text-xs mt-1">aguardando aprovação</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-300 text-sm">Aprovadas</p>
                <p className="text-3xl font-bold text-white">{monthStats.active}</p>
                <p className="text-green-400 text-xs mt-1">já ativas</p>
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
                <p className="text-2xl font-bold text-white">R$ {monthStats.revenue.toFixed(2)}</p>
                <p className="text-cyan-400 text-xs mt-1">do mês</p>
              </div>
              <DollarSign className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-0">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Receita por Tipo de Plano ({monthNames[selectedMonth]}/{selectedYear})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-700/30">
              <p className="text-blue-300 text-sm font-semibold">💳 Mensal</p>
              <p className="text-2xl font-bold text-white mt-2">
                R$ {monthStats.byPlan.monthly.toFixed(2)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
              <p className="text-purple-300 text-sm font-semibold">📅 Semestral</p>
              <p className="text-2xl font-bold text-white mt-2">
                R$ {monthStats.byPlan.semester.toFixed(2)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-900/20 border border-green-700/30">
              <p className="text-green-300 text-sm font-semibold">📆 Anual</p>
              <p className="text-2xl font-bold text-white mt-2">
                R$ {monthStats.byPlan.annual.toFixed(2)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/30">
              <p className="text-yellow-300 text-sm font-semibold">⭐ Vitalício</p>
              <p className="text-2xl font-bold text-white mt-2">
                R$ {monthStats.byPlan.lifetime.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white">
            Assinaturas de {monthNames[selectedMonth]}/{selectedYear} ({filteredSubscriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-purple-400" />
              <p className="text-purple-300 text-lg">Nenhuma assinatura neste mês</p>
              <p className="text-purple-400 text-sm mt-2">
                Tente navegar para outro mês ou ajustar os filtros
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubscriptions.map((sub, index) => {
                const isProcessing = processingSubscriptions.has(sub.id);

                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex flex-col gap-3 p-4 rounded-xl glass-card ${isProcessing ? 'opacity-60' : ''}`}
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
                        disabled={isProcessing}
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
                            onClick={() => handleTestApprove(sub)}
                            disabled={isProcessing}
                            className="border-cyan-700 text-cyan-300"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Testando...
                              </>
                            ) : (
                              <>
                                <Bug className="w-3 h-3 mr-1" />
                                🧪 Testar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(sub)}
                            disabled={isProcessing}
                            className="border-green-700 text-green-300"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Aprovar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(sub)}
                            disabled={isProcessing}
                            className="border-red-700 text-red-300"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejeitar
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                    {selectedSubscription.payment_method === "free" && "Gratuito (Trial)"}
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
