import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Copy,
  Zap,
  Info,
  AlertTriangle
} from "lucide-react";

export default function AdminEvolutionSetup() {
  const [config, setConfig] = useState({
    api_url: '',
    api_key: '',
    instance_name: ''
  });

  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSaveConfig = () => {
    // Em produção, isso seria salvo via secrets
    alert("⚠️ IMPORTANTE:\n\nAs configurações da Evolution API devem ser salvas como SECRETS:\n\n1. Vá em Settings → Environment Variables\n2. Adicione:\n   - EVOLUTION_API_URL\n   - EVOLUTION_API_KEY\n   - EVOLUTION_INSTANCE_NAME\n\nApós configurar, recarregue esta página.");
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Teste enviando mensagem para você mesmo (admin)
      alert("🧪 Teste WhatsApp\n\nPara testar, você precisará:\n\n1. Ter Evolution API configurada\n2. WhatsApp conectado via QR Code\n3. Enviar uma mensagem de teste\n\nImplemente a função de teste quando estiver pronto!");
      
      setTestResult({
        success: true,
        message: "Teste simulado com sucesso!"
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card border-0 border-l-4 border-green-500">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-green-600/20">
              <MessageCircle className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                Evolution API - WhatsApp Integration
              </h2>
              <p className="text-purple-300">
                Configure a Evolution API para enviar mensagens via WhatsApp automaticamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutorial */}
      <Card className="glass-card border-0">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-cyan-400" />
            Como Configurar a Evolution API
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2">Deploy da Evolution API</h3>
                <p className="text-purple-300 text-sm mb-3">
                  Faça deploy da Evolution API em um servidor. Recomendamos Railway ou Render (gratuito).
                </p>
                <div className="flex flex-wrap gap-2">
                  <a 
                    href="https://github.com/EvolutionAPI/evolution-api" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="outline" size="sm" className="border-cyan-700 text-cyan-300">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      GitHub Evolution API
                    </Button>
                  </a>
                  <a 
                    href="https://railway.app/template/evolution-api" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="outline" size="sm" className="border-purple-700 text-purple-300">
                      <Zap className="w-4 h-4 mr-2" />
                      Deploy no Railway
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            <div className="h-px bg-purple-700/30" />

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2">Criar Instância e Conectar WhatsApp</h3>
                <p className="text-purple-300 text-sm mb-3">
                  Após o deploy, acesse o painel da Evolution API e:
                </p>
                <ul className="text-purple-200 text-sm space-y-1 list-disc list-inside">
                  <li>Crie uma nova instância (ex: "finex-instance")</li>
                  <li>Gere o QR Code e escaneie com seu WhatsApp</li>
                  <li>Aguarde conexão (status: "connected")</li>
                  <li>Anote a API Key gerada</li>
                </ul>
              </div>
            </div>

            <div className="h-px bg-purple-700/30" />

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2">Configurar Secrets no Base44</h3>
                <p className="text-purple-300 text-sm mb-3">
                  No painel do Base44, configure as variáveis de ambiente:
                </p>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-700/30">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-cyan-300 text-sm font-mono">EVOLUTION_API_URL</code>
                      <Badge className="bg-cyan-600">Obrigatório</Badge>
                    </div>
                    <p className="text-purple-400 text-xs">
                      Ex: https://sua-evolution.railway.app
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-700/30">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-cyan-300 text-sm font-mono">EVOLUTION_API_KEY</code>
                      <Badge className="bg-cyan-600">Obrigatório</Badge>
                    </div>
                    <p className="text-purple-400 text-xs">
                      API Key gerada pela Evolution API
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-700/30">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-cyan-300 text-sm font-mono">EVOLUTION_INSTANCE_NAME</code>
                      <Badge className="bg-cyan-600">Obrigatório</Badge>
                    </div>
                    <p className="text-purple-400 text-xs">
                      Nome da instância criada (ex: finex-instance)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-purple-700/30" />

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2">Testar e Usar!</h3>
                <p className="text-purple-300 text-sm mb-3">
                  Após configurar os secrets, teste o envio:
                </p>
                <ul className="text-purple-200 text-sm space-y-1 list-disc list-inside">
                  <li>Vá para Admin → Cobranças</li>
                  <li>Clique em "Verificar e Enviar Cobranças"</li>
                  <li>Sistema enviará Email + WhatsApp automaticamente</li>
                  <li>Verifique o relatório de envios</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card border-0">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Vantagens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-2 text-purple-200 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong>100% Gratuito</strong> - Código aberto</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong>Self-hosted</strong> - Seus dados, seu servidor</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong>API REST</strong> - Fácil integração</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong>Multi-instância</strong> - Vários WhatsApps</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong>WhatsApp pessoal</strong> - Não precisa Business API</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-2 text-purple-200 text-sm">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>Custo do servidor</strong> - Railway: ~R$ 20/mês</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>WhatsApp conectado</strong> - Mantenha online</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>Não spam</strong> - Respeite limites do WhatsApp</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>Backup da conexão</strong> - Salve QR Code</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>Monitorar</strong> - Verificar status regularmente</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Status */}
      <Alert className="glass-card border-cyan-700/50">
        <AlertDescription className="flex items-center gap-3">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div className="text-purple-200 text-sm">
            <strong>Status atual:</strong> Sistema pronto para integração WhatsApp. 
            Configure os secrets para ativar o envio automático via WhatsApp nas cobranças.
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}