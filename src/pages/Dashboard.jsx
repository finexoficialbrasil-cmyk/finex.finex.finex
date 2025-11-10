import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Transaction, Account, Category, Goal, Bill } from "@/entities/all";
import { User } from "@/entities/User";
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

// ✅ NOVOS COMPONENTES PRO
const HeroSection = React.lazy(() => import("../components/dashboard/HeroSection"));
const StatsCardPro = React.lazy(() => import("../components/dashboard/StatsCardPro"));
const ActivityTimeline = React.lazy(() => import("../components/dashboard/ActivityTimeline"));
const InsightsIA = React.lazy(() => import("../components/dashboard/InsightsIA"));
const FinancialWidgets = React.lazy(() => import("../components/dashboard/FinancialWidgets"));
const AccountCard3D = React.lazy(() => import("../components/dashboard/AccountCard3D"));

// Componentes existentes
const TransactionList = React.lazy(() => import("../components/dashboard/TransactionList"));
const CashFlowChart = React.lazy(() => import("../components/dashboard/CashFlowChart"));
const GoalsProgress = React.lazy(() => import("../components/dashboard/GoalsProgress"));
const QuickActions = React.lazy(() => import("../components/dashboard/QuickActions"));
const VoiceAssistant = React.lazy(() => import("../components/VoiceAssistant"));
const SystemNotifications = React.lazy(() => import("../components/SystemNotifications"));
const ReceivablesNotification = React.lazy(() => import("../components/ReceivablesNotification"));

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [streak, setStreak] = useState(7); // Dias consecutivos usando o app

  useEffect(() => {
    loadData();
    updatePageTitle();
    calculateStreak();
  }, []);

  const updatePageTitle = useCallback(() => {
    document.title = "Dashboard - FINEX";
  }, []);

  const calculateStreak = () => {
    // Simular cálculo de streak (em produção, viria do backend)
    const lastAccess = localStorage.getItem('lastAccess');
    const today = new Date().toDateString();
    
    if (lastAccess === today) {
      const currentStreak = parseInt(localStorage.getItem('streak') || '0');
      setStreak(currentStreak);
    } else {
      const newStreak = (parseInt(localStorage.getItem('streak') || '0')) + 1;
      setStreak(newStreak);
      localStorage.setItem('streak', newStreak.toString());
      localStorage.setItem('lastAccess', today);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [userData, txs, accs, cats, gls, billsData] = await Promise.all([
        User.me(),
        Transaction.list("-created_date", 15),
        Account.list("-created_date", 10),
        Category.list("-created_date", 20),
        Goal.list("-created_date", 5),
        Bill.list("-due_date", 15)
      ]);
      
      setUser(userData);
      setTransactions(txs);
      setAccounts(accs);
      setCategories(cats);
      setGoals(gls);
      setBills(billsData);
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

    // Gerar dados para sparkline (últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayTransactions = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate.toDateString() === date.toDateString();
      });
      return dayTransactions.reduce((sum, t) => 
        sum + (t.type === 'income' ? t.amount : -t.amount), 0
      );
    });

    return { 
      totalIncome, 
      totalExpense, 
      balance, 
      monthTransactions,
      sparklineData: last7Days
    };
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
              Não foi possível carregar os dados. Verifique sua conexão.
            </p>
            <Button onClick={loadData} className="bg-gradient-to-r from-purple-600 to-pink-600">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const needsToChoosePlan = user && (!user.subscription_plan || user.subscription_status !== 'active');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity
          }}
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-600/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity
          }}
          className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-cyan-600/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* ✨ HERO SECTION PRO */}
        <React.Suspense fallback={<div className="h-48 bg-purple-900/20 animate-pulse rounded-3xl" />}>
          <HeroSection user={user} streak={streak} />
        </React.Suspense>

        {/* Call to Action - Escolher Plano */}
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
                      Para começar a usar todas as funcionalidades e ter controle total das suas finanças, 
                      <strong className="text-yellow-300"> escolha um plano agora</strong>!
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link to={createPageUrl("Plans")} className="flex-1 sm:flex-initial">
                        <Button className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-bold shadow-lg shadow-yellow-500/30 text-base">
                          <Crown className="w-5 h-5 mr-2" />
                          Ver Planos Premium
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Notificações do Sistema */}
        <React.Suspense fallback={null}>
          <ReceivablesNotification />
          <SystemNotifications />
        </React.Suspense>

        {/* Alertas */}
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

        {/* ✨ STATS CARDS PRO COM SPARKLINES */}
        <React.Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-purple-900/20 animate-pulse rounded-lg" />)}
          </div>
        }>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCardPro
              title="Saldo Total"
              value={`R$ ${stats.balance.toFixed(2)}`}
              icon={Wallet}
              gradient="from-purple-600 to-purple-400"
              trend="+5.2%"
              sparklineData={stats.sparklineData}
            />
            <StatsCardPro
              title="Entradas do Mês"
              value={`R$ ${stats.totalIncome.toFixed(2)}`}
              icon={ArrowUpRight}
              gradient="from-green-600 to-emerald-400"
              trend="+12.3%"
              sparklineData={stats.sparklineData.map(v => Math.max(0, v))}
            />
            <StatsCardPro
              title="Saídas do Mês"
              value={`R$ ${stats.totalExpense.toFixed(2)}`}
              icon={ArrowDownRight}
              gradient="from-red-600 to-pink-400"
              trend="-3.1%"
              sparklineData={stats.sparklineData.map(v => Math.abs(Math.min(0, v)))}
            />
            <StatsCardPro
              title="Economia"
              value={`R$ ${(stats.totalIncome - stats.totalExpense).toFixed(2)}`}
              icon={Target}
              gradient="from-cyan-600 to-blue-400"
              trend="+8.7%"
              sparklineData={stats.sparklineData}
            />
          </div>
        </React.Suspense>

        {/* ✨ INSIGHTS IA */}
        <React.Suspense fallback={<div className="h-64 bg-purple-900/20 animate-pulse rounded-lg" />}>
          <InsightsIA 
            transactions={transactions}
            accounts={accounts}
            goals={goals}
          />
        </React.Suspense>

        {/* ✨ FINANCIAL WIDGETS */}
        <React.Suspense fallback={<div className="h-80 bg-purple-900/20 animate-pulse rounded-lg" />}>
          <FinancialWidgets 
            transactions={transactions}
            bills={bills}
          />
        </React.Suspense>

        {/* ✨ CONTAS 3D */}
        <Card className="glass-card border-0 neon-glow">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="w-5 h-5 text-purple-400" />
              Minhas Contas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <React.Suspense fallback={
                <>
                  {accounts.map((_, i) => (
                    <div key={i} className="h-64 bg-purple-900/20 animate-pulse rounded-lg" />
                  ))}
                </>
              }>
                {accounts.map((acc, index) => (
                  <AccountCard3D key={acc.id} account={acc} index={index} />
                ))}
              </React.Suspense>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ✨ ACTIVITY TIMELINE */}
          <React.Suspense fallback={<div className="h-96 bg-purple-900/20 animate-pulse rounded-lg" />}>
            <ActivityTimeline transactions={transactions} goals={goals} />
          </React.Suspense>

          {/* Gráficos */}
          <div className="lg:col-span-2 space-y-6">
            <React.Suspense fallback={<div className="h-96 bg-purple-900/20 animate-pulse rounded-lg" />}>
              <CashFlowChart transactions={transactions} />
            </React.Suspense>
            
            <React.Suspense fallback={<div className="h-96 bg-purple-900/20 animate-pulse rounded-lg" />}>
              <GoalsProgress goals={goals} />
            </React.Suspense>
          </div>
        </div>

        {/* Quick Actions */}
        <React.Suspense fallback={<div className="h-48 bg-purple-900/20 animate-pulse rounded-lg" />}>
          <QuickActions />
        </React.Suspense>

        {/* Transaction List */}
        <React.Suspense fallback={<div className="h-96 bg-purple-900/20 animate-pulse rounded-lg" />}>
          <TransactionList
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            isLoading={isLoading}
          />
        </React.Suspense>
      </div>

      {/* Voice Assistant */}
      <React.Suspense fallback={null}>
        <VoiceAssistant onSuccess={loadData} />
      </React.Suspense>
    </div>
  );
}