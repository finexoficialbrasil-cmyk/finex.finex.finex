import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  Building,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default function AccountCard3D({ account, index }) {
  const getAccountIcon = (type) => {
    const icons = {
      checking: Wallet,
      savings: PiggyBank,
      credit_card: CreditCard,
      investment: TrendingUp,
      crypto: DollarSign
    };
    return icons[type] || Wallet;
  };

  const getAccountGradient = (type) => {
    const gradients = {
      checking: "from-purple-600 via-purple-500 to-pink-600",
      savings: "from-green-600 via-emerald-500 to-teal-600",
      credit_card: "from-orange-600 via-red-500 to-pink-600",
      investment: "from-cyan-600 via-blue-500 to-indigo-600",
      crypto: "from-yellow-600 via-orange-500 to-red-600"
    };
    return gradients[type] || gradients.checking;
  };

  const Icon = getAccountIcon(account.type);
  const gradient = getAccountGradient(account.type);
  const isPositive = account.balance >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      style={{ perspective: 1000 }}
      className="h-full"
    >
      <Card className="glass-card border-0 relative overflow-hidden group h-full">
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
        
        {/* Card Number Pattern (decorative) */}
        <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 opacity-5">
          <div className="grid grid-cols-4 gap-1 md:gap-2 p-2 md:p-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white" />
            ))}
          </div>
        </div>

        <CardContent className="p-4 md:p-6 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br ${gradient} shadow-lg flex-shrink-0`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
              </motion.div>
              
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-bold text-sm md:text-base lg:text-lg truncate">
                  {account.name}
                </h3>
                <p className="text-purple-400 text-[10px] md:text-xs truncate">
                  {account.type === 'checking' && 'Conta Corrente'}
                  {account.type === 'savings' && 'Poupança'}
                  {account.type === 'credit_card' && 'Cartão de Crédito'}
                  {account.type === 'investment' && 'Investimentos'}
                  {account.type === 'crypto' && 'Criptomoedas'}
                </p>
              </div>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`p-1.5 md:p-2 rounded-full flex-shrink-0 ${
                isPositive ? 'bg-green-600/20' : 'bg-red-600/20'
              }`}
            >
              {isPositive ? (
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
              ) : (
                <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
              )}
            </motion.div>
          </div>

          {/* Balance */}
          <div className="mb-3 md:mb-4">
            <p className="text-purple-300 text-[10px] md:text-xs mb-0.5 md:mb-1">Saldo Disponível</p>
            <motion.div
              className="flex items-baseline gap-1 md:gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
                R$ {Math.abs(account.balance).toFixed(2)}
              </span>
              {!isPositive && (
                <span className="text-red-400 text-xs md:text-sm">(negativo)</span>
              )}
            </motion.div>
          </div>

          {/* Mini Chart (decorative sparkline) */}
          <div className="h-8 md:h-12 mb-3 md:mb-4 opacity-30">
            <svg width="100%" height="100%" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={isPositive ? 'text-green-400' : 'text-red-400'}
                points="0,40 20,30 40,35 60,20 80,25 100,15"
              />
            </svg>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className={`flex-1 bg-gradient-to-r ${gradient} hover:opacity-90 text-xs md:text-sm h-8 md:h-auto`}
            >
              <ArrowUpRight className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Transação</span>
              <span className="sm:hidden">+</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-purple-700 text-purple-300 hover:bg-purple-900/30 text-xs md:text-sm h-8 md:h-auto px-2 md:px-4"
            >
              <span className="hidden sm:inline">Detalhes</span>
              <span className="sm:hidden">•••</span>
            </Button>
          </div>
        </CardContent>

        {/* Hover Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />

        {/* 3D Shadow Effect */}
        <div className={`absolute -inset-1 bg-gradient-to-br ${gradient} opacity-20 blur-xl group-hover:opacity-30 transition-opacity -z-10`} />
      </Card>
    </motion.div>
  );
}