import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle, Calendar } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const formatCurrencyBR = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function BillsSummary({ bills, categories }) {
  const billsData = useMemo(() => {
    const payables = bills.filter(b => b.type === "payable" && b.status === "pending");
    const receivables = bills.filter(b => b.type === "receivable" && b.status === "pending");
    
    const totalPayable = payables.reduce((sum, b) => sum + b.amount, 0);
    const totalReceivable = receivables.reduce((sum, b) => sum + b.amount, 0);
    
    // Data de hoje sem conversão de timezone
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`; // YYYY-MM-DD no horário local
    
    // Contas que vencem HOJE
    const todayPayables = payables.filter(b => b.due_date === todayStr);
    const todayReceivables = receivables.filter(b => b.due_date === todayStr);
    
    const todayPayableTotal = todayPayables.reduce((sum, b) => sum + b.amount, 0);
    const todayReceivableTotal = todayReceivables.reduce((sum, b) => sum + b.amount, 0);
    
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const urgentPayables = payables.filter(b => {
      const [year, month, day] = b.due_date.split('-').map(Number);
      const billDate = new Date(year, month - 1, day);
      const daysUntil = differenceInDays(billDate, todayLocal);
      return daysUntil <= 3 && daysUntil >= 0;
    });
    
    const overduePayables = payables.filter(b => {
      const [year, month, day] = b.due_date.split('-').map(Number);
      const billDate = new Date(year, month - 1, day);
      return differenceInDays(billDate, todayLocal) < 0;
    });
    
    const urgentReceivables = receivables.filter(b => {
      const [year, month, day] = b.due_date.split('-').map(Number);
      const billDate = new Date(year, month - 1, day);
      const daysUntil = differenceInDays(billDate, todayLocal);
      return daysUntil <= 3 && daysUntil >= 0;
    });
    
    return {
      payables: {
        total: totalPayable,
        count: payables.length,
        urgent: urgentPayables.length,
        overdue: overduePayables.length,
        items: payables.slice(0, 3),
        today: todayPayables.length,
        todayTotal: todayPayableTotal
      },
      receivables: {
        total: totalReceivable,
        count: receivables.length,
        urgent: urgentReceivables.length,
        items: receivables.slice(0, 3),
        today: todayReceivables.length,
        todayTotal: todayReceivableTotal
      }
    };
  }, [bills]);

  const getDaysUntilDue = (dueDate) => {
    const [year, month, day] = dueDate.split('-').map(Number);
    const billDate = new Date(year, month - 1, day);
    
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const days = differenceInDays(billDate, todayLocal);
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
          {/* Contas a Pagar HOJE */}
          <div className={`relative p-6 rounded-2xl overflow-hidden transition-all duration-300 ${
            billsData.payables.today > 0 
              ? 'bg-gradient-to-br from-red-500/20 via-orange-500/20 to-yellow-500/20 border-2 border-red-500/40 shadow-xl shadow-red-500/10' 
              : 'bg-gradient-to-br from-gray-800/30 to-slate-800/30 border-2 border-gray-700/30 shadow-lg'
          }`}>
            {/* Efeito de brilho de fundo */}
            {billsData.payables.today > 0 && (
              <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 via-transparent to-yellow-600/10 animate-pulse"></div>
            )}
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  billsData.payables.today > 0 
                    ? 'bg-red-500/20 border border-red-500/30' 
                    : 'bg-gray-700/30 border border-gray-600/30'
                }`}>
                  <Calendar className={`w-4 h-4 ${billsData.payables.today > 0 ? 'text-red-300' : 'text-gray-400'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    billsData.payables.today > 0 ? 'text-red-200' : 'text-gray-400'
                  }`}>
                    📅 CONTAS A PAGAR HOJE
                  </span>
                </div>
              </div>
              
              <p className={`text-sm font-semibold mb-4 ${
                billsData.payables.today > 0 ? 'text-orange-300' : 'text-gray-500'
              }`}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
              
              <div className="flex items-end justify-between">
                <p className={`text-4xl font-black tracking-tight ${
                  billsData.payables.today > 0 ? 'text-white' : 'text-gray-400'
                }`}>
                  R$ {formatCurrencyBR(billsData.payables.todayTotal)}
                </p>
                
                <Badge className={`text-xs font-bold px-3 py-1 ${
                  billsData.payables.today > 0 
                    ? 'bg-red-600 text-white border-red-500/50' 
                    : 'bg-gray-700 text-gray-300 border-gray-600/50'
                }`}>
                  {billsData.payables.today} conta(s)
                </Badge>
              </div>
            </div>
          </div>

          {billsData.payables.count === 0 && (
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
          {/* Contas a Receber HOJE */}
          <div className={`relative p-6 rounded-2xl overflow-hidden transition-all duration-300 ${
            billsData.receivables.today > 0 
              ? 'bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 border-2 border-green-500/40 shadow-xl shadow-green-500/10' 
              : 'bg-gradient-to-br from-gray-800/30 to-slate-800/30 border-2 border-gray-700/30 shadow-lg'
          }`}>
            {/* Efeito de brilho de fundo */}
            {billsData.receivables.today > 0 && (
              <div className="absolute inset-0 bg-gradient-to-tr from-green-600/10 via-transparent to-teal-600/10 animate-pulse"></div>
            )}
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  billsData.receivables.today > 0 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-gray-700/30 border border-gray-600/30'
                }`}>
                  <Calendar className={`w-4 h-4 ${billsData.receivables.today > 0 ? 'text-green-300' : 'text-gray-400'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    billsData.receivables.today > 0 ? 'text-green-200' : 'text-gray-400'
                  }`}>
                    📅 CONTAS A RECEBER HOJE
                  </span>
                </div>
              </div>
              
              <p className={`text-sm font-semibold mb-4 ${
                billsData.receivables.today > 0 ? 'text-emerald-300' : 'text-gray-500'
              }`}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
              
              <div className="flex items-end justify-between">
                <p className={`text-4xl font-black tracking-tight ${
                  billsData.receivables.today > 0 ? 'text-white' : 'text-gray-400'
                }`}>
                  R$ {formatCurrencyBR(billsData.receivables.todayTotal)}
                </p>
                
                <Badge className={`text-xs font-bold px-3 py-1 ${
                  billsData.receivables.today > 0 
                    ? 'bg-green-600 text-white border-green-500/50' 
                    : 'bg-gray-700 text-gray-300 border-gray-600/50'
                }`}>
                  {billsData.receivables.today} conta(s)
                </Badge>
              </div>
            </div>
          </div>

          {billsData.receivables.count === 0 && (
            <div className="text-center py-6 text-purple-300 text-sm">
              <p>Nenhuma conta a receber pendente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}