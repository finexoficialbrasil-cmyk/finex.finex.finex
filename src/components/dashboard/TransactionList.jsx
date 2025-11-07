
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Clock, Calendar, Wallet, Tags, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionList({ transactions, categories, accounts, isLoading }) {
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Memoizar funções auxiliares
  const getCategoryInfo = useMemo(() => {
    return (categoryId) => categories.find(c => c.id === categoryId) || { name: "Sem categoria", color: "#666" };
  }, [categories]);

  const getAccountInfo = useMemo(() => {
    return (accountId) => accounts.find(a => a.id === accountId) || { name: "Conta não encontrada" };
  }, [accounts]);

  // ✅ Memoizar transações recentes COM LOG
  const recentTransactions = useMemo(() => {
    console.log("🔄 TransactionList - Processando transações recentes");
    console.log(`📊 Total de transações recebidas: ${transactions.length}`);
    
    const recent = transactions.slice(0, 5);
    
    console.log(`📋 Mostrando ${recent.length} transações recentes:`);
    recent.forEach(t => {
      console.log(`  → ${t.description}: ${t.type === 'income' ? '+' : '-'}R$ ${t.amount.toFixed(2)} | Status: ${t.status} | Data: ${t.date}`);
    });
    
    return recent;
  }, [transactions]);

  return (
    <>
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30 p-4">
          <CardTitle className="flex items-center gap-2 text-white text-base md:text-lg">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg glass-card">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div>
                      <Skeleton className="h-3 w-24 mb-2" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-purple-300 text-sm">
              <p>Nenhuma transação registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx, index) => {
                const category = getCategoryInfo(tx.category_id);
                const account = getAccountInfo(tx.account_id);
                const isIncome = tx.type === "income";

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedTransaction(tx)}
                    className="flex items-center justify-between p-3 rounded-lg glass-card hover:bg-purple-900/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-full flex-shrink-0 ${isIncome ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                        {isIncome ? (
                          <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-xs md:text-sm truncate">{tx.description}</p>
                        <div className="flex items-center gap-1 md:gap-2 mt-0.5">
                          <span className="text-[10px] md:text-xs text-purple-300">
                            {format(new Date(tx.date), "dd/MM", { locale: ptBR })}
                          </span>
                          <span className="text-[10px] md:text-xs text-purple-400 hidden sm:inline">•</span>
                          <Badge
                            className="text-[9px] md:text-[10px] px-1 py-0 h-4 hidden sm:inline-flex"
                            style={{
                              backgroundColor: category.color + '20',
                              color: category.color,
                              borderColor: category.color + '40'
                            }}
                          >
                            {category.name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`font-bold text-xs md:text-sm ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                        {isIncome ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                      </p>
                      {tx.status === "pending" && (
                        <Badge variant="outline" className="text-[9px] border-yellow-600 text-yellow-400 px-1 h-3 mt-0.5 hidden md:inline-flex">
                          Pendente
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {!isLoading && transactions.length > 5 && (
            <div className="mt-3 text-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-purple-700 text-purple-300 hover:bg-purple-900/20"
                onClick={() => window.location.href = '/Transactions'}
              >
                Ver Todas ({transactions.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="glass-card border-purple-700/50 text-white max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Detalhes da Transação
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedTransaction(null)}
                  className="text-purple-300 hover:text-white h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Amount */}
              <div className="text-center p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                <p className="text-xs text-purple-300 mb-1">Valor</p>
                <p className={`text-2xl sm:text-3xl font-bold ${
                  selectedTransaction.type === "income" ? 'text-green-400' : 'text-red-400'
                }`}>
                  {selectedTransaction.type === "income" ? '+' : '-'} R$ {selectedTransaction.amount.toFixed(2)}
                </p>
                <Badge className={`mt-2 text-xs ${
                  selectedTransaction.type === "income" 
                    ? 'bg-green-600/20 text-green-400 border-green-600/40' 
                    : 'bg-red-600/20 text-red-400 border-red-600/40'
                }`}>
                  {selectedTransaction.type === "income" ? 'Entrada' : 'Saída'}
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-900/10">
                  <FileText className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-purple-300 mb-0.5">Descrição</p>
                    <p className="text-white font-medium text-sm break-words">{selectedTransaction.description}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-900/10">
                  <Calendar className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] text-purple-300 mb-0.5">Data</p>
                    <p className="text-white font-medium text-sm">
                      {format(new Date(selectedTransaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-900/10">
                  <Wallet className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] text-purple-300 mb-0.5">Conta</p>
                    <p className="text-white font-medium text-sm">
                      {getAccountInfo(selectedTransaction.account_id).name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-900/10">
                  <Tags className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] text-purple-300 mb-0.5">Categoria</p>
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor: getCategoryInfo(selectedTransaction.category_id).color + '20',
                        color: getCategoryInfo(selectedTransaction.category_id).color,
                        borderColor: getCategoryInfo(selectedTransaction.category_id).color + '40'
                      }}
                    >
                      {getCategoryInfo(selectedTransaction.category_id).name}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-900/10">
                  <Clock className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] text-purple-300 mb-0.5">Status</p>
                    <Badge className={`text-xs ${
                      selectedTransaction.status === "completed" 
                        ? 'bg-green-600/20 text-green-400 border-green-600/40'
                        : selectedTransaction.status === "pending"
                        ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/40'
                        : 'bg-red-600/20 text-red-400 border-red-600/40'
                    }`}>
                      {selectedTransaction.status === "completed" ? 'Concluída' :
                       selectedTransaction.status === "pending" ? 'Pendente' : 'Cancelada'}
                    </Badge>
                  </div>
                </div>

                {selectedTransaction.notes && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-900/10">
                    <FileText className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-purple-300 mb-0.5">Observações</p>
                      <p className="text-white text-xs break-words">{selectedTransaction.notes}</p>
                    </div>
                  </div>
                )}

                {/* Created Info */}
                <div className="pt-3 border-t border-purple-900/30">
                  <div className="text-[10px] text-purple-400">
                    <p>Criado por: {selectedTransaction.created_by}</p>
                    <p className="mt-0.5">
                      Em: {format(new Date(selectedTransaction.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setSelectedTransaction(null)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
