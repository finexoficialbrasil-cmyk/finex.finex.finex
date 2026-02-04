import React, { useState, useEffect } from "react";
import { Transaction } from "@/entities/Transaction";
import { Category } from "@/entities/Category";
import { Account } from "@/entities/Account";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Sparkles, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import SubscriptionGuard from "../components/SubscriptionGuard";
import FeatureGuard from "../components/FeatureGuard";

const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [period, setPeriod] = useState("month");
  const [aiInsights, setAiInsights] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [txs, cats, accs] = await Promise.all([
      Transaction.list("-created_date"), // ✅ ORDEM DE CHEGADA
      Category.list(),
      Account.list()
    ]);
    console.log(`📊 Relatórios carregou ${txs.length} transações (ordem: CHEGADA)`);
    setTransactions(txs);
    setCategories(cats);
    setAccounts(accs);
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate = new Date();
    
    if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === "quarter") {
      startDate.setMonth(now.getMonth() - 3);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  };

  const getCategoryBreakdown = () => {
    const filtered = getFilteredTransactions();
    const breakdown = {};

    filtered.forEach(tx => {
      if (tx.type === "expense" && tx.status === "completed") {
        const category = categories.find(c => c.id === tx.category_id);
        const categoryName = category?.name || "Sem categoria";
        breakdown[categoryName] = (breakdown[categoryName] || 0) + tx.amount;
      }
    });

    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getMonthlyComparison = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthTxs = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === date.getMonth() && 
               txDate.getFullYear() === date.getFullYear();
      });

      const income = monthTxs
        .filter(t => t.type === "income" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTxs
        .filter(t => t.type === "expense" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({ month: monthName, receitas: income, despesas: expense });
    }
    
    return months;
  };

  const generateAIInsights = async () => {
    setIsLoadingAI(true);
    try {
      const filtered = getFilteredTransactions();
      const totalIncome = filtered
        .filter(t => t.type === "income" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = filtered
        .filter(t => t.type === "expense" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

      const categoryBreakdown = getCategoryBreakdown();

      const prompt = `Você é um consultor financeiro especializado. Analise os seguintes dados financeiros do período de ${period === 'month' ? '1 mês' : period === 'quarter' ? '3 meses' : '1 ano'}:

Receita Total: R$ ${totalIncome.toFixed(2)}
Despesa Total: R$ ${totalExpense.toFixed(2)}
Saldo: R$ ${(totalIncome - totalExpense).toFixed(2)}

Categorias de despesas:
${categoryBreakdown.map(c => `- ${c.name}: R$ ${c.value.toFixed(2)}`).join('\n')}

Forneça insights valiosos em português do Brasil:
1. Uma análise geral da saúde financeira (2-3 frases)
2. Principais pontos de atenção (2-3 itens)
3. Recomendações práticas para melhorar a gestão financeira (3-4 itens)

Seja direto, prático e motivador.`;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            analise_geral: { type: "string" },
            pontos_atencao: { type: "array", items: { type: "string" } },
            recomendacoes: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAiInsights(response);
    } catch (error) {
      console.error("Erro ao gerar insights:", error);
    }
    setIsLoadingAI(false);
  };

  const categoryData = getCategoryBreakdown();
  const monthlyData = getMonthlyComparison();

  return (
    <FeatureGuard pageName="Reports">
      <SubscriptionGuard requireActive={true}>
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Relatórios & Insights
                </h1>
                <p className="text-purple-300 mt-1">Análise inteligente das suas finanças</p>
              </div>
              <Tabs value={period} onValueChange={setPeriod}>
                <TabsList className="bg-purple-900/20">
                  <TabsTrigger value="month">1 Mês</TabsTrigger>
                  <TabsTrigger value="quarter">3 Meses</TabsTrigger>
                  <TabsTrigger value="year">1 Ano</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Card className="glass-card border-0 neon-glow">
              <CardHeader className="border-b border-purple-900/30">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Insights com IA
                  </CardTitle>
                  <Button
                    onClick={generateAIInsights}
                    disabled={isLoadingAI}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isLoadingAI ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Insights
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {aiInsights ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Análise Geral
                      </h3>
                      <p className="text-purple-200 leading-relaxed">{aiInsights.analise_geral}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        Pontos de Atenção
                      </h3>
                      <ul className="space-y-2">
                        {aiInsights.pontos_atencao.map((ponto, i) => (
                          <li key={i} className="flex items-start gap-3 text-purple-200">
                            <span className="text-yellow-400 mt-1">•</span>
                            {ponto}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        Recomendações
                      </h3>
                      <ul className="space-y-2">
                        {aiInsights.recomendacoes.map((rec, i) => (
                          <li key={i} className="flex items-start gap-3 text-purple-200">
                            <span className="text-cyan-400 mt-1">✓</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-12 text-purple-300">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    <p>Clique em "Gerar Insights" para obter uma análise detalhada</p>
                    <p className="text-sm mt-2">Nossa IA analisará seus dados e fornecerá recomendações personalizadas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass-card border-0 neon-glow">
                <CardHeader className="border-b border-purple-900/30">
                  <CardTitle className="text-white">Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a1a2e',
                            border: '1px solid #a855f7',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-purple-300">
                      Nenhum dado para exibir
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border-0 neon-glow">
                <CardHeader className="border-b border-purple-900/30">
                  <CardTitle className="text-white">Comparação Mensal</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a2e',
                          border: '1px solid #a855f7',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                      <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SubscriptionGuard>
    </FeatureGuard>
  );
}