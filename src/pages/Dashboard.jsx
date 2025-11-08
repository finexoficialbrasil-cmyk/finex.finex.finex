
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
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    loadData();
    updatePageTitle();
  }, []);

  const updatePageTitle = useCallback(() => {
    document.title = "Dashboard - FINEX";
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      console.log("🔄 Carregando dados do Dashboard...");
      
      const loadWithRetry = async (fn, retries = 2) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`⚠️ Tentativa ${i + 1} falhou, tentando novamente...`, error);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      };

      const [userData, txs, accs, cats, gls, billsData] = await Promise.all([
        loadWithRetry(() => User.me()),
        loadWithRetry(() => Transaction.list("-created_date", 30)),
        loadWithRetry(() => Account.list("-created_date", 20)),
        loadWithRetry(() => Category.list("-created_date", 50)),
        loadWithRetry(() => Goal.list("-created_date", 10)),
        loadWithRetry(() => Bill.list("-due_date", 15))
      ]);
      
      console.log(`✅ Dashboard carregou: ${txs.length} transações, ${accs.length} contas`);
      
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

    console.log("🔍 DEBUG Dashboard - Análise de Transações");
    console.log(`📅 Mês/Ano atual: ${currentMonth + 1}/${currentYear}`);
    console.log(`📊 Total de transações carregadas: ${transactions.length}`);

    const monthTransactions = transactions.filter(t => {
      if (!t.date) {
        console.warn("⚠️ Transação sem data:", t);
        return false;
      }
      
      const txDate = new Date(t.date);
      const txMonth = txDate.getMonth();
      const txYear = txDate.getFullYear();
      
      const isCurrentMonth = txMonth === currentMonth;
      const isCurrentYear = txYear === currentYear;
      const isCompleted = t.status === "completed";
      
      const shouldInclude = isCurrentMonth && isCurrentYear && isCompleted;
      
      if (t.type === "income") {
        console.log(`${shouldInclude ? "✅" : "❌"} ${t.description} | R$ ${t.amount} | ${t.date} | Status: ${t.status} | Mês: ${txMonth + 1}/${txYear}`);
      }
      
      return shouldInclude;
    });

    console.log(`📊 Transações filtradas do mês: ${monthTransactions.length}`);

    const incomeTransactions = monthTransactions.filter(t => t.type === "income");
    console.log(`💰 Transações de ENTRADA (${incomeTransactions.length}):`);
    incomeTransactions.forEach(t => {
      console.log(`  → ${t.description}: R$ ${t.amount.toFixed(2)} (${t.date})`);
    });

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

    const expenseTransactions = monthTransactions.filter(t => t.type === "expense");
    console.log(`💸 Transações de SAÍDA (${expenseTransactions.length}):`);
    expenseTransactions.forEach(t => {
      console.log(`  → ${t.description}: R$ ${t.amount.toFixed(2)} (${t.date})`);
    });

    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    console.log(`💰 TOTAL ENTRADAS: R$ ${totalIncome.toFixed(2)}`);
    console.log(`💸 TOTAL SAÍDAS: R$ ${totalExpense.toFixed(2)}`);

    const balance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return { totalIncome, totalExpense, balance, monthTransactions };
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

    const inactiveGoals = goals.filter(g => {
      if (g.status !== "active") return false;
      const lastUpdate = new Date(g.updated_date || g.created_date);
      return differenceInDays(today, lastUpdate) > 30;
    });
    
    if (inactiveGoals.length > 0) {
      alertsList.push({
        type: "info",
        icon: Target,
        title: `${inactiveGoals.length} meta(s) sem atualização`,
        message: "Algumas metas estão há mais de 30 dias sem progresso",
        action: "Ver Metas",
        link: createPageUrl("Goals")
      });
    }

    return alertsList;
  }, [bills, goals]);

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
            <Button
              onClick={loadData}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Tentar Novamente
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
                      
                      <Link to={createPageUrl("Plans")} className="flex-1 sm:flex-initial">
                        <Button variant="outline" className="w-full border-yellow-600/50 text-yellow-300 hover:bg-yellow-600/10">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Ver Recursos
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full blur-3xl" />
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
                  alert.type === "warning" ? "border-yellow-500 bg-yellow-900/10" :
                  "border-blue-500 bg-blue-900/10"
                } glass-card`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          alert.type === "error" ? "bg-red-600/20" :
                          alert.type === "warning" ? "bg-yellow-600/20" :
                          "bg-blue-600/20"
                        }`}>
                          <alert.icon className={`w-6 h-6 ${
                            alert.type === "error" ? "text-red-400" :
                            alert.type === "warning" ? "text-yellow-400" :
                            "text-blue-400"
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
              trend="+5.2%"
            />
            <StatsCard
              title="Entradas do Mês"
              value={`R$ ${stats.totalIncome.toFixed(2)}`}
              icon={ArrowUpRight}
              gradient="from-green-600 to-emerald-400"
              trend="+12.3%"
            />
            <StatsCard
              title="Saídas do Mês"
              value={`R$ ${stats.totalExpense.toFixed(2)}`}
              icon={ArrowDownRight}
              gradient="from-red-600 to-pink-400"
              trend="-3.1%"
            />
            <StatsCard
              title="Economia"
              value={`R$ ${(stats.totalIncome - stats.totalExpense).toFixed(2)}`}
              icon={Target}
              gradient="from-cyan-600 to-blue-400"
              trend="+8.7%"
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
        <VoiceAssistant onSuccess={loadData} />
      </React.Suspense>
    </div>
  );
}
