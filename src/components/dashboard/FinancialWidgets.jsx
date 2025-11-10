import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FinancialWidgets({ transactions = [], bills = [] }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calcular "clima financeiro"
  const getFinancialWeather = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    const ratio = income > 0 ? (balance / income) * 100 : 0;

    if (ratio > 30) {
      return {
        icon: Sun,
        weather: "Ensolarado",
        description: "Suas finanças estão ótimas!",
        color: "text-yellow-400",
        bg: "bg-yellow-600/20"
      };
    } else if (ratio > 10) {
      return {
        icon: Cloud,
        weather: "Nublado",
        description: "Tudo sob controle",
        color: "text-cyan-400",
        bg: "bg-cyan-600/20"
      };
    } else if (ratio > -10) {
      return {
        icon: CloudRain,
        weather: "Chuvoso",
        description: "Atenção aos gastos",
        color: "text-blue-400",
        bg: "bg-blue-600/20"
      };
    } else {
      return {
        icon: CloudSnow,
        weather: "Tempestuoso",
        description: "Hora de economizar!",
        color: "text-purple-400",
        bg: "bg-purple-600/20"
      };
    }
  };

  const weather = getFinancialWeather();
  const WeatherIcon = weather.icon;

  // Gerar mini calendário (próximos 7 dias)
  const calendarDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const getDayActivity = (date) => {
    const dayBills = bills.filter(b => 
      isSameDay(new Date(b.due_date), date) && b.status === 'pending'
    );
    
    if (dayBills.length > 0) {
      const totalAmount = dayBills.reduce((sum, b) => sum + b.amount, 0);
      return {
        hasBills: true,
        count: dayBills.length,
        amount: totalAmount,
        type: dayBills[0].type
      };
    }
    return { hasBills: false };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Clima Financeiro */}
      <Card className={`glass-card border-0 ${weather.bg} relative overflow-hidden`}>
        <CardHeader className="border-b border-purple-900/30 p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-white text-base md:text-lg">
            <Cloud className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            Clima Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <WeatherIcon className={`w-16 h-16 md:w-20 md:h-20 ${weather.color} mb-3 md:mb-4`} />
              </motion.div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                {weather.weather}
              </h3>
              <p className="text-sm md:text-base text-purple-300">
                {weather.description}
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
                {Math.abs(
                  transactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0) -
                  transactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0)
                ).toFixed(0)}
              </div>
              <Badge className={`${weather.bg} text-xs md:text-sm`}>
                Saldo do Mês
              </Badge>
            </div>
          </div>
        </CardContent>

        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 4,
            repeat: Infinity
          }}
          className="absolute -bottom-20 -left-20 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl"
        />
      </Card>

      {/* Mini Calendário Financeiro */}
      <Card className="glass-card border-0">
        <CardHeader className="border-b border-purple-900/30 p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-white text-base md:text-lg">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            Próximos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-1.5 md:space-y-2">
            {calendarDays.map((date, index) => {
              const activity = getDayActivity(date);
              const isToday = isSameDay(date, new Date());
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-2 md:p-3 rounded-lg transition-all ${
                    isToday
                      ? 'bg-purple-600/30 border-2 border-purple-500'
                      : activity.hasBills
                      ? 'bg-red-600/10 border border-red-500/30 hover:bg-red-600/20'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`text-center ${isToday ? 'text-purple-300' : 'text-white'}`}>
                      <div className="text-[10px] md:text-xs font-semibold">
                        {format(date, 'EEE', { locale: ptBR }).toUpperCase()}
                      </div>
                      <div className="text-base md:text-lg font-bold">
                        {format(date, 'd')}
                      </div>
                    </div>
                    
                    {isToday && (
                      <Badge className="bg-purple-600 text-white text-[10px] md:text-xs">
                        Hoje
                      </Badge>
                    )}
                  </div>

                  <div className="text-right">
                    {activity.hasBills ? (
                      <>
                        <div className="text-xs md:text-sm font-semibold text-red-400">
                          R$ {activity.amount.toFixed(2)}
                        </div>
                        <div className="text-[10px] md:text-xs text-purple-400">
                          {activity.count} conta{activity.count > 1 ? 's' : ''}
                        </div>
                      </>
                    ) : (
                      <div className="text-[10px] md:text-xs text-purple-500">
                        Sem contas
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}