import React, { useState, useEffect } from "react";
import { WebhookLog } from "@/entities/WebhookLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminWebhookLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // ✅ OTIMIZADO: Carregar apenas últimos 50 logs
      const logsData = await WebhookLog.list("-created_date", 50);
      console.log(`✅ Webhook logs carregados: ${logsData.length}`);
      setLogs(logsData);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-purple-300 text-center py-12">Carregando logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Logs de Webhooks</h3>
          <p className="text-purple-300 text-sm">Últimos 50 eventos recebidos</p>
        </div>
        <Button
          onClick={loadLogs}
          variant="outline"
          className="border-purple-700 text-purple-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="space-y-3">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Card className="glass-card border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={
                        log.status === "processed" ? "bg-green-600" :
                        log.status === "received" ? "bg-blue-600" :
                        "bg-red-600"
                      }>
                        {log.status === "processed" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {log.status === "received" && <Clock className="w-3 h-3 mr-1" />}
                        {log.status === "error" && <XCircle className="w-3 h-3 mr-1" />}
                        {log.status}
                      </Badge>
                      <span className="text-white font-medium">{log.event_type}</span>
                    </div>
                    <p className="text-purple-300 text-sm">
                      ID: {log.payment_id || "N/A"}
                    </p>
                    {log.error_message && (
                      <p className="text-red-400 text-xs mt-2">{log.error_message}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-purple-400">
                      {new Date(log.created_date).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {logs.length === 0 && (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Zap className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <p className="text-purple-300">Nenhum webhook recebido ainda</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}