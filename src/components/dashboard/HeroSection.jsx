import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Sparkles,
  Flame,
  Trophy,
  Zap,
  TrendingUp,
  Target,
  Award,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ChevronRight,
  Calendar
} from "lucide-react";

export default function HeroSection({ user, streak = 0, totalBalance = 0, monthIncome = 0, monthExpense = 0 }) {
  const [greeting, setGreeting] = useState("");
  const [greetingEmoji, setGreetingEmoji] = useState("👋");
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      setGreeting("Bom dia");
      setGreetingEmoji("🌅");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Boa tarde");
      setGreetingEmoji("☀️");
    } else {
      setGreeting("Boa noite");
      setGreetingEmoji("🌙");
    }
  }, []);

  const achievements = [
    { 
      icon: Calendar, 
      label: `Sequência: ${streak}d`, 
      tooltip: "Dias consecutivos usando o app",
      color: "text-orange-400", 
      bg: "bg-orange-600/20", 
      border: "border-orange-500/30" 
    },
    { 
      icon: Trophy, 
      label: "Top 10% Usuários", 
      tooltip: "Entre os melhores da plataforma",
      color: "text-yellow-400", 
      bg: "bg-yellow-600/20", 
      border: "border-yellow-500/30" 
    },
    { 
      icon: Target, 
      label: "5 Metas Ativas", 
      tooltip: "Objetivos financeiros cadastrados",
      color: "text-cyan-400", 
      bg: "bg-cyan-600/20", 
      border: "border-cyan-500/30" 
    }
  ];

  const balanceChange = monthIncome - monthExpense;
  const isPositive = balanceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-5 mb-4 md:mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 50%, rgba(59, 130, 246, 0.15) 100%)"
      }}
    >
      {/* Background Effects - Reduzidos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-10 -right-10 w-40 h-40 md:w-64 md:h-64 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-10 -left-10 w-40 h-40 md:w-64 md:h-64 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10">
        {/* Top Row - User Info & Balance Card - MAIS COMPACTO */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Left: User Info - REDUZIDO */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative flex-shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full blur-md opacity-75 animate-pulse" />
              <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 p-0.5">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl md:text-2xl font-bold text-white">
                      {user?.full_name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
              </div>
              {/* Level Badge - Menor */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full px-1.5 py-0.5 shadow-lg"
              >
                <span className="text-[9px] md:text-[10px] font-bold text-white flex items-center gap-0.5">
                  <Award className="w-2 h-2 md:w-2.5 md:h-2.5" />
                  Lv.5
                </span>
              </motion.div>
            </motion.div>

            {/* Greeting - COMPACTO */}
            <div className="min-w-0 flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-1.5 mb-0.5"
              >
                <span className="text-lg md:text-xl">{greetingEmoji}</span>
                <h1 className="text-sm md:text-base font-bold text-purple-300">
                  {greeting}!
                </h1>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-2xl lg:text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent truncate"
              >
                {user?.full_name?.split(' ')[0] || "Usuário"}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[10px] md:text-xs text-purple-400 flex items-center gap-1.5 mt-0.5"
              >
                <Sparkles className="w-3 h-3" />
                Continue assim! Você está no controle 💪
              </motion.p>
            </div>
          </div>

          {/* Right: Balance Card - MAIS COMPACTO */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-blue-900/40 backdrop-blur-xl border border-white/10"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-600/30 to-transparent rounded-bl-full" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 rounded-lg bg-purple-600/30">
                    <Wallet className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                  <span className="text-[10px] md:text-xs text-purple-300 font-semibold">
                    Saldo Total
                  </span>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {showBalance ? (
                    <Eye className="w-3.5 h-3.5 text-purple-300" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-purple-300" />
                  )}
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {showBalance ? (
                  <motion.div
                    key="balance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                      R$ {totalBalance.toFixed(2)}
                    </h3>
                  </motion.div>
                ) : (
                  <motion.div
                    key="hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                      R$ ••••••
                    </h3>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  <div className="p-1 rounded bg-green-600/20">
                    <ArrowUpRight className="w-2.5 h-2.5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-purple-400">Receitas</p>
                    <p className="text-xs font-bold text-green-400">
                      {showBalance ? `R$ ${monthIncome.toFixed(2)}` : '••••'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <div className="p-1 rounded bg-red-600/20">
                    <ArrowDownRight className="w-2.5 h-2.5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-purple-400">Despesas</p>
                    <p className="text-xs font-bold text-red-400">
                      {showBalance ? `R$ ${monthExpense.toFixed(2)}` : '••••'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Monthly Change - Menor */}
              <div className={`px-2 py-1 rounded-lg flex items-center gap-1.5 ${
                isPositive ? 'bg-green-600/20' : 'bg-red-600/20'
              }`}>
                <TrendingUp className={`w-2.5 h-2.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
                <span className={`text-[10px] font-semibold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                  {isPositive ? '+' : ''}{showBalance ? `R$ ${Math.abs(balanceChange).toFixed(2)}` : '••••'} este mês
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Achievements Row - MAIS CLARO E OBJETIVO */}
        <div className="flex gap-2 flex-wrap mb-3">
          {achievements.map((achievement, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`${achievement.bg} backdrop-blur-xl rounded-lg px-3 py-2 flex items-center gap-2 border ${achievement.border} cursor-pointer group relative`}
              title={achievement.tooltip}
            >
              <achievement.icon className={`w-4 h-4 ${achievement.color}`} />
              <span className="text-white font-semibold text-xs whitespace-nowrap">
                {achievement.label}
              </span>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                {achievement.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons - MENORES */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link to={createPageUrl("Transactions") + "?action=new"} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 text-xs md:text-sm h-9 md:h-10 group">
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 group-hover:rotate-90 transition-transform" />
              Nova Transação
              <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          
          <Link to={createPageUrl("Consultor")} className="flex-1">
            <Button className="w-full bg-white/10 backdrop-blur-xl border border-cyan-600/50 text-cyan-300 hover:bg-cyan-600/20 text-xs md:text-sm h-9 md:h-10 group">
              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 group-hover:scale-110 transition-transform" />
              Consultor IA
              <Sparkles className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Decorative Elements - Menor */}
      <div className="absolute top-2 right-2 opacity-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
        </motion.div>
      </div>
    </motion.div>
  );
}