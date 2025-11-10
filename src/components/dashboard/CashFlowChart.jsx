import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function CashFlowChart({ transactions = [] }) {
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      
      const monthTxs = transactions.filter(t => {
        if (!t.date) return false;
        const txDate = new Date(t.date);
        return txDate.getMonth() === date.getMonth() && 
               txDate.getFullYear() === date.getFullYear() &&
               t.status === "completed";
      });

      const income = monthTxs
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTxs
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({ 
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1), 
        Receitas: income, 
        Despesas: expense,
        Saldo: income - expense
      });
    }
    
    return months;
  }, [transactions]);

  // Calcular totais
  const totals = useMemo(() => {
    const totalIncome = monthlyData.reduce((sum, m) => sum + m.Receitas, 0);
    const totalExpense = monthlyData.reduce((sum, m) => sum + m.Despesas, 0);
    return {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [monthlyData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card border border-purple-700/50 p-3 rounded-lg">
          <p className="text-white font-bold mb-2">{payload[0].payload.month}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-purple-200">{entry.name}:</span>
              </span>
              <span className="font-bold" style={{ color: entry.color }}>
                R$ {entry.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card border-0 neon-glow">
      <CardHeader className="border-b border-purple-900/30 p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-white text-base md:text-lg">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
            Fluxo de Caixa
          </CardTitle>
          
          {/* Mini Stats */}
          <div className="flex gap-3 flex-wrap">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1.5 rounded-lg bg-green-600/20 border border-green-500/30"
            >
              <p className="text-[10px] md:text-xs text-green-400">Receitas</p>
              <p className="text-sm md:text-base font-bold text-green-300">
                R$ {totals.income.toFixed(2)}
              </p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30"
            >
              <p className="text-[10px] md:text-xs text-red-400">Despesas</p>
              <p className="text-sm md:text-base font-bold text-red-300">
                R$ {totals.expense.toFixed(2)}
              </p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`px-3 py-1.5 rounded-lg ${
                totals.balance >= 0 
                  ? 'bg-cyan-600/20 border border-cyan-500/30' 
                  : 'bg-orange-600/20 border border-orange-500/30'
              }`}
            >
              <p className="text-[10px] md:text-xs text-cyan-400">Saldo</p>
              <p className={`text-sm md:text-base font-bold ${
                totals.balance >= 0 ? 'text-cyan-300' : 'text-orange-300'
              }`}>
                R$ {totals.balance.toFixed(2)}
              </p>
            </motion.div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6">
        {monthlyData.every(m => m.Receitas === 0 && m.Despesas === 0) ? (
          <div className="flex flex-col items-center justify-center h-64 md:h-80">
            <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-purple-400/30 mb-4" />
            <p className="text-purple-400 text-sm md:text-base mb-2">Sem dados de fluxo de caixa</p>
            <p className="text-purple-500 text-xs md:text-sm text-center max-w-xs">
              Adicione transações para visualizar seu fluxo de caixa
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300} className="md:h-80">
            <AreaChart 
              data={monthlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#4b5563" 
                strokeOpacity={0.3}
                vertical={false}
              />
              
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '12px'
                }}
                iconType="circle"
              />
              
              <Area
                type="monotone"
                dataKey="Receitas"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReceitas)"
              />
              
              <Area
                type="monotone"
                dataKey="Despesas"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDespesas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}