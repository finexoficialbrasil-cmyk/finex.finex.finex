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
  ChevronRight
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
    { icon: Flame, label: `${streak} dias`, color: "text-orange-400", bg: "bg-orange-600/20", border: "border-orange-500/30" },
    { icon: Trophy, label: "Top 10%", color: "text-yellow-400", bg: "bg-yellow-600/20", border: "border-yellow-500/30" },
    { icon: Target, label: "5 Metas", color: "text-cyan-400", bg: "bg-cyan-600/20", border: "border-cyan-500/30" }
  ];

  const balanceChange = monthIncome - monthExpense;
  const isPositive = balanceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-8 mb-6 md:mb-8"
      style={{
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 50%, rgba(59, 130, 246, 0.15) 100%)"
      }}
    >
      {/* Background Effects */}
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
          className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl"
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
          className="absolute -bottom-20 -left-20 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10">
        {/* Top Row - User Info & Balance Card */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Left: User Info */}
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative flex-shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full blur-lg md:blur-xl opacity-75 animate-pulse" />
              <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 p-0.5 md:p-1">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                      {user?.full_name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
              </div>
              {/* Level Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full px-2 md:px-3 py-0.5 md:py-1 shadow-lg"
              >
                <span className="text-[10px] md:text-xs font-bold text-white flex items-center gap-0.5 md:gap-1">
                  <Award className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  Lv. 5
                </span>
              </motion.div>
            </motion.div>

            {/* Greeting */}
            <div className="min-w-0 flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-1"
              >
                <span className="text-2xl md:text-3xl">{greetingEmoji}</span>
                <h1 className="text-base md:text-xl lg:text-2xl font-bold text-purple-300">
                  {greeting}!
                </h1>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl lg:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent truncate"
              >
                {user?.full_name?.split(' ')[0] || "Usuário"}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs md:text-sm text-purple-400 flex items-center gap-2 mt-1"
              >
                <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                Continue assim! Você está no controle 💪
              </motion.p>
            </div>
          </div>

          {/* Right: Balance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-blue-900/40 backdrop-blur-xl border-2 border-white/10"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-600/30 to-transparent rounded-bl-full" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-600/30">
                    <Wallet className="w-4 h-4 md:w-5 md:h-5 text-purple-300" />
                  </div>
                  <span className="text-xs md:text-sm text-purple-300 font-semibold">
                    Saldo Total
                  </span>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {showBalance ? (
                    <Eye className="w-4 h-4 text-purple-300" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-purple-300" />
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
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-2">
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
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-2">
                      R$ ••••••
                    </h3>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 rounded bg-green-600/20">
                    <ArrowUpRight className="w-3 h-3 text-green-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-400">Receitas</p>
                    <p className="text-sm font-bold text-green-400">
                      {showBalance ? `R$ ${monthIncome.toFixed(2)}` : '••••'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 rounded bg-red-600/20">
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-400">Despesas</p>
                    <p className="text-sm font-bold text-red-400">
                      {showBalance ? `R$ ${monthExpense.toFixed(2)}` : '••••'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Monthly Change */}
              <div className={`mt-3 px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                isPositive ? 'bg-green-600/20' : 'bg-red-600/20'
              }`}>
                <TrendingUp className={`w-3 h-3 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
                <span className={`text-xs font-semibold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                  {isPositive ? '+' : ''}{showBalance ? `R$ ${Math.abs(balanceChange).toFixed(2)}` : '••••'} este mês
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Achievements Row */}
        <div className="flex gap-2 flex-wrap mb-6">
          {achievements.map((achievement, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`${achievement.bg} backdrop-blur-xl rounded-xl px-3 md:px-4 py-2 md:py-2.5 flex items-center gap-2 border-2 ${achievement.border} cursor-pointer`}
            >
              <achievement.icon className={`w-4 h-4 md:w-5 md:h-5 ${achievement.color}`} />
              <span className="text-white font-semibold text-xs md:text-sm whitespace-nowrap">
                {achievement.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl("Transactions") + "?action=new"} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 text-sm md:text-base h-11 md:h-12 group">
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2 group-hover:rotate-90 transition-transform" />
              Nova Transação
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          
          <Link to={createPageUrl("Consultor")} className="flex-1">
            <Button className="w-full bg-white/10 backdrop-blur-xl border-2 border-cyan-600/50 text-cyan-300 hover:bg-cyan-600/20 text-sm md:text-base h-11 md:h-12 group">
              <Zap className="w-4 h-4 md:w-5 md:h-5 mr-2 group-hover:scale-110 transition-transform" />
              Consultor IA
              <Sparkles className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-purple-400" />
        </motion.div>
      </div>
    </motion.div>
  );
}