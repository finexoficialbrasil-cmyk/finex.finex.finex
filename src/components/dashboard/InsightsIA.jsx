import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Target,
  PiggyBank,
  ArrowRight,
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function InsightsIA({ transactions = [], accounts = [], goals = [] }) {
  const [currentInsight, setCurrentInsight] = useState(0);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    generateInsights();
  }, [transactions, accounts, goals]);

  const generateInsights = () => {
    const newInsights = [];

    // Análise de gastos
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    if (totalExpenses > totalIncome * 0.8) {
      newInsights.push({
        icon: AlertCircle,
        type: "warning",
        title: "Gastos Elevados!",
        description: `Você gastou ${((totalExpenses / totalIncome) * 100).toFixed(0)}% da sua receita este mês.`,
        suggestion: "Considere revisar suas despesas não essenciais.",
        color: "from-orange-600 to-red-600",
        bgColor: "bg-orange-600/10"
      });
    }

    // Análise de economia
    const savings = totalIncome - totalExpenses;
    if (savings > 0) {
      newInsights.push({
        icon: PiggyBank,
        type: "success",
        title: "Parabéns! Você economizou",
        description: `R$ ${savings.toFixed(2)} este mês`,
        suggestion: "Continue assim! Considere investir essa quantia.",
        color: "from-green-600 to-emerald-600",
        bgColor: "bg-green-600/10"
      });
    }

    // Análise de metas
    const activeGoals = goals.filter(g => g.status === 'active');
    if (activeGoals.length > 0) {
      const avgProgress = activeGoals.reduce((sum, g) => 
        sum + ((g.current_amount / g.target_amount) * 100), 0) / activeGoals.length;
      
      newInsights.push({
        icon: Target,
        type: "info",
        title: "Progresso nas Metas",
        description: `Você está ${avgProgress.toFixed(0)}% próximo de alcançar suas metas!`,
        suggestion: "Continue focado e você chegará lá em breve.",
        color: "from-cyan-600 to-blue-600",
        bgColor: "bg-cyan-600/10"
      });
    }

    // Análise de contas
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    if (totalBalance < 0) {
      newInsights.push({
        icon: AlertCircle,
        type: "alert",
        title: "Atenção ao Saldo",
        description: "Algumas contas estão no negativo.",
        suggestion: "Priorize equilibrar suas finanças.",
        color: "from-red-600 to-pink-600",
        bgColor: "bg-red-600/10"
      });
    }

    // Insight motivacional
    if (newInsights.length === 0 || Math.random() > 0.5) {
      newInsights.push({
        icon: Sparkles,
        type: "tip",
        title: "Dica do Dia",
        description: "A consistência é a chave para o sucesso financeiro!",
        suggestion: "Pequenas ações diárias levam a grandes resultados.",
        color: "from-purple-600 to-pink-600",
        bgColor: "bg-purple-600/10"
      });
    }

    setInsights(newInsights);
  };

  const nextInsight = () => {
    setCurrentInsight((prev) => (prev + 1) % insights.length);
  };

  if (insights.length === 0) {
    return null;
  }

  const insight = insights[currentInsight];
  const Icon = insight.icon;

  return (
    <Card className={`glass-card border-0 ${insight.bgColor} relative overflow-hidden`}>
      <CardHeader className="border-b border-purple-900/30 pb-3 md:pb-4 p-4 md:p-6">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            <span className="text-base md:text-lg">Insights IA</span>
          </div>
          <Button
            onClick={nextInsight}
            variant="ghost"
            size="sm"
            className="text-purple-300 hover:text-white h-8 w-8 md:h-auto md:w-auto p-1 md:p-2"
          >
            <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentInsight}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br ${insight.color} shadow-lg flex-shrink-0`}
              >
                <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">
                  {insight.title}
                </h3>
                <p className="text-sm md:text-base text-purple-200 mb-2 md:mb-3">
                  {insight.description}
                </p>
                <div className="flex items-start gap-2 p-2 md:p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                  <Lightbulb className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs md:text-sm text-purple-300">
                    {insight.suggestion}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex justify-center gap-1.5 md:gap-2 mt-4 md:mt-6">
              {insights.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-1 md:h-1.5 rounded-full transition-all cursor-pointer ${
                    index === currentInsight
                      ? 'w-6 md:w-8 bg-purple-400'
                      : 'w-1 md:w-1.5 bg-purple-800'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setCurrentInsight(index)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>

      {/* Decorative Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity
        }}
        className="absolute -bottom-10 -right-10 w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl"
      />
    </Card>
  );
}