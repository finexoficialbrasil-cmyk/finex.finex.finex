import React, { useState, useEffect } from "react";
import { AgentAuditLog } from "@/entities/AgentAuditLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Search, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function AgentAuditViewer() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const logsData = await AgentAuditLog.list("-created_date", 100);
      console.log(`✅ Audit logs carregados: ${logsData.length}`);
      setLogs(logsData);
    } catch (error) {
      console.error("Erro ao carregar logs de auditoria:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesStatus = filterStatus === "all" || log.operation_status === filterStatus;
    const matchesSearch = !searchTerm || 
      log.user_prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_data?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: logs.length,
    attempted: logs.filter(l => l.operation_status === "attempted").length,
    success: logs.filter(l => l.operation_status === "success").length,
    verified: logs.filter(l => l.operation_status === "verified").length,
    failed: logs.filter(l => l.operation_status === "failed").length
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "verified": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "success": return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case "attempted": return <Clock className="w-4 h-4 text-yellow-400" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "verified": return "bg-green-600/20 text-green-400 border-green-600/40";
      case "success": return "bg-blue-600/20 text-blue-400 border-blue-600/40";
      case "attempted": return "bg-yellow-600/20 text-yellow-400 border-yellow-600/40";
      case "failed": return "bg-red-600/20 text-red-400 border-red-600/40";
      default: return "bg-gray-600/20 text-gray-400 border-gray-600/40";
    }
  };

  if (isLoading) {
    return <div className="text-purple-300 text-center py-12">Carregando auditoria...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            Auditoria do Agente IA
          </h3>
          <p className="text-purple-300 text-sm mt-1">
            Rastreamento completo de todas as operações do consultor financeiro
          </p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glass-card border-purple-700/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-purple-300">Total</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-yellow-700/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.attempted}</p>
            <p className="text-xs text-purple-300">Tentadas</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-blue-700/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.success}</p>
            <p className="text-xs text-purple-300">Sucesso</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-green-700/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.verified}</p>
            <p className="text-xs text-purple-300">Verificadas</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-red-700/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
            <p className="text-xs text-purple-300">Falharam</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
          <Input
            placeholder="Buscar por descrição ou dados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-purple-900/20 border-purple-700/50 text-white"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[200px] bg-purple-900/20 border-purple-700/50 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="attempted">Tentadas</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="verified">Verificadas</SelectItem>
            <SelectItem value="failed">Falharam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Card className="glass-card border-0 hover:border-purple-700/50 transition-all">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(log.operation_status)}
                        <Badge className={getStatusColor(log.operation_status)}>
                          {log.operation_status}
                        </Badge>
                        <Badge className="bg-purple-600/20 text-purple-400">
                          {log.operation_type}
                        </Badge>
                        {log.entity_type && (
                          <Badge variant="outline" className="text-cyan-400 border-cyan-600/40">
                            {log.entity_type}
                          </Badge>
                        )}
                      </div>
                      
                      {/* User Prompt */}
                      {log.user_prompt && (
                        <p className="text-white font-medium mb-1">
                          💬 "{log.user_prompt}"
                        </p>
                      )}
                      
                      {/* Entity Data */}
                      {log.entity_data && (
                        <div className="bg-purple-900/20 rounded p-2 text-xs text-purple-300 mt-2">
                          <pre className="whitespace-pre-wrap break-all">
                            {JSON.stringify(JSON.parse(log.entity_data), null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {/* Entity ID */}
                      {log.entity_id && (
                        <p className="text-sm text-cyan-400 mt-2">
                          🆔 ID: {log.entity_id}
                        </p>
                      )}
                      
                      {/* Error */}
                      {log.error_message && (
                        <p className="text-sm text-red-400 mt-2 bg-red-900/20 rounded p-2">
                          ❌ Erro: {log.error_message}
                        </p>
                      )}
                      
                      {/* Verification */}
                      {log.verification_result && (
                        <p className="text-sm text-green-400 mt-2">
                          ✅ Verificação: {log.verification_result}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-purple-400">
                        {new Date(log.created_date).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-purple-500 mt-1">
                        {log.created_by}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
            <p className="text-purple-300">Nenhum log encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}