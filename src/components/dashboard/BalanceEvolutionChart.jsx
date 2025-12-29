import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BalanceEvolutionChart({ transactions, initialBalance = 0, period = "month" }) {
  const evolutionData = useMemo(() => {
    const now = new Date();
    let startDate, endDate, intervals;
    
    if (period === "month") {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      intervals = eachDayOfInterval({ start: startDate, end: endDate });
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      intervals = eachMonthOfInterval({ start: startDate, end: endDate });
    } else {
      // Last 7 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      endDate = now;
      intervals = eachDayOfInterval({ start: startDate, end: endDate });
    }
    
    const data = intervals.map(date => {
      const dateStr = format(date, period === "year" ? "yyyy-MM" : "yyyy-MM-dd");
      
      const dayTransactions = transactions.filter(t => {
        if (t.status !== "completed") return false;
        const txDate = t.date;
        
        if (period === "year") {
          return txDate.startsWith(dateStr);
        }
        return txDate === dateStr;
      });
      
      const income = dayTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = dayTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        date: period === "year" 
          ? format(date, "MMM", { locale: ptBR })
          : format(date, "dd/MM"),
        receitas: income,
        despesas: expense,
        saldo: income - expense
      };
    });
    
    // Calculate cumulative balance
    let cumulativeBalance = initialBalance;
    data.forEach(item => {
      cumulativeBalance += item.saldo;
      item.saldoAcumulado = cumulativeBalance;
    });
    
    return data;
  }, [transactions, initialBalance, period]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-purple-900/90 backdrop-blur-sm border border-purple-700/50 rounded-lg p-3">
          <p className="text-white font-bold mb-2">{data.date}</p>
          <p className="text-green-400 text-sm">Receitas: R$ {data.receitas.toFixed(2)}</p>
          <p className="text-red-400 text-sm">Despesas: R$ {data.despesas.toFixed(2)}</p>
          <p className="text-purple-300 text-sm">Saldo do dia: R$ {data.saldo.toFixed(2)}</p>
          <p className="text-cyan-400 text-sm font-bold">Saldo acumulado: R$ {data.saldoAcumulado.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card border-0 neon-glow h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Evolucao do Saldo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {evolutionData.every(d => d.saldoAcumulado === initialBalance) ? (
          <div className="text-center py-12 text-purple-300">
            <p>Nenhuma movimentacao no periodo</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#a855f750" />
              <XAxis 
                dataKey="date" 
                stroke="#c4b5fd"
                tick={{ fill: '#c4b5fd', fontSize: 12 }}
              />
              <YAxis 
                stroke="#c4b5fd"
                tick={{ fill: '#c4b5fd', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#c4b5fd' }}
                formatter={(value) => (
                  <span className="text-purple-200">{value}</span>
                )}
              />
              <Area 
                type="monotone" 
                dataKey="saldoAcumulado" 
                stroke="#06b6d4" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSaldo)"
                name="Saldo Acumulado"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}