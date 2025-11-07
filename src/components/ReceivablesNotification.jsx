import React, { useState, useEffect } from "react";
import { Bill } from "@/entities/Bill";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, Calendar, X, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function ReceivablesNotification() {
  const [receivables, setReceivables] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    loadReceivables();
    
    const interval = setInterval(loadReceivables, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadReceivables = async () => {
    try {
      const today = new Date();
      const in7Days = new Date();
      in7Days.setDate(today.getDate() + 7);

      const allReceivables = await Bill.filter({ type: "receivable" }, "-due_date");
      
      const upcomingReceivables = allReceivables.filter(bill => {
        if (bill.status !== "pending") return false;
        
        const dueDate = new Date(bill.due_date);
        return dueDate >= today && dueDate <= in7Days;
      });

      setReceivables(upcomingReceivables);
    } catch (error) {
      console.error("Erro ao carregar contas a receber:", error);
    }
  };

  const handleDismiss = (billId) => {
    setDismissed([...dismissed, billId]);
    localStorage.setItem(`receivable_dismissed_${billId}`, 'true');
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateColor = (daysUntil) => {
    if (daysUntil === 0) return "from-orange-600 to-red-600";
    if (daysUntil <= 2) return "from-yellow-600 to-orange-600";
    return "from-green-600 to-emerald-600";
  };

  const getDueDateText = (daysUntil) => {
    if (daysUntil === 0) return "Hoje";
    if (daysUntil === 1) return "Amanhã";
    return `${daysUntil}d`;
  };

  const activeReceivables = receivables.filter(bill => {
    const isDismissed = dismissed.includes(bill.id) || 
                       localStorage.getItem(`receivable_dismissed_${bill.id}`);
    return !isDismissed;
  });

  if (activeReceivables.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {activeReceivables.map((bill, index) => {
          const daysUntil = getDaysUntilDue(bill.due_date);
          const gradient = getDueDateColor(daysUntil);
          const dueDateText = getDueDateText(daysUntil);

          return (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`border-l-4 ${
                daysUntil === 0 ? "border-red-500 bg-red-900/10" :
                daysUntil <= 2 ? "border-yellow-500 bg-yellow-900/10" :
                "border-green-500 bg-green-900/10"
              } glass-card`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full bg-gradient-to-br ${gradient}`}>
                        <ArrowUpCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{bill.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-purple-300">
                            R$ {bill.amount.toFixed(2)}
                          </p>
                          <Badge className={`${
                            daysUntil === 0 ? "bg-red-600/20 text-red-400 border-red-600/40" :
                            daysUntil <= 2 ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/40" :
                            "bg-green-600/20 text-green-400 border-green-600/40"
                          }`}>
                            <Calendar className="w-3 h-3 mr-1" />
                            Vence: {dueDateText}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={createPageUrl("Receivables")}>
                        <Button variant="outline" size="sm" className="border-purple-700 text-purple-300 hover:bg-purple-900/20">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDismiss(bill.id)}
                        className="text-gray-400 hover:bg-gray-900/20"
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