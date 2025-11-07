
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card"; // Added CardContent
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button"; // Button is still needed for other purposes, though not for checklist.
import { Shield, Users, Crown, Video, Tags, Bell, Settings, Database, DollarSign, Smartphone, Zap, FileText, Loader2 } from "lucide-react";

// ✅ Lazy loading dos componentes admin
const AdminDashboard = React.lazy(() => import("../components/admin/AdminDashboard"));
const AdminUsers = React.lazy(() => import("../components/admin/AdminUsers"));
const AdminPlans = React.lazy(() => import("../components/admin/AdminPlans"));
const AdminSubscriptions = React.lazy(() => import("../components/admin/AdminSubscriptions"));
const AdminSettings = React.lazy(() => import("../components/admin/AdminSettings")); // Now directly under top-level 'settings'
const AdminDatabaseCleanup = React.lazy(() => import("../components/admin/AdminDatabaseCleanup")); // Now under top-level 'database'
const AdminAsaasSettings = React.lazy(() => import("../components/admin/AdminAsaasSettings")); // Now under top-level 'payments'
const AdminWebhookLogs = React.lazy(() => import("../components/admin/AdminWebhookLogs")); // Now under top-level 'webhooks'
const AdminBackup = React.lazy(() => import("../components/admin/AdminBackup")); // Now under top-level 'database'

// New component for audit
const AgentAuditViewer = React.lazy(() => import("../components/admin/AgentAuditViewer"));

// ✅ Loading fallback
const TabLoading = () => (
  <div className="flex items-center justify-center py-12">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      <p className="text-purple-300 text-sm">Carregando...</p>
    </div>
  </div>
);

export default function AdminPage() { // Changed component name
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

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

  // handleDownloadChecklist function and its button are removed as per outline

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-purple-300">Verificando permissões...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6"> {/* Changed space-y-8 to space-y-6 */}
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

        <Card className="glass-card border-0 neon-glow">
          <CardContent className="p-6"> {/* Added CardContent wrapper */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-purple-900/20 w-full grid grid-cols-2 lg:grid-cols-5 gap-2 p-2"> {/* Updated TabsList class and structure */}
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="users">Usuários</TabsTrigger>
                <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
                <TabsTrigger value="plans">Planos</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
                <TabsTrigger value="database">Banco de Dados</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                <TabsTrigger value="audit">🆕 Auditoria IA</TabsTrigger>
              </TabsList>

              <div className="p-6">
                <React.Suspense fallback={<TabLoading />}>
                  <TabsContent value="dashboard">
                    <AdminDashboard />
                  </TabsContent>
                  <TabsContent value="users">
                    <AdminUsers />
                  </TabsContent>
                  {/* Removed TabsContent for "report" */}
                  <TabsContent value="plans">
                    <AdminPlans />
                  </TabsContent>
                  <TabsContent value="subscriptions">
                    <AdminSubscriptions />
                  </TabsContent>
                  {/* Tabs for content (tutorials, categories, notifications) */}
                  <TabsContent value="content">
                    {/* Content for 'Conteúdo' tab - This would ideally have a nested tab structure or grouped components */}
                    <div className="text-purple-300 text-center py-8">
                      Conteúdo em desenvolvimento...
                    </div>
                  </TabsContent>
                  <TabsContent value="settings">
                    <AdminSettings /> {/* 'Branding' from old settings */}
                  </TabsContent>
                  <TabsContent value="database">
                    <AdminDatabaseCleanup />
                    <AdminBackup className="mt-8" /> {/* Added AdminBackup here */}
                  </TabsContent>
                  <TabsContent value="payments">
                    <AdminAsaasSettings />
                  </TabsContent>
                  <TabsContent value="webhooks">
                    <AdminWebhookLogs />
                  </TabsContent>
                  <TabsContent value="audit"> {/* New TabsContent for audit */}
                    <AgentAuditViewer />
                  </TabsContent>
                </React.Suspense>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
