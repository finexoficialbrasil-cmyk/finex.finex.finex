import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Wallet,
  TrendingUp,
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ActivityTimeline({ transactions = [], goals = [] }) {
  const getActivityIcon = (type) => {
    const icons = {
      income: ArrowUpRight,
      expense: ArrowDownRight,
      goal: Target,
      account: Wallet,
      achievement: CheckCircle
    };
    return icons[type] || Clock;
  };

  const getActivityColor = (type) => {
    const colors = {
      income: { bg: "bg-green-600/20", icon: "text-green-400", border: "border-green-500/30" },
      expense: { bg: "bg-red-600/20", icon: "text-red-400", border: "border-red-500/30" },
      goal: { bg: "bg-cyan-600/20", icon: "text-cyan-400", border: "border-cyan-500/30" },
      account: { bg: "bg-purple-600/20", icon: "text-purple-400", border: "border-purple-500/30" },
      achievement: { bg: "bg-yellow-600/20", icon: "text-yellow-400", border: "border-yellow-500/30" }
    };
    return colors[type] || colors.account;
  };

  // Combinar e ordenar atividades
  const activities = [
    ...transactions.slice(0, 3).map(t => ({
      type: t.type,
      title: t.description,
      subtitle: `R$ ${t.amount.toFixed(2)}`,
      time: t.created_date,
      badge: t.type === 'income' ? 'Receita' : 'Despesa'
    })),
    ...goals.filter(g => g.status === 'active').slice(0, 2).map(g => ({
      type: 'goal',
      title: g.title,
      subtitle: `${((g.current_amount / g.target_amount) * 100).toFixed(0)}% concluído`,
      time: g.updated_date,
      badge: 'Meta'
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

  if (activities.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card border-0">
      <CardHeader className="border-b border-purple-900/30 p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-white text-base md:text-lg">
          <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-3 md:space-y-4">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colors = getActivityColor(activity.type);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 md:gap-4 group"
              >
                {/* Timeline Line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className={`${colors.bg} ${colors.border} border-2 p-1.5 md:p-2 rounded-lg md:rounded-xl backdrop-blur-sm`}
                  >
                    <Icon className={`w-3 h-3 md:w-4 md:h-4 ${colors.icon}`} />
                  </motion.div>
                  {index < activities.length - 1 && (
                    <div className="w-0.5 h-8 md:h-12 bg-gradient-to-b from-purple-600/50 to-transparent mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2 md:pb-4 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm md:text-base font-semibold group-hover:text-purple-300 transition-colors truncate">
                        {activity.title}
                      </p>
                      <p className="text-purple-400 text-xs md:text-sm mt-0.5 truncate">
                        {activity.subtitle}
                      </p>
                    </div>
                    <Badge className={`${colors.bg} ${colors.icon} border-0 text-[10px] md:text-xs whitespace-nowrap flex-shrink-0`}>
                      {activity.badge}
                    </Badge>
                  </div>
                  <p className="text-[10px] md:text-xs text-purple-500 mt-1 md:mt-2">
                    {format(new Date(activity.time), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}