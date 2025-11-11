import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  Download, 
  Search, 
  Calendar, 
  DollarSign, 
  Crown,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminUserReport() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [editForm, setEditForm] = useState({
    subscription_plan: "",
    subscription_status: "",
    subscription_end_date: "",
    trial_ends_at: ""
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await User.list("-created_date", 500);
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      alert("Erro ao carregar usuários. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlan = (user) => {
    setSelectedUser(user);
    setEditForm({
      subscription_plan: user.subscription_plan || "",
      subscription_status: user.subscription_status || "pending",
      subscription_end_date: user.subscription_end_date || "",
      trial_ends_at: user.trial_ends_at || ""
    });
    setShowEditModal(true);
  };

  const handleSavePlan = async () => {
    if (!selectedUser) return;
    
    setIsUpdating(true);
    try {
      console.log("════════════════════════════════════════");
      console.log("✏️ ADMIN EDITANDO PLANO DO USUÁRIO");
      console.log("════════════════════════════════════════");
      console.log("👤 Usuário:", selectedUser.email);
      console.log("📊 Plano anterior:", selectedUser.subscription_plan);
      console.log("📊 Plano novo:", editForm.subscription_plan);
      console.log("📅 Status:", editForm.subscription_status);
      console.log("📅 Vencimento:", editForm.subscription_end_date);
      
      const updateData = {
        subscription_plan: editForm.subscription_plan || null,
        subscription_status: editForm.subscription_status || "pending",
        subscription_end_date: editForm.subscription_end_date || null,
        trial_ends_at: editForm.trial_ends_at || null
      };
      
      // ✅ Se não tem plano, limpar também o trial
      if (!editForm.subscription_plan) {
        updateData.trial_ends_at = null;
        updateData.trial_started_at = null;
      }
      
      await User.update(selectedUser.id, updateData);
      
      console.log("✅ Plano atualizado com sucesso!");
      console.log("════════════════════════════════════════");
      
      alert(`✅ Plano de ${selectedUser.full_name} atualizado com sucesso!`);
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers(); // Recarregar lista
    } catch (error) {
      console.error("❌ Erro ao atualizar plano:", error);
      alert(`❌ Erro ao atualizar plano: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const exportToPDF = () => {
    const doc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Usuários - FINEX</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #8b5cf6; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #8b5cf6; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-card { text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #8b5cf6; }
        </style>
      </head>
      <body>
        <h1>📊 Relatório de Usuários - FINEX</h1>
        <p style="text-align: center; color: #666;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div>Total de Usuários</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.active}</div>
            <div>Ativos (Pagos)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.trial}</div>
            <div>Em Trial</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.free}</div>
            <div>Gratuitos</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Vencimento</th>
              <th>Cadastro</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.map(user => `
              <tr>
                <td>${user.full_name || '-'}</td>
                <td>${user.email}</td>
                <td>${formatPlan(user.subscription_plan)}</td>
                <td>${formatStatus(user.subscription_status)}</td>
                <td>${user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString('pt-BR') : '-'}</td>
                <td>${new Date(user.created_date).toLocaleDateString('pt-BR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
          FINEX - Sistema de Inteligência Financeira | Relatório gerado automaticamente
        </p>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(doc);
    printWindow.document.close();
    printWindow.print();
  };

  const formatPlan = (plan) => {
    if (!plan) return "Sem plano";
    const plans = {
      monthly: "Mensal",
      semester: "Semestral",
      annual: "Anual",
      lifetime: "Vitalício",
      free: "Gratuito"
    };
    return plans[plan] || plan;
  };

  const formatStatus = (status) => {
    if (!status) return "Pendente";
    const statuses = {
      active: "Ativo",
      pending: "Pendente",
      trial: "Trial",
      expired: "Expirado"
    };
    return statuses[status] || status;
  };

  const getStatusBadge = (user) => {
    if (user.role === 'admin') {
      return <Badge className="bg-red-600">👑 Admin</Badge>;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Trial
    if (user.subscription_status === 'trial' && user.trial_ends_at) {
      const [year, month, day] = user.trial_ends_at.split('-').map(Number);
      const trialEnd = new Date(year, month - 1, day);
      const isActive = trialEnd >= today;
      
      if (isActive) {
        const daysLeft = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));
        return <Badge className="bg-yellow-600">🎁 Trial ({daysLeft}d)</Badge>;
      } else {
        return <Badge className="bg-red-600">⏰ Trial Expirado</Badge>;
      }
    }
    
    // Pago
    if (user.subscription_status === 'active' && user.subscription_end_date) {
      const [year, month, day] = user.subscription_end_date.split('-').map(Number);
      const endDate = new Date(year, month - 1, day);
      const isActive = endDate >= today;
      
      if (isActive) {
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return <Badge className="bg-green-600">✅ Ativo ({daysLeft}d)</Badge>;
      } else {
        return <Badge className="bg-red-600">⏰ Expirado</Badge>;
      }
    }
    
    return <Badge className="bg-gray-600">⏳ Pendente</Badge>;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" || 
      user.subscription_status === filterStatus ||
      (filterStatus === "admin" && user.role === "admin");
    
    const matchesPlan = 
      filterPlan === "all" || 
      user.subscription_plan === filterPlan ||
      (filterPlan === "none" && !user.subscription_plan);
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.subscription_status === 'active').length,
    trial: users.filter(u => u.subscription_status === 'trial').length,
    free: users.filter(u => !u.subscription_plan || u.subscription_plan === 'free').length,
    admins: users.filter(u => u.role === 'admin').length
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-purple-300">Carregando relatório...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-300 text-sm">Total</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-300 text-sm">Ativos (Pagos)</p>
                <p className="text-3xl font-bold text-white">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-yellow-300 text-sm">Trial</p>
                <p className="text-3xl font-bold text-white">{stats.trial}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-300 text-sm">Gratuitos</p>
                <p className="text-3xl font-bold text-white">{stats.free}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-300 text-sm">Admins</p>
                <p className="text-3xl font-bold text-white">{stats.admins}</p>
              </div>
              <Crown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-purple-900/20 border-purple-700/50 text-white"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 bg-purple-900/20 border-purple-700/50 text-white">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">✅ Ativos</SelectItem>
                <SelectItem value="trial">🎁 Trial</SelectItem>
                <SelectItem value="pending">⏳ Pendentes</SelectItem>
                <SelectItem value="admin">👑 Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-full md:w-48 bg-purple-900/20 border-purple-700/50 text-white">
                <SelectValue placeholder="Todos os Planos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="semester">Semestral</SelectItem>
                <SelectItem value="annual">Anual</SelectItem>
                <SelectItem value="lifetime">Vitalício</SelectItem>
                <SelectItem value="none">Sem Plano</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={exportToPDF}
              className="bg-gradient-to-r from-cyan-600 to-blue-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white">
            Usuários Filtrados ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex flex-col gap-3 p-4 rounded-xl glass-card hover:bg-purple-900/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold">{user.full_name || "Sem nome"}</p>
                      {getStatusBadge(user)}
                    </div>
                    <p className="text-purple-300 text-sm mt-1">{user.email}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.subscription_plan && (
                        <Badge className="bg-purple-600/20 text-purple-400">
                          📋 {formatPlan(user.subscription_plan)}
                        </Badge>
                      )}
                      
                      {user.subscription_end_date && (
                        <Badge className="bg-cyan-600/20 text-cyan-400">
                          📅 Vence: {new Date(user.subscription_end_date).toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                      
                      {user.trial_ends_at && (
                        <Badge className="bg-yellow-600/20 text-yellow-400">
                          🎁 Trial até: {new Date(user.trial_ends_at).toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-purple-400 text-xs mt-2">
                      Cadastrado em: {new Date(user.created_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {user.role !== 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPlan(user)}
                      className="border-purple-700 text-purple-300 hover:bg-purple-900/20"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar Plano
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Plan Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ✏️ Editar Plano do Usuário
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                <p className="text-white font-bold text-lg">{selectedUser.full_name}</p>
                <p className="text-purple-300 text-sm">{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(selectedUser)}
                  {selectedUser.subscription_plan && (
                    <Badge className="bg-purple-600/20 text-purple-400">
                      📋 {formatPlan(selectedUser.subscription_plan)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <div>
                  <Label className="text-purple-200">Plano</Label>
                  <Select 
                    value={editForm.subscription_plan} 
                    onValueChange={(value) => setEditForm({...editForm, subscription_plan: value})}
                  >
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-1">
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>🚫 Sem Plano</SelectItem>
                      <SelectItem value="monthly">📅 Mensal</SelectItem>
                      <SelectItem value="semester">📆 Semestral</SelectItem>
                      <SelectItem value="annual">🗓️ Anual</SelectItem>
                      <SelectItem value="lifetime">👑 Vitalício</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-purple-200">Status</Label>
                  <Select 
                    value={editForm.subscription_status} 
                    onValueChange={(value) => setEditForm({...editForm, subscription_status: value})}
                  >
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">⏳ Pendente</SelectItem>
                      <SelectItem value="active">✅ Ativo</SelectItem>
                      <SelectItem value="trial">🎁 Trial</SelectItem>
                      <SelectItem value="expired">⏰ Expirado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-purple-200">Data de Vencimento (Assinatura)</Label>
                  <Input
                    type="date"
                    value={editForm.subscription_end_date}
                    onChange={(e) => setEditForm({...editForm, subscription_end_date: e.target.value})}
                    className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                  />
                  <p className="text-purple-400 text-xs mt-1">
                    Para planos pagos (Mensal, Semestral, Anual, Vitalício)
                  </p>
                </div>

                <div>
                  <Label className="text-purple-200">Data de Término do Trial</Label>
                  <Input
                    type="date"
                    value={editForm.trial_ends_at}
                    onChange={(e) => setEditForm({...editForm, trial_ends_at: e.target.value})}
                    className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                  />
                  <p className="text-purple-400 text-xs mt-1">
                    Para status "Trial" (3 dias gratuitos)
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/30">
                <p className="text-yellow-300 text-sm flex items-start gap-2">
                  <span>⚠️</span>
                  <span>
                    <strong>ATENÇÃO:</strong> Esta alteração afetará imediatamente o acesso do usuário ao sistema.
                    {editForm.subscription_plan === 'lifetime' && (
                      <><br/><br/><strong>🔒 Plano Vitalício:</strong> Defina uma data de vencimento distante (ex: 100 anos) para simular acesso vitalício.</>
                    )}
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                  className="flex-1 border-purple-700 text-purple-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSavePlan}
                  disabled={isUpdating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}