import React, { useState, useEffect } from "react";
import { Bill } from "@/entities/Bill";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInDays } from "date-fns";

export default function ReceivablesNotification() {
  const [receivables, setReceivables] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    loadReceivables();
    
    // ✅ Recarregar menos frequentemente (a cada 5 minutos)
    const interval = setInterval(loadReceivables, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadReceivables = async () => {
    try {
      // ✅ OTIMIZADO: Carregar apenas 5 contas a receber
      const bills = await Bill.filter({ type: "receivable", status: "pending" }, "-due_date", 5);
      
      const today = new Date();
      const upcoming = bills.filter(b => {
        const daysUntil = differenceInDays(new Date(b.due_date), today);
        return daysUntil >= 0 && daysUntil <= 7;
      });
      
      setReceivables(upcoming);
      
      const stored = localStorage.getItem('dismissed_receivables');
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar recebíveis:", error);
    }
  };

  const handleDismiss = (id) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_receivables', JSON.stringify(newDismissed));
  };

  const getDaysUntilColor = (daysUntil) => {
    if (daysUntil === 0) return 'text-red-400';
    if (daysUntil <= 2) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getDaysUntilText = (daysUntil) => {
    if (daysUntil === 0) return 'Vence hoje!';
    if (daysUntil === 1) return '1 dia';
    return `${daysUntil} dias`;
  };

  const activeReceivables = receivables.filter(r => !dismissedIds.includes(r.id));

  if (activeReceivables.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence>
        {activeReceivables.map((bill, index) => {
          const daysUntil = differenceInDays(new Date(bill.due_date), new Date());
          
          return (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card border-0 border-l-4 border-green-500 bg-green-900/10">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-full bg-green-600/20">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white mb-1">{bill.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="text-green-300 font-bold">
                            R$ {bill.amount.toFixed(2)}
                          </span>
                          <span className="text-purple-400">•</span>
                          <span className={getDaysUntilColor(daysUntil)}>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {getDaysUntilText(daysUntil)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link to={createPageUrl("Receivables")}>
                        <Button size="sm" variant="outline" className="border-green-700 text-green-300">
                          Ver Todas
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDismiss(bill.id)}
                        className="text-purple-400 hover:text-white h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
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