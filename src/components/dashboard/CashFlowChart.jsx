import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ComposedChart, Line
} from "recharts";
import { TrendingUp, TrendingDown, Calendar, BarChart3, LineChart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

// Formata número para moeda brasileira
const formatCurrencyBR = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const PERIODS = [
  { key: 'week', label: 'Semana', icon: Calendar },
  { key: 'month', label: 'Mês', icon: Calendar },
  { key: 'quarter', label: 'Trimestre', icon: Calendar },
  { key: 'year', label: 'Ano', icon: Calendar },
];

const CHART_TYPES = [
  { key: 'area', label: 'Área', icon: LineChart },
  { key: 'bar', label: 'Barras', icon: BarChart3 },
];

export default function CashFlowChart({ transactions }) {
  const [period, setPeriod] = useState('month');
  const [chartType, setChartType] = useState('area');

  const chartData = useMemo(() => {
    const now = new Date();
    let data = [];

    if (period === 'week') {
      // Últimos 7 dias
      const days = eachDayOfInterval({
        start: subDays(now, 6),
        end: now
      });

      data = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTxs = transactions.filter(t => t.date === dayStr && t.status === 'completed');
        
        const income = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        return {
          label: format(day, 'EEE', { locale: ptBR }),
          fullLabel: format(day, 'dd/MM', { locale: ptBR }),
          receitas: income,
          despesas: expense,
          saldo: income - expense
        };
      });
    } else if (period === 'month') {
      // Últimas 4 semanas
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subDays(now, i * 7), { locale: ptBR });
        const weekEnd = endOfWeek(subDays(now, i * 7), { locale: ptBR });
        weeks.push({ start: weekStart, end: weekEnd });
      }

      data = weeks.map((week, index) => {
        const weekTxs = transactions.filter(t => {
          if (!t.date || t.status !== 'completed') return false;
          const txDate = new Date(t.date);
          return txDate >= week.start && txDate <= week.end;
        });

        const income = weekTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = weekTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        return {
          label: `Sem ${index + 1}`,
          fullLabel: `${format(week.start, 'dd/MM')} - ${format(week.end, 'dd/MM')}`,
          receitas: income,
          despesas: expense,
          saldo: income - expense
        };
      });
    } else if (period === 'quarter') {
      // Últimos 3 meses
      for (let i = 2; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthTxs = transactions.filter(t => {
          if (!t.date || t.status !== 'completed') return false;
          const txDate = new Date(t.date);
          return txDate >= monthStart && txDate <= monthEnd;
        });

        const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        data.push({
          label: format(monthDate, 'MMM', { locale: ptBR }),
          fullLabel: format(monthDate, 'MMMM yyyy', { locale: ptBR }),
          receitas: income,
          despesas: expense,
          saldo: income - expense
        });
      }
    } else if (period === 'year') {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthTxs = transactions.filter(t => {
          if (!t.date || t.status !== 'completed') return false;
          const txDate = new Date(t.date);
          return txDate >= monthStart && txDate <= monthEnd;
        });

        const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        data.push({
          label: format(monthDate, 'MMM', { locale: ptBR }),
          fullLabel: format(monthDate, 'MMMM yyyy', { locale: ptBR }),
          receitas: income,
          despesas: expense,
          saldo: income - expense
        });
      }
    }

    return data;
  }, [transactions, period]);

  // Estatísticas do período
  const stats = useMemo(() => {
    const totalReceitas = chartData.reduce((sum, d) => sum + d.receitas, 0);
    const totalDespesas = chartData.reduce((sum, d) => sum + d.despesas, 0);
    const saldo = totalReceitas - totalDespesas;
    const mediaReceitas = totalReceitas / (chartData.length || 1);
    const mediaDespesas = totalDespesas / (chartData.length || 1);

    return { totalReceitas, totalDespesas, saldo, mediaReceitas, mediaDespesas };
  }, [chartData]);

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    
    return (
      <div className="bg-[#1a1a2e] border border-purple-700/50 rounded-xl p-4 shadow-xl">
        <p className="text-purple-300 font-medium mb-2">{data?.fullLabel || label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-green-400">Receitas: {formatCurrencyBR(data?.receitas)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-red-400">Despesas: {formatCurrencyBR(data?.despesas)}</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-purple-700/30">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className={data?.saldo >= 0 ? 'text-cyan-400' : 'text-orange-400'}>
              Saldo: {formatCurrencyBR(data?.saldo)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="glass-card border-0 neon-glow">
      <CardHeader className="border-b border-purple-900/30 pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Fluxo de Caixa
            </CardTitle>
            
            {/* Tipo de Gráfico */}
            <div className="flex gap-1 bg-purple-900/30 rounded-lg p-1">
              {CHART_TYPES.map(type => (
                <Button
                  key={type.key}
                  size="sm"
                  variant={chartType === type.key ? "default" : "ghost"}
                  onClick={() => setChartType(type.key)}
                  className={`h-8 px-3 ${chartType === type.key ? 'bg-purple-600' : 'text-purple-300 hover:text-white'}`}
                >
                  <type.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Filtros de Período */}
          <div className="flex flex-wrap gap-2">
            {PERIODS.map(p => (
              <Button
                key={p.key}
                size="sm"
                variant={period === p.key ? "default" : "outline"}
                onClick={() => setPeriod(p.key)}
                className={`h-8 ${period === p.key 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-0' 
                  : 'border-purple-700/50 text-purple-300 hover:bg-purple-900/30'}`}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-900/20 border border-green-700/30 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-xs">Total Receitas</span>
            </div>
            <p className="text-green-400 font-bold text-lg">{formatCurrencyBR(stats.totalReceitas)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-900/20 border border-red-700/30 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-xs">Total Despesas</span>
            </div>
            <p className="text-red-400 font-bold text-lg">{formatCurrencyBR(stats.totalDespesas)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`border rounded-xl p-3 ${stats.saldo >= 0 ? 'bg-cyan-900/20 border-cyan-700/30' : 'bg-orange-900/20 border-orange-700/30'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className={`w-4 h-4 ${stats.saldo >= 0 ? 'text-cyan-400' : 'text-orange-400'}`} />
              <span className={`text-xs ${stats.saldo >= 0 ? 'text-cyan-300' : 'text-orange-300'}`}>Saldo</span>
            </div>
            <p className={`font-bold text-lg ${stats.saldo >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
              {formatCurrencyBR(stats.saldo)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-purple-900/20 border border-purple-700/30 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-xs">Média Receitas</span>
            </div>
            <p className="text-purple-400 font-bold text-lg">{formatCurrencyBR(stats.mediaReceitas)}</p>
          </motion.div>
        </div>

        {/* Gráfico */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${period}-${chartType}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'area' ? (
                <ComposedChart data={chartData}>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#9ca3af" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="receitas"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReceitas)"
                    name="Receitas"
                  />
                  <Area
                    type="monotone"
                    dataKey="despesas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDespesas)"
                    name="Despesas"
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', strokeWidth: 2 }}
                    name="Saldo"
                  />
                </ComposedChart>
              ) : (
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#9ca3af" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="receitas" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    name="Receitas"
                  />
                  <Bar 
                    dataKey="despesas" 
                    fill="#ef4444" 
                    radius={[4, 4, 0, 0]}
                    name="Despesas"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>

        {/* Legenda */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-purple-300 text-sm">Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-purple-300 text-sm">Despesas</span>
          </div>
          {chartType === 'area' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-purple-300 text-sm">Saldo</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}