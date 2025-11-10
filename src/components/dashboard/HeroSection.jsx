import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Award
} from "lucide-react";

export default function HeroSection({ user, streak = 0 }) {
  const [greeting, setGreeting] = useState("");
  const [greetingEmoji, setGreetingEmoji] = useState("👋");

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
    { icon: Flame, label: `${streak} dias`, color: "text-orange-400", bg: "bg-orange-600/20" },
    { icon: Trophy, label: "Top 10%", color: "text-yellow-400", bg: "bg-yellow-600/20" },
    { icon: Target, label: "5 Metas", color: "text-cyan-400", bg: "bg-cyan-600/20" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-8 mb-8"
      style={{
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)"
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
          className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl"
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
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Left Side - User Info */}
        <div className="flex items-center gap-6">
          {/* Avatar with Neon Effect */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full blur-xl opacity-75 animate-pulse" />
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 p-1">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl md:text-4xl font-bold text-white">
                    {user?.full_name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
            </div>
            {/* Level Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full px-3 py-1 shadow-lg"
            >
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Award className="w-3 h-3" />
                Lv. 5
              </span>
            </motion.div>
          </motion.div>

          {/* Greeting */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mb-2"
            >
              <span className="text-2xl">{greetingEmoji}</span>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-300">
                {greeting}!
              </h1>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
            >
              {user?.full_name || "Usuário"}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-purple-400 mt-1 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Continue assim! Você está no controle 💪
            </motion.p>
          </div>
        </div>

        {/* Right Side - Actions & Achievements */}
        <div className="flex flex-col gap-4 w-full md:w-auto">
          {/* Achievements */}
          <div className="flex gap-2 flex-wrap">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className={`${achievement.bg} backdrop-blur-xl rounded-xl px-4 py-2 flex items-center gap-2 border border-white/10`}
              >
                <achievement.icon className={`w-4 h-4 ${achievement.color}`} />
                <span className="text-white font-semibold text-sm">
                  {achievement.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Link to={createPageUrl("Transactions") + "?action=new"} className="flex-1 md:flex-initial">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50">
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </Link>
            
            <Link to={createPageUrl("Consultor")}>
              <Button variant="outline" className="border-cyan-600/50 text-cyan-300 hover:bg-cyan-600/10">
                <Zap className="w-4 h-4 mr-2" />
                Consultor IA
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-12 h-12 text-purple-400" />
        </motion.div>
      </div>
    </motion.div>
  );
}