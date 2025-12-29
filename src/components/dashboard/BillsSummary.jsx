import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle, Calendar, AlertCircle } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BillsSummary({ bills, categories }) {
  const billsData = useMemo(() => {
    const payables = bills.filter(b => b.type === "payable" && b.status === "pending");
    const receivables = bills.filter(b => b.type === "receivable" && b.status === "pending");
    
    const totalPayable = payables.reduce((sum, b) => sum + b.amount, 0);
    const totalReceivable = receivables.reduce((sum, b) => sum + b.amount, 0);
    
    const today = new Date();
    const urgentPayables = payables.filter(b => {
      const daysUntil = differenceInDays(new Date(b.due_date), today);
      return daysUntil <= 3 && daysUntil >= 0;
    });
    
    const overduePayables = payables.filter(b => 
      differenceInDays(new Date(b.due_date), today) < 0
    );
    
    const urgentReceivables = receivables.filter(b => {
      const daysUntil = differenceInDays(new Date(b.due_date), today);
      return daysUntil <= 3 && daysUntil >= 0;
    });
    
    return {
      payables: {
        total: totalPayable,
        count: payables.length,
        urgent: urgentPayables.length,
        overdue: overduePayables.length,
        items: payables.slice(0, 3)
      },
      receivables: {
        total: totalReceivable,
        count: receivables.length,
        urgent: urgentReceivables.length,
        items: receivables.slice(0, 3)
      }
    };
  }, [bills]);

  const getDaysUntilDue = (dueDate) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    return days;
  };

  const getStatusBadge = (bill) => {
    const days = getDaysUntilDue(bill.due_date);
    
    if (days < 0) {
      return <Badge className="bg-red-600/20 text-red-400 border-red-600/40 text-xs">Vencido</Badge>;
    }
    if (days === 0) {
      return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/40 text-xs">Vence hoje</Badge>;
    }
    if (days <= 3) {
      return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/40 text-xs">{days}d</Badge>;
    }
    return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/40 text-xs">{days}d</Badge>;
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || { name: "Sem categoria", color: "#666" };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contas a Pagar */}
      <Card className="glass-card border-0 neon-glow border-l-4 border-red-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="p-2 rounded-lg bg-red-600/20">
                <ArrowDownCircle className="w-5 h-5 text-red-400" />
              </div>
              Contas a Pagar
            </CardTitle>
            <Link to={createPageUrl("Payables")}>
              <Badge className="bg-red-600/20 text-red-400 border-red-600/40 cursor-pointer hover:bg-red-600/30">
                Ver Todas
              </Badge>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-700/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-red-300 text-sm font-semibold">Total Pendente</p>
              {billsData.payables.overdue > 0 && (
                <Badge className="bg-red-600 text-white text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {billsData.payables.overdue} vencida(s)
                </Badge>
              )}
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              R$ {billsData.payables.total.toFixed(2)}
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-red-400">{billsData.payables.count} conta(s)</span>
              {billsData.payables.urgent > 0 && (
                <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/40 text-xs">
                  {billsData.payables.urgent} urgente(s)
                </Badge>
              )}
            </div>
          </div>

          {/* Lista de Contas */}
          {billsData.payables.items.length > 0 ? (
            <div className="space-y-2">
              <p className="text-purple-300 text-xs font-semibold">Próximas Contas:</p>
              {billsData.payables.items.map(bill => {
                const category = getCategoryInfo(bill.category_id);
                return (
                  <div key={bill.id} className="p-3 rounded-lg bg-purple-900/20 border border-purple-700/30 hover:bg-purple-900/30 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{bill.description}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            className="text-xs"
                            style={{
                              backgroundColor: category.color + '20',
                              color: category.color,
                              borderColor: category.color + '40'
                            }}
                          >
                            {category.name}
                          </Badge>
                          {getStatusBadge(bill)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-red-400 font-bold text-sm">R$ {bill.amount.toFixed(2)}</p>
                        <p className="text-purple-400 text-xs flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          {new Date(bill.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-purple-300 text-sm">
              <p>Nenhuma conta a pagar pendente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contas a Receber */}
      <Card className="glass-card border-0 neon-glow border-l-4 border-green-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="p-2 rounded-lg bg-green-600/20">
                <ArrowUpCircle className="w-5 h-5 text-green-400" />
              </div>
              Contas a Receber
            </CardTitle>
            <Link to={createPageUrl("Receivables")}>
              <Badge className="bg-green-600/20 text-green-400 border-green-600/40 cursor-pointer hover:bg-green-600/30">
                Ver Todas
              </Badge>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/30">
            <p className="text-green-300 text-sm font-semibold mb-2">Previsão de Entrada</p>
            <p className="text-3xl font-bold text-white mb-1">
              R$ {billsData.receivables.total.toFixed(2)}
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-400">{billsData.receivables.count} conta(s)</span>
              {billsData.receivables.urgent > 0 && (
                <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/40 text-xs">
                  {billsData.receivables.urgent} próxima(s)
                </Badge>
              )}
            </div>
          </div>

          {/* Lista de Contas */}
          {billsData.receivables.items.length > 0 ? (
            <div className="space-y-2">
              <p className="text-purple-300 text-xs font-semibold">Próximos Recebimentos:</p>
              {billsData.receivables.items.map(bill => {
                const category = getCategoryInfo(bill.category_id);
                return (
                  <div key={bill.id} className="p-3 rounded-lg bg-purple-900/20 border border-purple-700/30 hover:bg-purple-900/30 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{bill.description}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            className="text-xs"
                            style={{
                              backgroundColor: category.color + '20',
                              color: category.color,
                              borderColor: category.color + '40'
                            }}
                          >
                            {category.name}
                          </Badge>
                          {getStatusBadge(bill)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-green-400 font-bold text-sm">R$ {bill.amount.toFixed(2)}</p>
                        <p className="text-purple-400 text-xs flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          {new Date(bill.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-purple-300 text-sm">
              <p>Nenhuma conta a receber pendente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}