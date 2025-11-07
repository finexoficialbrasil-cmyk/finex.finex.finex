import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Loader2 } from "lucide-react";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminUsers from "../components/admin/AdminUsers";
import AdminTutorials from "../components/admin/AdminTutorials";
import AdminCategories from "../components/admin/AdminCategories";
import AdminNotifications from "../components/admin/AdminNotifications";
import AdminSettings from "../components/admin/AdminSettings";
import AdminSubscriptions from "../components/admin/AdminSubscriptions";
import AdminPlans from "../components/admin/AdminPlans";
import AdminDatabaseCleanup from "../components/admin/AdminDatabaseCleanup";
import AdminAsaasSettings from "../components/admin/AdminAsaasSettings";
import AdminWebhookLogs from "../components/admin/AdminWebhookLogs";
import AdminAgentAudit from "../components/admin/AdminAgentAudit";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setIsAdmin(user?.role === "admin");
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
        <Card className="glass-card border-red-700/50 neon-glow">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
            <p className="text-purple-300">Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
              Painel Administrativo
            </h1>
            <p className="text-purple-300 mt-2">Gerenciamento completo do sistema</p>
          </div>
        </div>

        <Card className="glass-card border-0 neon-glow">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-purple-900/20 grid grid-cols-2 lg:grid-cols-5 gap-2">
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

              <TabsContent value="dashboard">
                <AdminDashboard />
              </TabsContent>

              <TabsContent value="users">
                <AdminUsers />
              </TabsContent>

              <TabsContent value="subscriptions">
                <AdminSubscriptions />
              </TabsContent>

              <TabsContent value="plans">
                <AdminPlans />
              </TabsContent>

              <TabsContent value="content">
                <div className="space-y-6">
                  <AdminTutorials />
                  <AdminCategories />
                  <AdminNotifications />
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <AdminSettings />
              </TabsContent>

              <TabsContent value="database">
                <AdminDatabaseCleanup />
              </TabsContent>

              <TabsContent value="payments">
                <AdminAsaasSettings />
              </TabsContent>

              <TabsContent value="webhooks">
                <AdminWebhookLogs />
              </TabsContent>

              <TabsContent value="audit">
                <AdminAgentAudit />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}