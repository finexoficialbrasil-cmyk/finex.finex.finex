import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownRight, FileText, Eye, User, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

// ✅ NOVA FUNÇÃO: Formatar data sem conversão de timezone
const formatDateBR = (dateString) => {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function TransactionList({ transactions, categories, accounts, isLoading }) {
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const getCategoryInfo = useMemo(() => {
    return (categoryId) => {
      if (!categoryId || !Array.isArray(categories)) return { name: "Sem categoria", color: "#666" };
      return categories.find(c => c.id === categoryId) || { name: "Sem categoria", color: "#666" };
    };
  }, [categories]);

  const getAccountInfo = useMemo(() => {
    return (accountId) => {
      if (!accountId || !Array.isArray(accounts)) return { name: "Não definida" };
      return accounts.find(a => a.id === accountId) || { name: "Não definida" };
    };
  }, [accounts]);

  // ✅ CORRIGIDO: Confiar na ordenação do backend e pegar apenas 5 primeiras
  // O Dashboard já carrega com Transaction.list("-created_date", 30)
  // Então as transações já vêm ordenadas do mais recente para o mais antigo
  const recentTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) {
      console.warn("⚠️ transactions não é array:", transactions);
      return [];
    }
    
    console.log("📊 TransactionList - Total de transações:", transactions.length);
    
    // Pegar as 5 primeiras (já vêm ordenadas do backend)
    const recent = transactions.slice(0, 5);
    
    console.log("📋 5 Transações mais recentes:");
    recent.forEach((tx, idx) => {
      console.log(`  ${idx + 1}. ${tx.description} | Data: ${tx.date} | Criado: ${tx.created_date}`);
    });
    
    return recent;
  }, [transactions]);

  return (
    <>
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-purple-400" />
              Últimas Transações
            </CardTitle>
            {transactions.length > 5 && (
              <Link to={createPageUrl("Transactions")}>
                <Button variant="outline" size="sm" className="border-purple-700 text-purple-300">
                  Ver Todas
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl glass-card animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-purple-900/30" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-purple-900/30 rounded w-3/4" />
                    <div className="h-3 bg-purple-900/30 rounded w-1/2" />
                  </div>
                  <div className="h-6 bg-purple-900/30 rounded w-20" />
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-purple-300">
              <FileText className="w-12 h-12 mx-auto mb-3 text-purple-400" />
              <p>Nenhuma transação ainda</p>
              <p className="text-sm text-purple-400 mt-2">Adicione sua primeira transação!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {recentTransactions.map((tx, index) => {
                  const category = getCategoryInfo(tx.category_id);
                  const account = getAccountInfo(tx.account_id);
                  const isIncome = tx.type === "income";

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl glass-card hover:bg-purple-900/20 transition-all cursor-pointer"
                      onClick={() => setSelectedTransaction(tx)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-full flex-shrink-0 ${isIncome ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                          {isIncome ? (
                            <ArrowUpRight className="w-5 h-5 text-green-400" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{tx.description}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-purple-300 flex-shrink-0">{formatDateBR(tx.date)}</span>
                            <span className="text-xs text-purple-400 flex-shrink-0">•</span>
                            <span className="text-xs text-purple-300 truncate">{account.name}</span>
                            <Badge
                              className="text-xs flex-shrink-0"
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
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <p className={`font-bold text-base md:text-lg ${isIncome ? 'text-green-400' : 'text-red-400'} whitespace-nowrap`}>
                          {isIncome ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                        </p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <Eye className="w-4 h-4 text-purple-400" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Detalhes da Transação
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/30">
                <p className={`text-5xl font-bold ${selectedTransaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'} R$ {selectedTransaction.amount.toFixed(2)}
                </p>
                <Badge className={`mt-3 ${selectedTransaction.type === 'income' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                  {selectedTransaction.type === 'income' ? 'Entrada' : 'Saída'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                  <p className="text-xs text-purple-400 mb-1">Descrição</p>
                  <p className="text-white font-medium break-words">{selectedTransaction.description}</p>
                </div>

                <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                  <p className="text-xs text-purple-400 mb-1">Data</p>
                  <p className="text-white font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDateBR(selectedTransaction.date)}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                  <p className="text-xs text-purple-400 mb-1">Conta</p>
                  <p className="text-white font-medium break-words">{getAccountInfo(selectedTransaction.account_id).name}</p>
                </div>

                <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                  <p className="text-xs text-purple-400 mb-1">Categoria</p>
                  <Badge
                    style={{
                      backgroundColor: getCategoryInfo(selectedTransaction.category_id).color + '20',
                      color: getCategoryInfo(selectedTransaction.category_id).color
                    }}
                  >
                    {getCategoryInfo(selectedTransaction.category_id).name}
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                <p className="text-xs text-purple-400 mb-1">Status</p>
                <Badge className={
                  selectedTransaction.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                  selectedTransaction.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-gray-600/20 text-gray-400'
                }>
                  {selectedTransaction.status === 'completed' ? 'Concluída' :
                   selectedTransaction.status === 'pending' ? 'Pendente' : 'Cancelada'}
                </Badge>
              </div>

              {selectedTransaction.notes && (
                <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                  <p className="text-xs text-purple-400 mb-1">Observações</p>
                  <p className="text-white text-sm break-words">{selectedTransaction.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-700/30">
                <div className="text-center">
                  <p className="text-xs text-purple-400 mb-1">Criado por</p>
                  <p className="text-white text-sm flex items-center justify-center gap-1 break-all">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{selectedTransaction.created_by}</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-purple-400 mb-1">Criado em</p>
                  <p className="text-white text-sm">{formatDateBR(selectedTransaction.created_date?.split('T')[0])}</p>
                </div>
              </div>

              <Button
                onClick={() => setSelectedTransaction(null)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}