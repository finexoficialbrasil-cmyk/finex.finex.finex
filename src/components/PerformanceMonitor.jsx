import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Zap, Database, Clock, TrendingUp, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Singleton para armazenar métricas
const performanceMetrics = {
  pageLoads: [],
  apiCalls: [],
  renderTimes: []
};

// ✅ Função para adicionar métrica
export const trackPerformance = (type, name, duration) => {
  const metric = {
    type,
    name,
    duration,
    timestamp: Date.now()
  };

  if (type === 'page_load') {
    performanceMetrics.pageLoads.push(metric);
    if (performanceMetrics.pageLoads.length > 20) {
      performanceMetrics.pageLoads.shift();
    }
  } else if (type === 'api_call') {
    performanceMetrics.apiCalls.push(metric);
    if (performanceMetrics.apiCalls.length > 50) {
      performanceMetrics.apiCalls.shift();
    }
  } else if (type === 'render') {
    performanceMetrics.renderTimes.push(metric);
    if (performanceMetrics.renderTimes.length > 30) {
      performanceMetrics.renderTimes.shift();
    }
  }

  console.log(`📊 Performance [${type}]: ${name} - ${duration.toFixed(2)}ms`);
};

export default function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({ pageLoads: [], apiCalls: [], renderTimes: [] });
  const [stats, setStats] = useState({
    avgPageLoad: 0,
    avgApiCall: 0,
    avgRender: 0,
    slowestPage: null,
    slowestApi: null
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const user = await User.me();
      setIsAdmin(user.role === 'admin');
    } catch (error) {
      console.error("Erro ao verificar admin:", error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    const interval = setInterval(() => {
      setMetrics({
        pageLoads: [...performanceMetrics.pageLoads],
        apiCalls: [...performanceMetrics.apiCalls],
        renderTimes: [...performanceMetrics.renderTimes]
      });

      calculateStats();
    }, 3000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  const calculateStats = () => {
    const pageLoads = performanceMetrics.pageLoads;
    const apiCalls = performanceMetrics.apiCalls;
    const renderTimes = performanceMetrics.renderTimes;

    const avgPageLoad = pageLoads.length > 0
      ? pageLoads.reduce((sum, m) => sum + m.duration, 0) / pageLoads.length
      : 0;

    const avgApiCall = apiCalls.length > 0
      ? apiCalls.reduce((sum, m) => sum + m.duration, 0) / apiCalls.length
      : 0;

    const avgRender = renderTimes.length > 0
      ? renderTimes.reduce((sum, m) => sum + m.duration, 0) / renderTimes.length
      : 0;

    const slowestPage = pageLoads.length > 0
      ? pageLoads.reduce((max, m) => m.duration > max.duration ? m : max, pageLoads[0])
      : null;

    const slowestApi = apiCalls.length > 0
      ? apiCalls.reduce((max, m) => m.duration > max.duration ? m : max, apiCalls[0])
      : null;

    setStats({ avgPageLoad, avgApiCall, avgRender, slowestPage, slowestApi });
  };

  const getPerformanceLevel = (duration) => {
    if (duration < 100) return { level: 'excellent', color: 'text-green-400', label: 'Excelente' };
    if (duration < 300) return { level: 'good', color: 'text-cyan-400', label: 'Bom' };
    if (duration < 1000) return { level: 'fair', color: 'text-yellow-400', label: 'Regular' };
    return { level: 'poor', color: 'text-red-400', label: 'Lento' };
  };

  const clearMetrics = () => {
    performanceMetrics.pageLoads = [];
    performanceMetrics.apiCalls = [];
    performanceMetrics.renderTimes = [];
    setMetrics({ pageLoads: [], apiCalls: [], renderTimes: [] });
    setStats({
      avgPageLoad: 0,
      avgApiCall: 0,
      avgRender: 0,
      slowestPage: null,
      slowestApi: null
    });
  };

  // ✅ CORRIGIDO: Só mostrar para ADMIN
  if (isLoading) return null;
  if (!isAdmin) return null;

  return (
    <>
      {/* Botão flutuante */}
      <motion.div
        className="fixed bottom-24 right-6 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={() => setIsVisible(!isVisible)}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg"
          title="Monitor de Performance (Admin Only)"
        >
          <Activity className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Modal de métricas */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-40 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="glass-card border-cyan-700/50 shadow-2xl">
              <CardHeader className="border-b border-cyan-900/30 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Performance Monitor
                    <Badge className="bg-red-600 text-white text-[10px]">ADMIN</Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsVisible(false)}
                    className="h-6 w-6 text-purple-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-300">Páginas</span>
                    </div>
                    <p className={`text-lg font-bold ${getPerformanceLevel(stats.avgPageLoad).color}`}>
                      {stats.avgPageLoad.toFixed(0)}ms
                    </p>
                    <p className="text-[10px] text-green-400">{getPerformanceLevel(stats.avgPageLoad).label}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-blue-300">API Calls</span>
                    </div>
                    <p className={`text-lg font-bold ${getPerformanceLevel(stats.avgApiCall).color}`}>
                      {stats.avgApiCall.toFixed(0)}ms
                    </p>
                    <p className="text-[10px] text-blue-400">{getPerformanceLevel(stats.avgApiCall).label}</p>
                  </div>
                </div>

                {/* Slowest Operations */}
                {stats.slowestPage && (
                  <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-yellow-300 font-semibold">Mais Lento</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-white truncate">
                        📄 {stats.slowestPage.name}: 
                        <span className="text-yellow-400 font-bold ml-1">
                          {stats.slowestPage.duration.toFixed(0)}ms
                        </span>
                      </p>
                      {stats.slowestApi && (
                        <p className="text-white truncate">
                          🔌 {stats.slowestApi.name}: 
                          <span className="text-yellow-400 font-bold ml-1">
                            {stats.slowestApi.duration.toFixed(0)}ms
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Metrics */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-purple-300 font-semibold">Métricas Recentes</span>
                    <Badge className="bg-purple-600 text-white text-[10px]">
                      {metrics.pageLoads.length + metrics.apiCalls.length}
                    </Badge>
                  </div>

                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {[...metrics.pageLoads, ...metrics.apiCalls]
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .slice(0, 10)
                      .map((metric, idx) => {
                        const perf = getPerformanceLevel(metric.duration);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded bg-purple-900/20 hover:bg-purple-900/30 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {metric.type === 'page_load' ? (
                                <Clock className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                              ) : (
                                <Database className="w-3 h-3 text-blue-400 flex-shrink-0" />
                              )}
                              <span className="text-xs text-white truncate">{metric.name}</span>
                            </div>
                            <span className={`text-xs font-bold ${perf.color} flex-shrink-0`}>
                              {metric.duration.toFixed(0)}ms
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={clearMetrics}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-purple-700 text-purple-300 hover:bg-purple-900/30"
                  >
                    Limpar Dados
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('📊 Performance Metrics:', performanceMetrics);
                      console.log('📈 Stats:', stats);
                    }}
                    size="sm"
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  >
                    Log Console
                  </Button>
                </div>

                {/* Info */}
                <p className="text-[10px] text-purple-400 text-center">
                  🔒 Visível apenas para administradores
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}