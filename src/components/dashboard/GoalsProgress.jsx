import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function GoalsProgress({ goals }) {
  const activeGoals = goals.filter(g => g.status === "active").slice(0, 3);

  return (
    <Card className="glass-card border-0 neon-glow">
      <CardHeader className="border-b border-purple-900/30">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-400" />
            Metas Financeiras
          </div>
          <Link to={createPageUrl("Profile") + "?action=goals"}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {activeGoals.length === 0 ? (
          <div className="text-center py-8 text-purple-300">
            <Target className="w-12 h-12 mx-auto mb-3 text-purple-400" />
            <p className="text-sm">Nenhuma meta criada ainda</p>
            <Link to={createPageUrl("Profile") + "?action=goals"}>
              <Button variant="outline" className="mt-4 border-purple-600 text-purple-300 hover:bg-purple-900/20">
                Criar Primeira Meta
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {activeGoals.map((goal, index) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">{goal.title}</p>
                      <p className="text-sm text-purple-300 mt-1">
                        R$ {goal.current_amount.toFixed(2)} de R$ {goal.target_amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-cyan-400">{progress.toFixed(0)}%</p>
                    </div>
                  </div>
                  <Progress
                    value={progress}
                    className="h-2 bg-purple-900/30"
                    style={{
                      background: 'linear-gradient(to right, #a855f7, #ec4899)'
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}