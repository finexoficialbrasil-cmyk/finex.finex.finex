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

  const balanceChange = monthIncome - monthExpense;
  const isPositive = balanceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl p-4 mb-4"
      style={{
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)"
      }}
    >
      <div className="relative z-10">
        {/* Top Row - Compacto */}
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          {/* Left: User Info - Minimalista */}
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {user?.full_name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-base">{greetingEmoji}</span>
                <h1 className="text-xs font-semibold text-purple-300">
                  {greeting}!
                </h1>
              </div>
              
              <h2 className="text-lg font-bold text-white truncate">
                {user?.full_name?.split(' ')[0] || "Usuário"}
              </h2>
            </div>
          </div>

          {/* Right: Balance Card - Compacto */}
          <div className="rounded-lg p-3 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-purple-300 font-medium">Saldo Total</span>
              
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                {showBalance ? (
                  <Eye className="w-3 h-3 text-purple-300" />
                ) : (
                  <EyeOff className="w-3 h-3 text-purple-300" />
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {showBalance ? (
                <h3 className="text-xl font-black text-white mb-1.5">
                  R$ {totalBalance.toFixed(2)}
                </h3>
              ) : (
                <h3 className="text-xl font-black text-white mb-1.5">
                  R$ ••••••
                </h3>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 text-[10px]">
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-1 rounded-full bg-green-400"></div>
                <span className="text-purple-300">R$</span>
                <span className="text-green-400 font-semibold">
                  {showBalance ? monthIncome.toFixed(0) : '•••'}
                </span>
              </div>
              
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-1 rounded-full bg-red-400"></div>
                <span className="text-purple-300">R$</span>
                <span className="text-red-400 font-semibold">
                  {showBalance ? monthExpense.toFixed(0) : '•••'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Badges - ULTRA MINIMALISTA */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/5">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] text-orange-400 font-semibold">{streak}d</span>
          </div>
          
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/5">
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span className="text-[10px] text-yellow-400 font-semibold">Top 10%</span>
          </div>
          
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/5">
            <Target className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] text-cyan-400 font-semibold">5 Metas</span>
          </div>
        </div>

        {/* Action Buttons - Compactos */}
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl("Transactions") + "?action=new"}>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs h-8">
              <Plus className="w-3 h-3 mr-1" />
              Nova Transação
            </Button>
          </Link>
          
          <Link to={createPageUrl("Consultor")}>
            <Button className="w-full bg-white/10 border border-cyan-600/50 text-cyan-300 hover:bg-cyan-600/20 text-xs h-8">
              <Zap className="w-3 h-3 mr-1" />
              Consultor IA
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}