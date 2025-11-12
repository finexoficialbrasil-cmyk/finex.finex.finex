
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
  Crown,
  CreditCard,
  PiggyBank,
  Landmark,
  Bitcoin,
  ChevronRight,
  TrendingUpIcon,
  Building2
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
    const startTime = performance.now();
    setIsLoading(true);
    setHasError(false);
    
    try {
      console.log("⚡ Dashboard - Início do carregamento...");
      
      // ✅ SUPER OTIMIZADO: Só o essencial, limites mínimos
      const [userData, txs, accs] = await Promise.all([
        User.me(),
        Transaction.list("-created_date", 5), // ✅ MÍNIMO: apenas 5 para o dashboard
        Account.list("-created_date", 5) // ✅ MÍNIMO: apenas 5 contas
      ]);
      
      const loadTime = performance.now() - startTime;
      console.log(`⚡ Dashboard - Dados principais carregados em ${loadTime.toFixed(0)}ms`);
      
      setUser(userData);
      setTransactions(txs);
      setAccounts(accs);
      setIsLoading(false);
      
      // ✅ Carregar resto em background (não bloqueia UI)
      loadSecondaryData();
      
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

  const loadSecondaryData = async () => {
    try {
      console.log("🔄 Carregando dados secundários...");
      const [cats, gls, billsData] = await Promise.all([
        Category.list("-created_date", 15), // Reduzido
        Goal.list("-created_date", 3), // Reduzido
        Bill.list("-due_date", 5) // Reduzido
      ]);
      
      setCategories(cats);
      setGoals(gls);
      setBills(billsData);
      console.log("✅ Dados secundários carregados");
    } catch (error) {
      console.error("⚠️ Erro ao carregar dados secundários (não crítico):", error);
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTransactions = transactions.filter(t => {
      if (!t.date) return false;
      
      const txDate = new Date(t.date);
      const txMonth = txDate.getMonth();
      const txYear = txDate.getFullYear();
      
      return txMonth === currentMonth && txYear === currentYear && t.status === "completed";
    });

    const totalIncome = monthTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

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

  const isUrlImage = (icon) => {
    return icon && (icon.startsWith('http://') || icon.startsWith('https://'));
  };

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

        <React.Suspense fallback={null}>
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
                transition={{ delay: index * 0.05 }}
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

        {/* Stats Cards - Renderiza imediatamente com dados disponíveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <React.Suspense fallback={<div className="h-32 bg-purple-900/20 animate-pulse rounded-lg" />}>
            <StatsCard
              title="Saldo Total"
              value={`R$ ${stats.balance.toFixed(2)}`}
              icon={Wallet}
              gradient="from-purple-600 to-purple-400"
              trend="+5.2%"
            />
          </React.Suspense>
          <React.Suspense fallback={<div className="h-32 bg-purple-900/20 animate-pulse rounded-lg" />}>
            <StatsCard
              title="Entradas do Mês"
              value={`R$ ${stats.totalIncome.toFixed(2)}`}
              icon={ArrowUpRight}
              gradient="from-green-600 to-emerald-400"
              trend="+12.3%"
            />
          </React.Suspense>
          <React.Suspense fallback={<div className="h-32 bg-purple-900/20 animate-pulse rounded-lg" />}>
            <StatsCard
              title="Saídas do Mês"
              value={`R$ ${stats.totalExpense.toFixed(2)}`}
              icon={ArrowDownRight}
              gradient="from-red-600 to-pink-400"
              trend="-3.1%"
            />
          </React.Suspense>
          <React.Suspense fallback={<div className="h-32 bg-purple-900/20 animate-pulse rounded-lg" />}>
            <StatsCard
              title="Economia"
              value={`R$ ${(stats.totalIncome - stats.totalExpense).toFixed(2)}`}
              icon={Target}
              gradient="from-cyan-600 to-blue-400"
              trend="+8.7%"
            />
          </React.Suspense>
        </div>

        {/* ✅ CARTEIRAS COM LOGOS OFICIAIS DOS BANCOS */}
        <Card className="glass-card border-0 neon-glow overflow-hidden">
          <CardHeader className="border-b border-purple-900/30 bg-gradient-to-r from-purple-900/30 to-pink-900/20">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Minhas Carteiras</h3>
                  <p className="text-purple-300 text-sm font-normal">
                    {accounts.length} {accounts.length === 1 ? 'conta ativa' : 'contas ativas'}
                  </p>
                </div>
              </CardTitle>
              <Link to={createPageUrl("Accounts")}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-purple-700 text-purple-300 hover:bg-purple-900/30"
                >
                  Gerenciar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {accounts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-900/30 flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-purple-300 text-lg mb-2">Nenhuma carteira cadastrada</p>
                <p className="text-purple-400 text-sm mb-4">Crie sua primeira carteira para começar!</p>
                <Link to={createPageUrl("Accounts")}>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Carteira
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((acc, index) => {
                  const isPositive = acc.balance >= 0;
                  const isImage = isUrlImage(acc.icon);
                  
                  return (
                    <Link key={acc.id} to={createPageUrl("Accounts")}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        className="group relative overflow-hidden cursor-pointer"
                      >
                        {/* Fundo com cor do banco */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                          style={{ background: `linear-gradient(135deg, ${acc.color || '#a855f7'}40, ${acc.color || '#a855f7'}10)` }}
                        />
                        
                        {/* Brilho no hover */}
                        <div 
                          className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"
                          style={{ background: `linear-gradient(90deg, ${acc.color || '#a855f7'}, transparent)` }}
                        />
                        
                        <div className="relative p-5 rounded-xl glass-card border border-purple-700/30 group-hover:border-purple-600/60 transition-all duration-300">
                          {/* Header com logo do banco */}
                          <div className="flex items-center justify-between mb-4">
                            <div 
                              className="w-20 h-20 rounded-2xl flex items-center justify-center p-3 bg-white/95 shadow-2xl relative overflow-hidden group-hover:scale-110 transition-transform duration-300"
                              style={{ 
                                border: `3px solid ${acc.color || '#a855f7'}60`
                              }}
                            >
                              {/* Brilho interno sutil */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                              
                              {isImage ? (
                                <img 
                                  src={acc.icon} 
                                  alt={acc.name}
                                  className="w-full h-full object-contain relative z-10"
                                  onError={(e) => {
                                    if (e.target && e.target.parentElement) {
                                      e.target.parentElement.innerHTML = `<span class="text-4xl relative z-10">🏦</span>`;
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-4xl relative z-10">{acc.icon || '🏦'}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isPositive ? (
                                <div className="p-2 rounded-lg bg-green-600/20">
                                  <TrendingUp className="w-5 h-5 text-green-400" />
                                </div>
                              ) : (
                                <div className="p-2 rounded-lg bg-red-600/20">
                                  <TrendingDown className="w-5 h-5 text-red-400" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Nome da conta */}
                          <h4 className="text-white font-bold text-lg mb-1 truncate group-hover:text-purple-200 transition-colors">
                            {acc.name}
                          </h4>

                          {/* Saldo com destaque */}
                          <div className="mb-3">
                            <p className={`text-3xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              R$ {Math.abs(acc.balance).toFixed(2)}
                            </p>
                            {!isPositive && (
                              <span className="text-red-400 text-xs">saldo negativo</span>
                            )}
                          </div>

                          {/* Barra de status inferior */}
                          <div className="flex items-center justify-between pt-3 border-t border-purple-700/30">
                            <div className="flex items-center gap-2">
                              {isPositive ? (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                  <span className="text-green-400 text-xs font-medium">Saudável</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                  <span className="text-red-400 text-xs font-medium">Atenção</span>
                                </>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
                          </div>

                          {/* Efeito de brilho no canto */}
                          <div 
                            className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity duration-300"
                            style={{ background: `linear-gradient(135deg, ${acc.color || '#a855f7'}, transparent)` }}
                          />
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}

                {/* Card para adicionar nova conta */}
                <Link to={createPageUrl("Accounts")}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: accounts.length * 0.05 }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="group relative overflow-hidden cursor-pointer h-full min-h-[220px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 group-hover:from-purple-600/20 group-hover:to-pink-600/20 transition-all duration-300" />
                    
                    <div className="relative h-full p-5 rounded-xl glass-card border-2 border-dashed border-purple-700/40 group-hover:border-purple-600/70 transition-all duration-300 flex flex-col items-center justify-center gap-4">
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all">
                        <Plus className="w-10 h-10 text-purple-400 group-hover:text-purple-300 transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">Adicionar Carteira</p>
                        <p className="text-purple-400 text-sm">Crie uma nova conta bancária</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                </Link>
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
        <VoiceAssistant onSuccess={loadData} />
      </React.Suspense>
    </div>
  );
}
