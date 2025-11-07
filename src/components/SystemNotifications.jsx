import React, { useState, useEffect } from "react";
import { SystemNotification } from "@/entities/SystemNotification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Info, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const typeIcons = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  error: XCircle
};

const typeColors = {
  info: {
    bg: "from-blue-900/40 to-cyan-900/20",
    border: "border-blue-500/50",
    icon: "text-blue-400",
    text: "text-blue-200"
  },
  warning: {
    bg: "from-yellow-900/40 to-orange-900/20",
    border: "border-yellow-500/50",
    icon: "text-yellow-400",
    text: "text-yellow-200"
  },
  success: {
    bg: "from-green-900/40 to-emerald-900/20",
    border: "border-green-500/50",
    icon: "text-green-400",
    text: "text-green-200"
  },
  error: {
    bg: "from-red-900/40 to-pink-900/20",
    border: "border-red-500/50",
    icon: "text-red-400",
    text: "text-red-200"
  }
};

export default function SystemNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      console.log("🔔 Carregando notificações do sistema...");
      const all = await SystemNotification.list("-created_date");
      console.log("📋 Total de notificações:", all.length);
      
      // Filtrar notificações ativas e dentro do período
      const today = new Date();
      const active = all.filter(n => {
        if (!n.is_active) {
          console.log(`❌ Notificação "${n.title}" está INATIVA`);
          return false;
        }
        
        const startDate = n.start_date ? new Date(n.start_date) : new Date(0);
        const endDate = n.end_date ? new Date(n.end_date) : new Date(9999, 11, 31);
        
        const isInPeriod = today >= startDate && today <= endDate;
        
        if (!isInPeriod) {
          console.log(`⏰ Notificação "${n.title}" fora do período (${n.start_date} até ${n.end_date})`);
        } else {
          console.log(`✅ Notificação ATIVA: "${n.title}"`);
        }
        
        return isInPeriod;
      });

      console.log("📢 Notificações ativas:", active.length);
      
      // Ordenar por prioridade (urgent > high > medium > low)
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      active.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      
      setNotifications(active);
    } catch (error) {
      console.error("❌ Erro ao carregar notificações:", error);
    }
  };

  const handleDismiss = (id) => {
    setDismissedIds([...dismissedIds, id]);
  };

  const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence>
        {visibleNotifications.map((notif, index) => {
          const Icon = typeIcons[notif.type];
          const colors = typeColors[notif.type];
          
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`glass-card border-2 ${colors.border} bg-gradient-to-r ${colors.bg} backdrop-blur-xl`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg} flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white text-lg">{notif.title}</h3>
                            {notif.priority === 'urgent' && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white font-bold animate-pulse">
                                URGENTE
                              </span>
                            )}
                            {notif.priority === 'high' && (
                              <span className="text-xs px-2 py-1 rounded-full bg-orange-600 text-white">
                                Alta
                              </span>
                            )}
                          </div>
                          <p className={`${colors.text} text-sm leading-relaxed`}>
                            {notif.message}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDismiss(notif.id)}
                          className="h-8 w-8 text-gray-400 hover:text-white flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {notif.link_url && (
                        <a
                          href={notif.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors mt-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Saiba mais
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}