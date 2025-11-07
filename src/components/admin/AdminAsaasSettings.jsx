import React, { useState, useEffect } from "react";
import { SystemSettings } from "@/entities/SystemSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  Zap,
  Copy,
  Shield,
  CheckCircle,
  Loader2,
  Link as LinkIcon,
  AlertTriangle,
  RefreshCw,
  Info,
  CreditCard,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminAsaasSettings() {
  const [asaasApiKey, setAsaasApiKey] = useState("");
  const [webhookToken, setWebhookToken] = useState("");
  const [paymentMode, setPaymentMode] = useState("manual"); // ✅ NOVO: modo de pagamento
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [appId, setAppId] = useState("");
  const [isActivatingSubscriptions, setIsActivatingSubscriptions] = useState(false);
  const [activationStatus, setActivationStatus] = useState("");

  useEffect(() => {
    loadSettings();
    detectAppId();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await SystemSettings.list();
      
      const apiKeySetting = settings.find(s => s.key === "asaas_api_key");
      const webhookTokenSetting = settings.find(s => s.key === "asaas_webhook_token");
      const paymentModeSetting = settings.find(s => s.key === "payment_mode"); // ✅ NOVO
      
      if (apiKeySetting) setAsaasApiKey(apiKeySetting.value);
      if (webhookTokenSetting) setWebhookToken(webhookTokenSetting.value);
      if (paymentModeSetting) setPaymentMode(paymentModeSetting.value); // ✅ NOVO
      
      console.log("✅ Configurações Asaas carregadas");
      console.log("🔧 Modo de pagamento:", paymentModeSetting?.value || "manual");
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const detectAppId = () => {
    const hostname = window.location.hostname;
    const match = hostname.match(/^([a-zA-Z0-9]+)\.base44\.app$/);
    const id = match ? match[1] : "finex";
    setAppId(id);
    console.log("🔍 App ID detectado:", id);
  };

  const getAsaasEnvironment = () => {
    if (!asaasApiKey) return null;
    
    if (asaasApiKey.includes('_prod_') || asaasApiKey.startsWith('$aact_YTU5YTE0M')) {
      return {
        name: "🟢 PRODUÇÃO (REAL)",
        color: "green",
        description: "Pagamentos REAIS serão processados"
      };
    } else {
      return {
        name: "🟡 SANDBOX (TESTE)",
        color: "yellow",
        description: "Ambiente de testes - pagamentos simulados"
      };
    }
  };

  const handleSave = async () => {
    if (!asaasApiKey.trim()) {
      alert("❌ Por favor, insira a chave da API Asaas!");
      return;
    }

    setIsSaving(true);
    try {
      const settings = await SystemSettings.list();
      
      // Salvar API Key
      const apiKeySetting = settings.find(s => s.key === "asaas_api_key");
      if (apiKeySetting) {
        await SystemSettings.update(apiKeySetting.id, {
          key: "asaas_api_key",
          value: asaasApiKey.trim(),
          description: "Chave da API Asaas",
          category: "payments"
        });
      } else {
        await SystemSettings.create({
          key: "asaas_api_key",
          value: asaasApiKey.trim(),
          description: "Chave da API Asaas",
          category: "payments"
        });
      }

      // Gerar token se não existir
      let tokenToSave = webhookToken;
      if (!tokenToSave) {
        tokenToSave = crypto.randomUUID();
        setWebhookToken(tokenToSave);
      }

      // Salvar Webhook Token
      const webhookTokenSetting = settings.find(s => s.key === "asaas_webhook_token");
      if (webhookTokenSetting) {
        await SystemSettings.update(webhookTokenSetting.id, {
          key: "asaas_webhook_token",
          value: tokenToSave,
          description: "Token de segurança do webhook Asaas",
          category: "payments"
        });
      } else {
        await SystemSettings.create({
          key: "asaas_webhook_token",
          value: tokenToSave,
          description: "Token de segurança do webhook Asaas",
          category: "payments"
        });
      }

      // ✅ NOVO: Salvar modo de pagamento
      const paymentModeSetting = settings.find(s => s.key === "payment_mode");
      if (paymentModeSetting) {
        await SystemSettings.update(paymentModeSetting.id, {
          key: "payment_mode",
          value: paymentMode,
          description: "Modo de pagamento (automatic ou manual)",
          category: "payments"
        });
      } else {
        await SystemSettings.create({
          key: "payment_mode",
          value: paymentMode,
          description: "Modo de pagamento (automatic ou manual)",
          category: "payments"
        });
      }

      alert("✅ Configurações salvas com sucesso!");
      loadSettings();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("❌ Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivatePendingAsaasSubscriptions = async () => {
    if (!confirm("🔄 Ativar assinaturas pendentes do Asaas?\n\nIsso irá processar todas as assinaturas com status 'pending' que têm transaction_id do Asaas.")) {
      return;
    }

    setIsActivatingSubscriptions(true);
    setActivationStatus("Processando...");

    try {
      const { activatePendingSubscriptions } = await import("@/functions/activatePendingSubscriptions");
      const response = await activatePendingSubscriptions({});

      if (response.data.success) {
        const msg = `✅ ${response.data.activated} assinatura(s) ativada(s)\n⏭️ ${response.data.skipped} ignorada(s)`;
        setActivationStatus(msg);
        alert(msg);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error("Erro:", error);
      setActivationStatus(`❌ Erro: ${error.message}`);
      alert("❌ Erro ao ativar assinaturas.");
    } finally {
      setIsActivatingSubscriptions(false);
    }
  };

  const webhookUrl = appId ? `https://${appId}.base44.app/api/functions/asaasWebhook?token=${webhookToken}` : "";

  const environment = getAsaasEnvironment();

  if (isLoading) {
    return <div className="text-purple-300">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ✅ NOVO: Seletor de Modo de Pagamento */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Modo de Pagamento PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-purple-200 font-bold mb-3 block">
              Selecione como deseja receber pagamentos:
            </Label>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Modo Automático */}
              <button
                type="button"
                onClick={() => setPaymentMode("automatic")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  paymentMode === "automatic"
                    ? 'bg-green-600/20 border-green-500'
                    : 'bg-purple-900/20 border-purple-700/50 hover:border-purple-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-3 rounded-full ${
                    paymentMode === "automatic" ? 'bg-green-600/30' : 'bg-purple-600/20'
                  }`}>
                    <Zap className={`w-6 h-6 ${
                      paymentMode === "automatic" ? 'text-green-400' : 'text-purple-400'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-bold text-lg">⚡ Automático</h3>
                    <p className="text-purple-300 text-xs">Com Asaas API</p>
                  </div>
                  {paymentMode === "automatic" && (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                </div>
                <ul className="text-left text-purple-200 text-sm space-y-1">
                  <li>✅ QR Code gerado automaticamente</li>
                  <li>✅ Confirmação em tempo real</li>
                  <li>✅ Webhook automático</li>
                  <li>✅ Sem aprovação manual</li>
                </ul>
              </button>

              {/* Modo Manual */}
              <button
                type="button"
                onClick={() => setPaymentMode("manual")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  paymentMode === "manual"
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'bg-purple-900/20 border-purple-700/50 hover:border-purple-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-3 rounded-full ${
                    paymentMode === "manual" ? 'bg-blue-600/30' : 'bg-purple-600/20'
                  }`}>
                    <CreditCard className={`w-6 h-6 ${
                      paymentMode === "manual" ? 'text-blue-400' : 'text-purple-400'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-bold text-lg">📝 Manual</h3>
                    <p className="text-purple-300 text-xs">Sua chave PIX</p>
                  </div>
                  {paymentMode === "manual" && (
                    <CheckCircle className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <ul className="text-left text-purple-200 text-sm space-y-1">
                  <li>📤 Cliente envia comprovante</li>
                  <li>👁️ Admin aprova manualmente</li>
                  <li>🔧 Mais controle</li>
                  <li>💰 Sem taxas de API</li>
                </ul>
              </button>
            </div>

            {/* Status Atual */}
            <div className={`mt-4 p-4 rounded-lg border-2 ${
              paymentMode === "automatic" 
                ? 'bg-green-900/20 border-green-700/50' 
                : 'bg-blue-900/20 border-blue-700/50'
            }`}>
              <p className="text-white font-bold">
                {paymentMode === "automatic" ? "⚡ Modo Automático Selecionado" : "📝 Modo Manual Selecionado"}
              </p>
              <p className="text-purple-300 text-sm mt-1">
                {paymentMode === "automatic" 
                  ? "QR Codes serão gerados automaticamente via Asaas" 
                  : "Clientes verão sua chave PIX e enviarão comprovante"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ambiente Asaas */}
      {environment && (
        <Alert className={`border-2 ${
          environment.color === 'green' 
            ? 'bg-green-900/20 border-green-700/50' 
            : 'bg-yellow-900/20 border-yellow-700/50'
        }`}>
          <Shield className={`h-5 w-5 ${
            environment.color === 'green' ? 'text-green-400' : 'text-yellow-400'
          }`} />
          <AlertDescription className={
            environment.color === 'green' ? 'text-green-200' : 'text-yellow-200'
          }>
            <p className="font-bold mb-1">{environment.name}</p>
            <p className="text-sm">{environment.description}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Configuração do Webhook (apenas se automático) */}
      {paymentMode === "automatic" && (
        <Card className="glass-card border-0 neon-glow">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-cyan-400" />
              Configuração do Webhook Asaas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-purple-200 font-bold mb-2 block">
                URL do Webhook
              </Label>
              <div className="flex gap-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="flex-1 bg-purple-900/20 border-purple-700/50 text-purple-300 font-mono text-xs"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    alert("✅ URL copiada!");
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-cyan-900/20 p-4 rounded-lg border border-cyan-700/30">
              <h4 className="text-cyan-300 font-bold mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Como Configurar no Asaas
              </h4>
              <ol className="text-cyan-200 text-sm space-y-2 list-decimal list-inside">
                <li>Acesse o <strong>painel Asaas</strong></li>
                <li>Vá em <strong>Configurações → Webhooks</strong></li>
                <li>Clique em <strong>"Adicionar Webhook"</strong></li>
                <li>Cole a URL acima no campo <strong>"URL de Callback"</strong></li>
                <li>Marque os eventos: <strong>PAYMENT_CONFIRMED</strong> e <strong>PAYMENT_RECEIVED</strong></li>
                <li>Salve e teste o webhook</li>
              </ol>
            </div>

            <div>
              <Label className="text-purple-200 font-bold mb-2 block">
                Token de Segurança
              </Label>
              <div className="flex gap-2">
                <Input
                  value={webhookToken}
                  readOnly
                  className="flex-1 bg-purple-900/20 border-purple-700/50 text-white font-mono text-sm"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(webhookToken);
                    alert("✅ Token copiado!");
                  }}
                  className="bg-purple-600"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-purple-400 text-xs mt-1">
                Este token valida que o webhook vem do Asaas
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ativação Manual (apenas se automático) */}
      {paymentMode === "automatic" && (
        <Card className="glass-card border-0 border-l-4 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-yellow-600/20">
                <RefreshCw className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2">
                  Ativar Assinaturas Pendentes Manualmente
                </h3>
                <p className="text-purple-300 text-sm mb-3">
                  Se algum pagamento foi confirmado mas não ativou automaticamente, use este botão.
                </p>
                <Button
                  onClick={handleActivatePendingAsaasSubscriptions}
                  disabled={isActivatingSubscriptions}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600"
                >
                  {isActivatingSubscriptions ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Processar Pagamentos Pendentes
                    </>
                  )}
                </Button>
                {activationStatus && (
                  <p className="text-sm text-cyan-300 mt-2">{activationStatus}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tutorial Asaas (apenas se automático) */}
      {paymentMode === "automatic" && (
        <Card className="glass-card border-0 border-l-4 border-blue-500">
          <CardContent className="p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Como Obter a Chave da API Asaas
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/30">
                <h4 className="text-blue-300 font-bold mb-2">🟢 API de PRODUÇÃO (Pagamentos Reais)</h4>
                <ol className="text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Acesse <a href="https://www.asaas.com" target="_blank" className="underline">asaas.com</a></li>
                  <li>Faça login na sua conta</li>
                  <li>Vá em <strong>Integrações → API</strong></li>
                  <li>Copie a chave que começa com <code className="bg-blue-950 px-1 rounded">$aact_YTU5...</code></li>
                </ol>
                <p className="text-xs text-blue-300 mt-2">⚠️ Esta chave processa pagamentos REAIS</p>
              </div>

              <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-700/30">
                <h4 className="text-yellow-300 font-bold mb-2">🟡 API de SANDBOX (Testes)</h4>
                <ol className="text-yellow-200 space-y-1 list-decimal list-inside">
                  <li>Acesse <a href="https://sandbox.asaas.com" target="_blank" className="underline">sandbox.asaas.com</a></li>
                  <li>Crie uma conta de teste (se não tiver)</li>
                  <li>Vá em <strong>Integrações → API</strong></li>
                  <li>Copie a chave que começa com <code className="bg-yellow-950 px-1 rounded">$aact_...</code> (sandbox)</li>
                </ol>
                <p className="text-xs text-yellow-300 mt-2">💡 Use para testar sem dinheiro real</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuração Principal */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            {paymentMode === "automatic" ? "Configuração Asaas (Automático)" : "Configuração PIX Manual"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {paymentMode === "automatic" ? (
            <div>
              <Label className="text-purple-200 font-bold mb-2 block">
                Chave da API Asaas *
              </Label>
              <Input
                type="password"
                value={asaasApiKey}
                onChange={(e) => setAsaasApiKey(e.target.value)}
                placeholder="Cole sua chave API aqui..."
                className="bg-purple-900/20 border-purple-700/50 text-white font-mono"
              />
              <p className="text-purple-400 text-xs mt-1">
                A chave fica oculta por segurança
              </p>
            </div>
          ) : (
            <Alert className="bg-blue-900/20 border-blue-700/30">
              <Info className="h-5 w-5 text-blue-400" />
              <AlertDescription className="text-blue-200">
                <p className="font-bold mb-2">📝 Modo Manual Ativo</p>
                <p className="text-sm">
                  Configure sua chave PIX manual nas configurações de Branding (aba Settings).
                  Os clientes verão sua chave PIX e enviarão o comprovante para você aprovar manualmente.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving || (paymentMode === "automatic" && !asaasApiKey.trim())}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}