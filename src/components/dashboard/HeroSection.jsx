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
      setGreeting("Seja bem-vindo");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Seja bem-vindo");
    } else {
      setGreeting("Seja bem-vindo");
    }

    // Formatar data em português
    const today = new Date();
    const formattedDate = format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    setCurrentDate(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
  }, []);

  // Usar nome completo (lowercase como na imagem)
  const fullName = user?.full_name?.toLowerCase() || "usuário";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-8 py-6 mb-6 rounded-xl w-full"
      style={{
        background: "#1a1a2e"
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left: Greeting */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              {greeting}, {fullName}
            </span>{" "}
            <span className="inline-block">👋</span>
          </h1>
          <p className="text-base text-purple-200 capitalize">
            {currentDate}
          </p>
        </div>

        {/* Right: Action Button */}
        <Link to={createPageUrl("Transactions") + "?action=new"}>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 h-12 px-8 text-base font-semibold">
            <Plus className="w-5 h-5 mr-2" />
            Nova Transação
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}