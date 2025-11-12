import React, { useState, useEffect } from "react";
import { SystemNotification } from "@/entities/SystemNotification";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Info, AlertTriangle, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SystemNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    loadNotifications();
    
    const stored = localStorage.getItem('dismissed_system_notifications');
    if (stored) {
      setDismissedIds(JSON.parse(stored));
    }
  }, []);

  const loadNotifications = async () => {
    try {
      console.log("🔔 Carregando notificações do sistema...");
      
      // ✅ OTIMIZADO: Carregar apenas 5 notificações
      const all = await SystemNotification.list("-created_date", 5);
      console.log("📋 Total de notificações:", all.length);
      
      const now = new Date();
      const active = all.filter(n => {
        if (!n.is_active) return false;
        
        if (n.start_date && new Date(n.start_date) > now) return false;
        if (n.end_date && new Date(n.end_date) < now) return false;
        
        return true;
      });
      
      console.log("📢 Notificações ativas:", active.length);
      setNotifications(active);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  };

  const handleDismiss = (id) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_system_notifications', JSON.stringify(newDismissed));
  };

  const activeNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  if (activeNotifications.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    switch(type) {
      case 'info': return Info;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      default: return Info;
    }
  };

  const getColors = (type, priority) => {
    const baseColors = {
      info: { bg: 'bg-blue-900/20', border: 'border-blue-700/30', text: 'text-blue-300', icon: 'text-blue-400' },
      warning: { bg: 'bg-yellow-900/20', border: 'border-yellow-700/30', text: 'text-yellow-300', icon: 'text-yellow-400' },
      success: { bg: 'bg-green-900/20', border: 'border-green-700/30', text: 'text-green-300', icon: 'text-green-400' },
      error: { bg: 'bg-red-900/20', border: 'border-red-700/30', text: 'text-red-300', icon: 'text-red-400' }
    };
    
    return baseColors[type] || baseColors.info;
  };

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {activeNotifications.map((notif, index) => {
          const Icon = getIcon(notif.type);
          const colors = getColors(notif.type, notif.priority);
          
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`glass-card border-0 border-l-4 ${colors.border.replace('border-', 'border-l-')} ${colors.bg}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-full ${colors.bg}`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-bold ${colors.text}`}>{notif.title}</p>
                          {notif.priority === 'urgent' && (
                            <Badge className="bg-red-600 text-white text-xs">URGENTE</Badge>
                          )}
                        </div>
                        <p className="text-purple-200 text-sm">{notif.message}</p>
                        {notif.link_url && (
                          <a
                            href={notif.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${colors.text} text-sm hover:underline mt-2 inline-flex items-center gap-1`}
                          >
                            Saiba mais
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDismiss(notif.id)}
                      className="text-purple-400 hover:text-white flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
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