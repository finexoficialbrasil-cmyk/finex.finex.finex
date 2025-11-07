import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, ArrowLeftRight, Wallet, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  { 
    title: "Nova Entrada", 
    icon: Plus, 
    gradient: "from-green-500 via-emerald-500 to-green-600", 
    url: createPageUrl("Transactions") + "?type=income",
    bgColor: "bg-green-500/20",
    hoverBg: "hover:bg-green-500/30",
    iconColor: "text-green-400"
  },
  { 
    title: "Nova Saída", 
    icon: ArrowLeftRight, 
    gradient: "from-red-500 via-pink-500 to-red-600", 
    url: createPageUrl("Transactions") + "?type=expense",
    bgColor: "bg-red-500/20",
    hoverBg: "hover:bg-red-500/30",
    iconColor: "text-red-400"
  },
  { 
    title: "Adicionar Conta", 
    icon: Wallet, 
    gradient: "from-purple-500 via-fuchsia-500 to-purple-600", 
    url: createPageUrl("Accounts") + "?action=new",
    bgColor: "bg-purple-500/20",
    hoverBg: "hover:bg-purple-500/30",
    iconColor: "text-purple-400"
  },
  { 
    title: "Criar Meta", 
    icon: Target, 
    gradient: "from-cyan-500 via-blue-500 to-cyan-600", 
    url: createPageUrl("Goals"),
    bgColor: "bg-cyan-500/20",
    hoverBg: "hover:bg-cyan-500/30",
    iconColor: "text-cyan-400"
  },
];

export default function QuickActions() {
  return (
    <Card className="glass-card border-0 neon-glow">
      <CardHeader className="border-b border-purple-900/30">
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="w-5 h-5 text-yellow-400" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={action.url}>
                <div className={`relative overflow-hidden rounded-xl h-24 ${action.bgColor} ${action.hoverBg} transition-all cursor-pointer group`}>
                  {/* Gradiente de fundo */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />
                  
                  {/* Conteúdo */}
                  <div className="relative z-10 h-full flex flex-col items-center justify-center gap-2 p-4">
                    <action.icon className="w-6 h-6 text-white drop-shadow-lg" />
                    <span className="text-xs text-white font-semibold text-center drop-shadow-lg">
                      {action.title}
                    </span>
                  </div>

                  {/* Brilho ao hover */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}