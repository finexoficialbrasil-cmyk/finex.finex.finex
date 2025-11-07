
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client"; // ✅ ADICIONADO
import { SystemSettings } from "@/entities/SystemSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Save, Loader2, CheckCircle, AlertTriangle, ExternalLink, Key, Shield, Zap, XCircle, Copy, Rocket } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminAsaasSettings() {
  const [settings, setSettings] = useState({
    asaas_api_key: "",
    asaas_webhook_token: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [detectedEnvironment, setDetectedEnvironment] = useState(null);
  const [appId, setAppId] = useState(""); // ✅ NOVO: guardar o app_id

  // New states for manual activation of pending subscriptions
  const [isActivatingPending, setIsActivatingPending] = useState(false);
  const [activationStatus, setActivationStatus] = useState("idle"); // 'idle', 'loading', 'success', 'error'
  const [activationMessage, setActivationMessage] = useState("");

  useEffect(() => {
    loadSettings();
    detectAppId(); // ✅ NOVO: detectar app_id
  }, []);

  // ✅ NOVA FUNÇÃO: Detectar app_id automaticamente
  const detectAppId = () => {
    const hostname = window.location.hostname;
    let detected = "seu-app-id"; // Default value if not found

    if (hostname.startsWith('preview--')) {
      // Formato: preview--appid.base44.app
      const parts = hostname.split('.');
      if (parts.length > 0) {
        detected = parts[0].replace('preview--', '');
      }
    } else if (hostname.includes('.base44.app')) {
      // Formato: appid.base44.app
      const parts = hostname.split('.');
      if (parts.length > 0) {
        detected = parts[0];
      }
    }
    setAppId(detected);
    console.log("✅ App ID detectado:", detected);
  };

  useEffect(() => {
    // Detectar ambiente quando API key muda
    if (settings.asaas_api_key) {
      const isSandbox = settings.asaas_api_key.includes('_hmlg_') || settings.asaas_api_key.includes('sandbox');
      setDetectedEnvironment(isSandbox ? 'sandbox' : 'production');
    } else {
      setDetectedEnvironment(null);
    }
  }, [settings.asaas_api_key]);

  const loadSettings = async () => {
    try {
      const allSettings = await SystemSettings.list();
      
      const apiKey = allSettings.find(s => s.key === "asaas_api_key");
      const webhookToken = allSettings.find(s => s.key === "asaas_webhook_token");
      
      setSettings({
        asaas_api_key: apiKey?.value || "",
        asaas_webhook_token: webhookToken?.value || ""
      });
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWebhookUrl = () => {
    if (!appId || appId === "seu-app-id") return "Carregando App ID...";
    return `https://base44.app/api/apps/${appId}/functions/asaasWebhook`;
  };

  const handleSave = async () => {
    if (!settings.asaas_api_key) {
      alert("❌ Por favor, insira a API Key do Asaas!");
      return;
    }

    setIsSaving(true);
    try {
      const allSettings = await SystemSettings.list();
      
      const settingsToSave = {
        asaas_api_key: settings.asaas_api_key,
        asaas_webhook_token: settings.asaas_webhook_token || crypto.randomUUID()
      };

      for (const [key, value] of Object.entries(settingsToSave)) {
        const existing = allSettings.find(s => s.key === key);
        
        if (existing) {
          await SystemSettings.update(existing.id, {
            key,
            value,
            description: `Configuração Asaas: ${key}`,
            category: "integrations"
          });
        } else {
          await SystemSettings.create({
            key,
            value,
            description: `Configuração Asaas: ${key}`,
            category: "integrations"
          });
        }
      }
      
      alert("✅ Configurações do Asaas salvas com sucesso!");
      loadSettings(); // Reload settings to ensure webhook token is updated in state if newly generated
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("❌ Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivatePendingAsaasSubscriptions = async () => {
    setActivationStatus("idle");
    setActivationMessage("");
    setIsActivatingPending(true);

    try {
      if (!settings.asaas_api_key) {
        throw new Error("A API Key do Asaas não está configurada. Por favor, salve a chave antes de ativar manualmente.");
      }

      console.log("🔄 Chamando função de ativação...");
      
      // ✅ Chamar função backend corretamente
      const response = await base44.functions.invoke('activatePendingSubscriptions');

      console.log("📊 Resposta:", response.data);

      if (response.data.success) {
        setActivationStatus("success");
        setActivationMessage(response.data.message);
      } else {
        throw new Error(response.data.error || 'Erro ao ativar assinaturas');
      }

    } catch (error) {
      console.error("❌ Erro ao ativar assinaturas pendentes:", error);
      setActivationStatus("error");
      setActivationMessage(error.message || "Erro desconhecido ao ativar assinaturas pendentes.");
    } finally {
      setIsActivatingPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-purple-300">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Detector de Ambiente */}
      {detectedEnvironment && (
        <Alert className={detectedEnvironment === 'production' ? 'border-green-500 bg-green-900/20' : 'border-yellow-500 bg-yellow-900/20'}>
          <AlertDescription className="flex items-center gap-2">
            {detectedEnvironment === 'production' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-300 font-bold">🚀 PRODUÇÃO DETECTADA</p>
                  <p className="text-green-200 text-sm mt-1">
                    Você está usando a API de PRODUÇÃO. Pagamentos reais serão processados!
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-300 font-bold">⚠️ SANDBOX DETECTADO</p>
                  <p className="text-yellow-200 text-sm mt-1">
                    Você está em modo TESTE. Para processar pagamentos reais, use uma chave de PRODUÇÃO.
                  </p>
                </div>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Webhook Card */}
      <Card className="glass-card border-cyan-700/50 neon-glow">
        <CardHeader className="border-b border-cyan-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Webhook - Ativação Automática
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Alert className="bg-cyan-900/20 border-cyan-700/30">
              <AlertDescription className="text-cyan-200">
                Configure o webhook para que as assinaturas sejam ativadas <strong>automaticamente</strong> quando o pagamento for confirmado!
              </AlertDescription>
            </Alert>

            <div>
              <Label className="text-purple-200 font-bold mb-2 block">
                🔗 URL do Webhook (COPIE ESTA)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={getWebhookUrl()}
                  readOnly
                  className="flex-1 bg-purple-900/50 border-purple-700/50 text-white font-mono text-xs"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(getWebhookUrl());
                    alert('✅ URL copiada para área de transferência!');
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-2 p-3 rounded-lg bg-green-900/20 border border-green-700/30">
                <p className="text-xs text-green-300 font-bold">
                  ✅ App ID detectado: <code className="bg-green-950/40 px-2 py-1 rounded">{appId}</code>
                </p>
                <p className="text-xs text-green-200 mt-1">
                  Esta é a URL CORRETA para configurar no Asaas!
                </p>
              </div>
            </div>

            <div>
              <Label className="text-purple-200 font-bold mb-2 block">
                🔑 Token de Autenticação
              </Label>
              <div className="flex gap-2">
                <Input
                  value={settings.asaas_webhook_token || "Token será gerado ao salvar"}
                  readOnly
                  className="flex-1 bg-purple-900/50 border-purple-700/50 text-purple-300 font-mono text-xs"
                />
                <Button
                  onClick={() => {
                    if (settings.asaas_webhook_token) {
                      navigator.clipboard.writeText(settings.asaas_webhook_token);
                      alert('✅ Token copiado!');
                    }
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700"
                  disabled={!settings.asaas_webhook_token}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-yellow-900/20 p-5 rounded-lg border border-yellow-700/30">
              <h4 className="text-yellow-300 font-bold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Como Configurar no Asaas
              </h4>
              <ol className="text-yellow-200 text-sm space-y-2 list-decimal list-inside">
                <li>Acesse <a href="https://www.asaas.com" target="_blank" className="text-yellow-400 hover:underline" rel="noopener noreferrer">painel do Asaas</a></li>
                <li>Vá em <strong>Integrações → Webhooks</strong></li>
                <li>Se já existe um webhook com erro, <strong className="text-red-300">DELETE-O COMPLETAMENTE</strong></li>
                <li>Clique em <strong>"Adicionar Webhook"</strong></li>
                <li>Cole a <strong>URL do Webhook acima</strong> (clique no botão copiar ☝️)</li>
                <li>Selecione os eventos:
                  <ul className="ml-6 mt-2 space-y-1 list-disc">
                    <li><code className="bg-yellow-950/30 px-2 py-0.5 rounded">PAYMENT_CONFIRMED</code></li>
                    <li><code className="bg-yellow-950/30 px-2 py-0.5 rounded">PAYMENT_RECEIVED</code></li>
                  </ul>
                </li>
                <li>Em <strong>"Token de Autenticação"</strong>, cole o token abaixo ⬇️</li>
                <li>Clique em <strong>Salvar</strong></li>
                <li>✅ Faça um pagamento de teste para verificar!</li>
              </ol>
            </div>

            <Alert className="bg-red-900/20 border-red-700/30">
              <AlertDescription className="flex items-start gap-2 text-red-200">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">⚠️ IMPORTANTE: Delete o webhook antigo!</p>
                  <p className="text-sm">
                    O webhook antigo está com a URL errada. Delete-o no Asaas e crie um novo com a URL correta acima.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-900/20 border-green-700/30">
              <AlertDescription className="flex items-start gap-2 text-green-200">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">✅ Como Testar</p>
                  <p className="text-sm">
                    1. Configure o webhook com a URL correta<br/>
                    2. Faça um pagamento de teste via PIX<br/>
                    3. Aguarde alguns segundos<br/>
                    4. Verifique em "Admin → Config → Webhooks" se o webhook foi recebido<br/>
                    5. A assinatura deve ser ativada automaticamente!
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              <a 
                href="https://docs.asaas.com/reference/webhooks" 
                target="_blank" 
                className="text-cyan-400 hover:underline text-sm"
                rel="noopener noreferrer"
              >
                Documentação Oficial - Webhooks Asaas
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Card de Ativação Manual de Assinaturas Pendentes */}
      <Card className="glass-card border-purple-700/50 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-purple-400" />
            Ativação Manual de Assinaturas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Alert className="bg-purple-900/20 border-purple-700/30">
            <AlertDescription className="text-purple-200 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <p>
                Use este botão para verificar e ativar manualmente assinaturas que podem ter falhado na ativação automática (por exemplo, devido a um problema temporário com o webhook).
                Ele buscará pagamentos confirmados no Asaas para assinaturas pendentes em seu sistema e tentará ativá-las.
              </p>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleActivatePendingAsaasSubscriptions}
            disabled={isActivatingPending || !settings.asaas_api_key}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isActivatingPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando e Ativando...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Ativar Assinaturas Pendentes Agora
              </>
            )}
          </Button>

          {activationStatus === "success" && (
            <Alert className="bg-green-900/20 border-green-700/30">
              <AlertDescription className="flex items-start gap-2 text-green-200">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="font-bold">{activationMessage}</p>
              </AlertDescription>
            </Alert>
          )}

          {activationStatus === "error" && (
            <Alert className="bg-red-900/20 border-red-700/30">
              <AlertDescription className="flex items-start gap-2 text-red-200">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="font-bold">{activationMessage}</p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>


      {/* Tutorial para Produção */}
      <Card className="glass-card border-green-700/50 neon-glow">
        <CardHeader className="border-b border-green-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Como Obter Chave de PRODUÇÃO (API Real)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4 text-sm">
            <div className="bg-green-900/20 p-4 rounded-lg border border-green-700/30">
              <h3 className="font-bold text-green-300 mb-3 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Passo 1: Completar Cadastro
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-green-200 ml-2">
                <li>Acesse <a href="https://www.asaas.com" target="_blank" className="text-green-400 hover:underline" rel="noopener noreferrer">www.asaas.com</a></li>
                <li>Faça login na sua conta</li>
                <li>Complete o cadastro da sua empresa</li>
                <li>Envie os documentos solicitados</li>
              </ol>
            </div>

            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/30">
              <h3 className="font-bold text-blue-300 mb-3">Passo 2: Aguardar Aprovação</h3>
              <p className="text-blue-200">
                A equipe do Asaas vai analisar seus documentos. 
                Isso pode levar de 1 a 3 dias úteis.
              </p>
            </div>

            <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700/30">
              <h3 className="font-bold text-purple-300 mb-3">Passo 3: Obter Chave de Produção</h3>
              <ol className="list-decimal list-inside space-y-2 text-purple-200 ml-2">
                <li>Após aprovação, vá em: <strong>Integrações → API Key</strong></li>
                <li>Clique em <strong>"Produção"</strong> (não Homologação)</li>
                <li>Copie sua chave de produção</li>
                <li>Cole aqui abaixo ⬇️</li>
              </ol>
            </div>

            <div className="bg-red-900/20 p-4 rounded-lg border border-red-700/30">
              <h3 className="font-bold text-red-300 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                ⚠️ Diferenças entre Chaves
              </h3>
              <div className="space-y-2 text-red-200">
                <div className="flex items-start gap-2">
                  <Badge className="bg-yellow-600 mt-0.5">SANDBOX</Badge>
                  <div>
                    <p className="font-mono text-xs">$aact_<strong>hmlg</strong>_xxxxx...</p>
                    <p className="text-xs mt-1">Contém "_hmlg_" → Apenas testes</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-green-600 mt-0.5">PRODUÇÃO</Badge>
                  <div>
                    <p className="font-mono text-xs">$aact_xxxxx... (sem _hmlg_)</p>
                    <p className="text-xs mt-1">NÃO contém "_hmlg_" → Pagamentos reais!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-cyan-900/20 p-3 rounded-lg border border-cyan-700/30">
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              <a 
                href="https://docs.asaas.com/reference/primeiros-passos" 
                target="_blank" 
                className="text-cyan-400 hover:underline"
                rel="noopener noreferrer"
              >
                Documentação Oficial - Como Ativar Produção
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Configuração Asaas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* API Key */}
            <div>
              <Label className="text-purple-200 text-sm font-bold">API Key do Asaas</Label>
              <Input
                type="password"
                value={settings.asaas_api_key}
                onChange={(e) => setSettings({...settings, asaas_api_key: e.target.value})}
                placeholder="$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzBkNDlhNDQ6OjAwMDAwMDAwMDAwMDAwMDAwMDA6OiRhYWNoXzAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMA=="
                className="bg-purple-900/20 border-purple-700/50 text-white mt-2 font-mono text-xs"
              />
              <p className="text-purple-400 text-xs mt-2">
                {detectedEnvironment === 'sandbox' ? 
                  '⚠️ Chave de SANDBOX detectada - Use chave de PRODUÇÃO para pagamentos reais' :
                  detectedEnvironment === 'production' ?
                  '✅ Chave de PRODUÇÃO detectada - Pagamentos reais habilitados!' :
                  'Cole aqui a API Key que você copiou do painel do Asaas'
                }
              </p>
            </div>

            {/* Webhook Token - now handled in the new card, but kept for context/display in the main settings */}
            <div>
              <Label className="text-purple-200 text-sm font-bold">Token de Webhook (Gerado Automaticamente)</Label>
              <Input
                value={settings.asaas_webhook_token || "Será gerado automaticamente ao salvar"}
                disabled
                className="bg-purple-900/10 border-purple-700/30 text-purple-300 mt-2 font-mono text-xs"
              />
              <p className="text-purple-400 text-xs mt-2">
                Este token será usado para validar notificações do Asaas (copie-o na seção acima)
              </p>
            </div>

            {/* Buttons */}
            <Button
              onClick={handleSave}
              disabled={isSaving || !settings.asaas_api_key}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
