
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

export default function CashFlowChart({ transactions }) {
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthTxs = transactions.filter(t => {
        const txDate = t.date ? new Date(t.date) : null;
        return txDate && txDate.getMonth() === date.getMonth() && 
               txDate.getFullYear() === date.getFullYear();
      });

      const income = monthTxs
        .filter(t => t.type === "income" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTxs
        .filter(t => t.type === "expense" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({ 
        month: monthName, 
        receitas: income, 
        despesas: expense,
        saldo: income - expense
      });
    }
    
    return months;
  }, [transactions]);

  return (
    <Card className="glass-card border-0 neon-glow">
      <CardHeader className="border-b border-purple-900/30">
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Fluxo de Caixa
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="receitas"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorReceitas)"
              name="Receitas"
            />
            <Area
              type="monotone"
              dataKey="despesas"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorDespesas)"
              name="Despesas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
