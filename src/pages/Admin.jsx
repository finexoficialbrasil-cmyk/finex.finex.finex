import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Shield, Users, Crown, Video, Tags, Bell, Settings, Database, DollarSign, Smartphone, Zap, FileText, Loader2, Mail } from "lucide-react";

// ✅ Lazy loading dos componentes admin
const AdminDashboard = React.lazy(() => import("../components/admin/AdminDashboard"));
const AdminUsers = React.lazy(() => import("../components/admin/AdminUsers"));
const AdminPlans = React.lazy(() => import("../components/admin/AdminPlans"));
const AdminTutorials = React.lazy(() => import("../components/admin/AdminTutorials"));
const AdminCategories = React.lazy(() => import("../components/admin/AdminCategories"));
const AdminNotifications = React.lazy(() => import("../components/admin/AdminNotifications"));
const AdminSettings = React.lazy(() => import("../components/admin/AdminSettings"));
const AdminSubscriptions = React.lazy(() => import("../components/admin/AdminSubscriptions"));
const AdminDatabaseCleanup = React.lazy(() => import("../components/admin/AdminDatabaseCleanup"));
const AdminAsaasSettings = React.lazy(() => import("../components/admin/AdminAsaasSettings"));
const AdminMobileApp = React.lazy(() => import("../components/admin/AdminMobileApp"));
const AdminWebhookLogs = React.lazy(() => import("../components/admin/AdminWebhookLogs"));
const AdminBackup = React.lazy(() => import("../components/admin/AdminBackup"));
const AdminUserReport = React.lazy(() => import("../components/admin/AdminUserReport"));
const AdminBilling = React.lazy(() => import("../components/admin/AdminBilling")); // ✅ NOVO

// ✅ Loading fallback
const TabLoading = () => (
  <div className="flex items-center justify-center py-12">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      <p className="text-purple-300 text-sm">Carregando...</p>
    </div>
  </div>
);

export default function Admin() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isFixingSubscriptions, setIsFixingSubscriptions] = useState(false);

  React.useEffect(() => {
    checkAdmin();
    document.title = "Painel Admin - FINEX";
  }, []);

  const checkAdmin = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') {
        window.location.href = '/Dashboard';
        return;
      }
      setUser(userData);
    } catch (error) {
      console.error("Erro ao verificar admin:", error);
      window.location.href = '/Dashboard';
    }
  };

  const handleDownloadChecklist = async () => {
    try {
      const response = await base44.functions.invoke('generateChecklistPDF');
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FINEX_Checklist_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Erro ao baixar checklist:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const handleFixSubscriptions = async () => {
    if (!confirm("🔧 CORRIGIR STATUS DE ASSINATURAS\n\nEsta ação irá:\n\n1. Verificar TODOS os usuários do sistema\n2. Recalcular se a assinatura está ativa baseado na data de vencimento\n3. Atualizar o status automaticamente\n\n⚠️ Esta operação é segura e reversível.\n\nDeseja continuar?")) {
      return;
    }

    setIsFixingSubscriptions(true);

    try {
      console.log("🔧 Chamando função fixUserSubscriptions...");
      
      const response = await base44.functions.invoke('fixUserSubscriptions', {});
      
      console.log("✅ Resposta recebida:", response.data);

      if (response.data.success) {
        const stats = response.data.stats;
        
        let message = `✅ CORREÇÃO CONCLUÍDA!\n\n📊 Resultado:\n\n✔️ ${stats.fixed} usuários ATIVADOS\n⏰ ${stats.expired} usuários EXPIRADOS\n✅ ${stats.alreadyCorrect} já estavam corretos\n\n📋 Total processado: ${stats.total} usuários`;
        
        if (stats.errors > 0) {
          message += `\n\n⚠️ ${stats.errors} erros encontrados`;
        }
        
        message += '\n\n🔄 Peça aos usuários para recarregar a página (Ctrl + F5).';
        
        alert(message);
      } else {
        throw new Error(response.data.error || "Erro desconhecido");
      }
    } catch (error) {
      console.error("❌ Erro completo:", error);
      console.error("❌ Response:", error.response);
      
      alert(`❌ Erro ao corrigir assinaturas:\n\n${error.message}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setIsFixingSubscriptions(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-purple-300">Verificando permissões...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 mb-4">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-2" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
          </div>
          <p className="text-purple-300 text-lg">
            Gerencie usuários, planos, configurações e integrações do sistema
          </p>
        </div>

        {/* ✅ Botões de Ação Rápida */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleDownloadChecklist}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            📥 Download Checklist PDF
          </Button>

          <Button
            onClick={handleFixSubscriptions}
            disabled={isFixingSubscriptions}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isFixingSubscriptions ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Corrigindo...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                🔧 Corrigir Status de Assinaturas
              </>
            )}
          </Button>
        </div>

        <Card className="glass-card border-0 neon-glow">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-purple-900/20 w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-2 p-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden md:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden md:inline">Relatório</span>
              </TabsTrigger>
              <TabsTrigger value="plans" className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <span className="hidden md:inline">Planos</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden md:inline">Assinaturas</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="hidden md:inline">Cobranças</span>
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="hidden md:inline">Backup</span>
              </TabsTrigger>
              <TabsTrigger value="tutorials" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span className="hidden md:inline">Tutoriais</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Tags className="w-4 h-4" />
                <span className="hidden md:inline">Categorias</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden md:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Config</span>
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <React.Suspense fallback={<TabLoading />}>
                <TabsContent value="dashboard">
                  <AdminDashboard />
                </TabsContent>
                <TabsContent value="users">
                  <AdminUsers />
                </TabsContent>
                <TabsContent value="report">
                  <AdminUserReport />
                </TabsContent>
                <TabsContent value="plans">
                  <AdminPlans />
                </TabsContent>
                <TabsContent value="subscriptions">
                  <AdminSubscriptions />
                </TabsContent>
                <TabsContent value="billing">
                  <AdminBilling />
                </TabsContent>
                <TabsContent value="backup">
                  <AdminBackup />
                </TabsContent>
                <TabsContent value="tutorials">
                  <AdminTutorials />
                </TabsContent>
                <TabsContent value="categories">
                  <AdminCategories />
                </TabsContent>
                <TabsContent value="notifications">
                  <AdminNotifications />
                </TabsContent>
                <TabsContent value="settings">
                  <Tabs defaultValue="branding">
                    <TabsList className="bg-purple-900/20 mb-6 w-full grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-2 p-2">
                      <TabsTrigger value="branding" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span className="hidden md:inline">Branding</span>
                      </TabsTrigger>
                      <TabsTrigger value="payments" className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="hidden md:inline">Pagamentos</span>
                      </TabsTrigger>
                      <TabsTrigger value="webhooks" className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="hidden md:inline">Webhooks</span>
                      </TabsTrigger>
                      <TabsTrigger value="mobile" className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        <span className="hidden md:inline">App Mobile</span>
                      </TabsTrigger>
                      <TabsTrigger value="cleanup" className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        <span className="hidden md:inline">Limpeza</span>
                      </TabsTrigger>
                    </TabsList>

                    <div className="p-6">
                      <React.Suspense fallback={<TabLoading />}>
                        <TabsContent value="branding">
                          <AdminSettings />
                        </TabsContent>
                        <TabsContent value="payments">
                          <AdminAsaasSettings />
                        </TabsContent>
                        <TabsContent value="webhooks">
                          <AdminWebhookLogs />
                        </TabsContent>
                        <TabsContent value="mobile">
                          <AdminMobileApp />
                        </TabsContent>
                        <TabsContent value="cleanup">
                          <AdminDatabaseCleanup />
                        </TabsContent>
                      </React.Suspense>
                    </div>
                  </Tabs>
                </TabsContent>
              </React.Suspense>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}