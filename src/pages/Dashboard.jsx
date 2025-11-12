import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  AlertTriangle,
  Clock,
  CheckCircle,
  Crown
} from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

const StatsCard = React.lazy(() => import("../components/dashboard/StatsCard"));
const TransactionList = React.lazy(() => import("../components/dashboard/TransactionList"));
const CashFlowChart = React.lazy(() => import("../components/dashboard/CashFlowChart"));
const GoalsProgress = React.lazy(() => import("../components/dashboard/GoalsProgress"));
const QuickActions = React.lazy(() => import("../components/dashboard/QuickActions"));
const VoiceAssistant = React.lazy(() => import("../components/VoiceAssistant"));
const SystemNotifications = React.lazy(() => import("../components/SystemNotifications"));
const ReceivablesNotification = React.lazy(() => import("../components/ReceivablesNotification"));

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    loadUser();
    document.title = "Dashboard - FINEX";
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error("❌ Erro ao carregar usuário:", error);
      setHasError(true);
    }
  };

  // ✅ OTIMIZADO: React Query com cache automático
  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: async () => {
      const { Transaction } = await import("@/entities/Transaction");
      return Transaction.list("-created_date", 10); // ✅ Apenas 10 mais recentes
    },
    staleTime: 1000 * 60 * 5, // ✅ Cache por 5 minutos
    enabled: !!user
  });

  const { data: accounts = [], isLoading: loadingAcc } = useQuery({
    queryKey: ['dashboard-accounts'],
    queryFn: async () => {
      const { Account } = await import("@/entities/Account");
      return Account.list("-created_date", 5); // ✅ Apenas 5 contas
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!user
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['dashboard-categories'],
    queryFn: async () => {
      const { Category } = await import("@/entities/Category");
      return Category.list("-created_date", 20);
    },
    staleTime: 1000 * 60 * 10, // ✅ Cache por 10 min (muda pouco)
    enabled: !!user
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['dashboard-goals'],
    queryFn: async () => {
      const { Goal } = await import("@/entities/Goal");
      return Goal.list("-created_date", 3); // ✅ Apenas 3 metas
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!user
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['dashboard-bills'],
    queryFn: async () => {
      const { Bill } = await import("@/entities/Bill");
      return Bill.list("-due_date", 5); // ✅ Apenas 5 contas próximas
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!user
  });

  const isLoading = loadingTx || loadingAcc;

  // ✅ OTIMIZADO: Cálculos memoizados
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTransactions = transactions.filter(t => {
      if (!t.date) return false;
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth && 
             txDate.getFullYear() === currentYear && 
             t.status === "completed";
    });

    const totalIncome = monthTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return { totalIncome, totalExpense, balance };
  }, [transactions, accounts]);

  const alerts = useMemo(() => {
    const alertsList = [];
    const today = new Date();

    const overdueBills = bills.filter(b => 
      b.status === "pending" && isBefore(new Date(b.due_date), today)
    );
    
    if (overdueBills.length > 0) {
      alertsList.push({
        type: "error",
        icon: AlertTriangle,
        title: `${overdueBills.length} conta(s) vencida(s)`,
        message: "Você tem contas vencidas que precisam de atenção!",
        action: "Ver Contas",
        link: createPageUrl("Payables")
      });
    }

    const upcomingBills = bills.filter(b => {
      if (b.status !== "pending") return false;
      const daysUntil = differenceInDays(new Date(b.due_date), today);
      return daysUntil >= 0 && daysUntil <= 3;
    });
    
    if (upcomingBills.length > 0) {
      alertsList.push({
        type: "warning",
        icon: Clock,
        title: `${upcomingBills.length} conta(s) vencendo em breve`,
        message: "Contas com vencimento nos próximos 3 dias",
        action: "Ver Contas",
        link: createPageUrl("Payables")
      });
    }

    return alertsList;
  }, [bills]);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center p-4">
        <Card className="glass-card border-0 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Erro ao Carregar</h2>
            <p className="text-purple-300 mb-4">
              Não foi possível carregar os dados.
            </p>
            <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-purple-600 to-pink-600">
              Recarregar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const needsToChoosePlan = user && (!user.subscription_plan || user.subscription_status !== 'active');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2 flex-wrap">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Seja bem-vindo, {user?.full_name || "Usuário"}
              </span>
              <span className="text-4xl md:text-5xl">👋</span>
            </h1>
            <p className="text-purple-300 mt-2">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <Link to={createPageUrl("Transactions") + "?action=new"} className="flex-shrink-0">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 neon-glow">
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </Link>
        </motion.div>

        {needsToChoosePlan && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden"
          >
            <Card className="glass-card border-0 border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-600/10 via-orange-600/10 to-red-600/10">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-600/30 to-orange-600/30 flex-shrink-0">
                    <Crown className="w-12 h-12 md:w-16 md:h-16 text-yellow-400" />
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                      🚀 Bem-vindo ao FINEX!
                    </h2>
                    <p className="text-yellow-200 text-base md:text-lg mb-4">
                      Escolha um plano para começar!
                    </p>
                    
                    <Link to={createPageUrl("Plans")}>
                      <Button className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-bold">
                        <Crown className="w-5 h-5 mr-2" />
                        Ver Planos
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <React.Suspense fallback={<div className="text-purple-300 text-center">Carregando...</div>}>
          <ReceivablesNotification />
          <SystemNotifications />
        </React.Suspense>

        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-l-4 ${
                  alert.type === "error" ? "border-red-500 bg-red-900/10" :
                  "border-yellow-500 bg-yellow-900/10"
                } glass-card`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          alert.type === "error" ? "bg-red-600/20" : "bg-yellow-600/20"
                        }`}>
                          <alert.icon className={`w-6 h-6 ${
                            alert.type === "error" ? "text-red-400" : "text-yellow-400"
                          }`} />
                        </div>
                        <div>
                          <p className="font-bold text-white">{alert.title}</p>
                          <p className="text-sm text-purple-300">{alert.message}</p>
                        </div>
                      </div>
                      <Link to={alert.link}>
                        <Button variant="outline" size="sm" className="border-purple-700 text-purple-300">
                          {alert.action}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <React.Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-purple-900/20 animate-pulse rounded-lg" />)}
        </div>}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Saldo Total"
              value={`R$ ${stats.balance.toFixed(2)}`}
              icon={Wallet}
              gradient="from-purple-600 to-purple-400"
            />
            <StatsCard
              title="Entradas do Mês"
              value={`R$ ${stats.totalIncome.toFixed(2)}`}
              icon={ArrowUpRight}
              gradient="from-green-600 to-emerald-400"
            />
            <StatsCard
              title="Saídas do Mês"
              value={`R$ ${stats.totalExpense.toFixed(2)}`}
              icon={ArrowDownRight}
              gradient="from-red-600 to-pink-400"
            />
            <StatsCard
              title="Economia"
              value={`R$ ${(stats.totalIncome - stats.totalExpense).toFixed(2)}`}
              icon={Target}
              gradient="from-cyan-600 to-blue-400"
            />
          </div>
        </React.Suspense>

        <Card className="glass-card border-0 neon-glow">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="w-5 h-5 text-purple-400" />
              Minhas Contas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-20 bg-purple-900/20 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((acc, index) => (
                  <motion.div
                    key={acc.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl glass-card border border-purple-700/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-300 text-sm">{acc.name}</p>
                        <p className="text-xl font-bold text-white mt-1">
                          R$ {acc.balance.toFixed(2)}
                        </p>
                      </div>
                      <div className={`p-2 rounded-full ${
                        acc.balance >= 0 ? "bg-green-600/20" : "bg-red-600/20"
                      }`}>
                        {acc.balance >= 0 ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <React.Suspense fallback={<div className="h-48 bg-purple-900/20 animate-pulse rounded-lg" />}>
          <QuickActions />
        </React.Suspense>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <React.Suspense fallback={<div className="h-96 bg-purple-900/20 animate-pulse rounded-lg" />}>
              <CashFlowChart transactions={transactions} />
            </React.Suspense>
          </div>

          <div>
            <React.Suspense fallback={<div className="h-96 bg-purple-900/20 animate-pulse rounded-lg" />}>
              <GoalsProgress goals={goals} />
            </React.Suspense>
          </div>
        </div>

        <React.Suspense fallback={<div className="h-96 bg-purple-900/20 animate-pulse rounded-lg" />}>
          <TransactionList
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            isLoading={isLoading}
          />
        </React.Suspense>
      </div>

      <React.Suspense fallback={null}>
        <VoiceAssistant />
      </React.Suspense>
    </div>
  );
}