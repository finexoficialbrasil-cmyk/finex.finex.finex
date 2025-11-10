import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HeroSection({ user, streak = 0, totalBalance = 0, monthIncome = 0, monthExpense = 0 }) {
  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      setGreeting("Bom dia");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Boa tarde");
    } else {
      setGreeting("Boa noite");
    }

    // Formatar data em português
    const today = new Date();
    const formattedDate = format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    setCurrentDate(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
  }, []);

  const firstName = user?.full_name?.split(' ')[0] || "Usuário";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 py-3 mb-6 rounded-lg"
      style={{
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)"
      }}
    >
      {/* Left: Greeting */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white mb-0.5">
          {greeting}, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{firstName}</span> 👋
        </h1>
        <p className="text-xs text-purple-300">
          {currentDate}
        </p>
      </div>

      {/* Right: Action Button */}
      <Link to={createPageUrl("Transactions") + "?action=new"}>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 text-sm h-9">
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Transação
        </Button>
      </Link>
    </motion.div>
  );
}