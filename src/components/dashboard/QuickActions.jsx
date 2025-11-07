
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, ArrowLeftRight, Wallet, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

// NOVA FUNÇÃO: Obter data local sem problema de timezone
const getTodayLocal = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const actions = [
  { title: "Nova Entrada", icon: Plus, color: "from-green-600 to-emerald-400", url: createPageUrl("Transactions") + "?type=income" },
  { title: "Nova Saída", icon: ArrowLeftRight, color: "from-red-600 to-pink-400", url: createPageUrl("Transactions") + "?type=expense" },
  { title: "Adicionar Conta", icon: Wallet, color: "from-purple-600 to-purple-400", url: createPageUrl("Accounts") + "?action=new" },
  { title: "Criar Meta", icon: Target, color: "from-cyan-600 to-blue-400", url: createPageUrl("Goals") },
];

export default function QuickActions() {
  // The provided outline includes code snippets related to `formData`, `useState`, `useEffect`, `handleSubmit`, `Transaction.create`, and `Account.update`.
  // These elements are not present in the current `QuickActions` component, which is designed to render quick action buttons.
  // Implementing these changes directly into this component would require a complete re-architecture,
  // introduce undeclared variables/imports (like `useState`, `Transaction`, `Account`, `setShowModal`),
  // and fundamentally alter its current functionality, violating the instruction to "preserve all other features, elements and functionality"
  // and "not create any syntax errors or bugs".
  // Therefore, only the `getTodayLocal` utility function (which is self-contained and useful globally) has been added as it's the only
  // part of the outline that can be safely integrated without breaking the existing component's structure and purpose.
  // The `QuickActions` component itself remains as a display component for quick links.

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
                <Button
                  variant="outline"
                  className={`w-full h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${action.color} bg-opacity-10 border-0 hover:bg-opacity-20 transition-all`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                  <span className="text-xs text-white font-medium">{action.title}</span>
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
