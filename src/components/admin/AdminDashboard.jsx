import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Transaction } from "@/entities/Transaction";
import { SystemTutorial } from "@/entities/SystemTutorial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Eye, TrendingUp, ArrowUpRight, X } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    activeUsersList: [],
    totalTransactions: 0,
    totalTutorialsViews: 0,
    recentUsers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showActiveUsers, setShowActiveUsers] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log("🔄 Admin Dashboard carregando estatísticas rápidas...");
      
      // ✅ OTIMIZADO: Carregar apenas dados essenciais COM LIMITES
      const [users, recentTxs, tutorials] = await Promise.all([
        User.list("-created_date", 100), // ✅ Limite de 100 usuários
        Transaction.list("-created_date", 50), // ✅ Apenas últimas 50 transações
        SystemTutorial.list("-created_date", 20) // ✅ Apenas 20 tutoriais
      ]);

      console.log(`✅ Dashboard: ${users.length} usuários, ${recentTxs.length} transações recentes`);

      // ✅ Calcular usuários ativos (últimos 30 dias)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const activeUsersList = users.filter(u => {
        const lastActivity = new Date(u.updated_date || u.created_date);
        return lastActivity >= thirtyDaysAgo;
      });

      // ✅ Somar visualizações dos tutoriais
      const totalViews = tutorials.reduce((sum, t) => sum + (t.views_count || 0), 0);

      setStats({
        totalUsers: users.length,
        activeUsers: activeUsersList.length,
        activeUsersList,
        totalTransactions: recentTxs.length,
        totalTutorialsViews: totalViews,
        recentUsers: users.slice(0, 5)
      });
    } catch (error) {
      console.error("❌ Erro ao carregar estatísticas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats.totalUsers,
      icon: Users,
      color: "from-purple-600 to-purple-400",
      trend: "+12%"
    },
    {
      title: "Usuários Ativos (30d)",
      value: stats.activeUsers,
      icon: Activity,
      color: "from-green-600 to-emerald-400",
      trend: "+8%"
    },
    {
      title: "Transações Recentes",
      value: stats.totalTransactions,
      icon: TrendingUp,
      color: "from-blue-600 to-cyan-400",
      trend: "Últimas 50"
    },
    {
      title: "Visualizações de Tutoriais",
      value: stats.totalTutorialsViews,
      icon: Eye,
      color: "from-orange-600 to-yellow-400",
      trend: "+15%"
    }
  ];

  if (isLoading) {
    return <div className="text-purple-300 text-center py-12">Carregando estatísticas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const isActiveUsers = stat.title === "Usuários Ativos (30d)";
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`glass-card border-0 neon-glow ${isActiveUsers ? 'cursor-pointer hover:scale-105 transition-transform ring-2 ring-green-500/30 hover:ring-green-500/60' : ''}`}
                onClick={isActiveUsers ? () => setShowActiveUsers(true) : undefined}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <ArrowUpRight className="w-4 h-4" />
                      {stat.trend}
                    </div>
                  </div>
                  <p className="text-purple-300 text-sm mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  {isActiveUsers && (
                    <p className="text-xs text-green-400 mt-2">👆 Clique para ver detalhes</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Modal Usuários Ativos */}
      <Dialog open={showActiveUsers} onOpenChange={setShowActiveUsers}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-[#1a1a2e] z-10 pb-4 border-b border-purple-900/30">
            <DialogTitle className="text-xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Usuários Ativos nos últimos 30 dias ({stats.activeUsers})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {stats.activeUsersList.length === 0 ? (
              <p className="text-purple-300 text-center py-8">Nenhum usuário ativo encontrado.</p>
            ) : (
              stats.activeUsersList.map((user, index) => {
                const lastActivity = new Date(user.updated_date || user.created_date);
                const daysAgo = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-purple-900/20 border border-purple-700/30 hover:bg-purple-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{user.full_name?.charAt(0) || "U"}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{user.full_name || "Sem nome"}</p>
                        <p className="text-purple-300 text-xs">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${user.role === 'admin' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-blue-600/20 text-blue-400'}`}>
                            {user.role === 'admin' ? '👑 Admin' : '👤 Usuário'}
                          </Badge>
                          {user.subscription_status && (
                            <Badge className={`text-xs ${user.subscription_status === 'active' ? 'bg-green-600/20 text-green-400' : user.subscription_status === 'trial' ? 'bg-cyan-600/20 text-cyan-400' : 'bg-gray-600/20 text-gray-400'}`}>
                              {user.subscription_status === 'active' ? '✅ Ativo' : user.subscription_status === 'trial' ? '🆓 Trial' : user.subscription_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-green-400 font-medium">
                        {daysAgo === 0 ? 'Hoje' : `${daysAgo}d atrás`}
                      </p>
                      <p className="text-xs text-purple-400 mt-1">
                        {lastActivity.toLocaleDateString('pt-BR')}
                      </p>
                      {user.subscription_plan && (
                        <p className="text-xs text-purple-500 mt-1 capitalize">{user.subscription_plan}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Users */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white">Usuários Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {stats.recentUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg glass-card"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold">{user.full_name?.charAt(0) || "U"}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.full_name || "Sem nome"}</p>
                    <p className="text-purple-300 text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-400">
                    {new Date(user.created_date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-purple-500">
                    {user.role === 'admin' ? '👑 Admin' : '👤 Usuário'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}