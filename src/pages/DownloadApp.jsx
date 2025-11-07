import React, { useState, useEffect } from "react";
import { SystemSettings } from "@/entities/SystemSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Download,
  Apple,
  Chrome,
  QrCode,
  Check,
  Zap,
  Shield,
  Bell,
  TrendingUp,
  Sparkles,
  Star,
  ExternalLink,
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  Target,
  Receipt
} from "lucide-react";
import { motion } from "framer-motion";

export default function DownloadApp() {
  const [appLinks, setAppLinks] = useState({
    ios_url: "",
    android_url: "",
    qr_code_url: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppLinks();
  }, []);

  const loadAppLinks = async () => {
    try {
      const settings = await SystemSettings.list();
      
      const iosUrl = settings.find(s => s.key === "mobile_app_ios_url");
      const androidUrl = settings.find(s => s.key === "mobile_app_android_url");
      const qrCode = settings.find(s => s.key === "mobile_app_qr_code_url");
      
      setAppLinks({
        ios_url: iosUrl?.value || "",
        android_url: androidUrl?.value || "",
        qr_code_url: qrCode?.value || ""
      });
    } catch (error) {
      console.error("Erro ao carregar links do app:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Zap,
      title: "Acesso Rápido",
      description: "Gerencie suas finanças em segundos, direto do seu celular"
    },
    {
      icon: Bell,
      title: "Notificações em Tempo Real",
      description: "Receba alertas de contas a vencer e transações importantes"
    },
    {
      icon: Shield,
      title: "Segurança Máxima",
      description: "Seus dados protegidos com criptografia de ponta e biometria"
    },
    {
      icon: TrendingUp,
      title: "Acompanhamento Contínuo",
      description: "Visualize gráficos e relatórios sempre que precisar"
    }
  ];

  const benefits = [
    "✅ Interface intuitiva e moderna",
    "✅ Funciona offline (sincroniza depois)",
    "✅ Adicione transações com a câmera",
    "✅ Widget para a tela inicial",
    "✅ Modo escuro e claro",
    "✅ Sincronização automática",
    "✅ Backup automático na nuvem",
    "✅ Suporte para Touch ID e Face ID"
  ];

  // ✅ SUBSTITUIR SCREENSHOTS POR CARDS COM ÍCONES
  const appScreens = [
    {
      id: 1,
      title: "Dashboard",
      icon: LayoutDashboard,
      gradient: "from-purple-600 to-pink-600",
      description: "Visão completa das suas finanças"
    },
    {
      id: 2,
      title: "Transações",
      icon: ArrowLeftRight,
      gradient: "from-blue-600 to-cyan-600",
      description: "Gerencie entradas e saídas"
    },
    {
      id: 3,
      title: "Gráficos",
      icon: BarChart3,
      gradient: "from-green-600 to-emerald-600",
      description: "Visualize seus gastos"
    },
    {
      id: 4,
      title: "Contas",
      icon: Wallet,
      gradient: "from-orange-600 to-red-600",
      description: "Controle suas carteiras"
    },
    {
      id: 5,
      title: "Metas",
      icon: Target,
      gradient: "from-indigo-600 to-purple-600",
      description: "Acompanhe seus objetivos"
    },
    {
      id: 6,
      title: "Relatórios",
      icon: Receipt,
      gradient: "from-pink-600 to-rose-600",
      description: "Insights inteligentes"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-6 py-2 mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            App Mobile Disponível
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Suas Finanças
            </span>
            <br />
            <span className="text-white">Na Palma da Mão</span>
          </h1>

          <p className="text-purple-300 text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Baixe nosso app e tenha controle total das suas finanças onde quer que você esteja.
            Disponível para iOS e Android.
          </p>

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {appLinks.ios_url ? (
              <motion.a
                href={appLinks.ios_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-black hover:bg-gray-900 text-white px-8 py-6 text-lg rounded-2xl w-full sm:w-auto">
                  <Apple className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="text-xs">Baixar na</div>
                    <div className="font-bold">App Store</div>
                  </div>
                </Button>
              </motion.a>
            ) : (
              <Button disabled className="bg-gray-700 text-gray-400 px-8 py-6 text-lg rounded-2xl w-full sm:w-auto">
                <Apple className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="text-xs">Em breve na</div>
                  <div className="font-bold">App Store</div>
                </div>
              </Button>
            )}

            {appLinks.android_url ? (
              <motion.a
                href={appLinks.android_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-6 text-lg rounded-2xl w-full sm:w-auto">
                  <Chrome className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="text-xs">Disponível no</div>
                    <div className="font-bold">Google Play</div>
                  </div>
                </Button>
              </motion.a>
            ) : (
              <Button disabled className="bg-gray-700 text-gray-400 px-8 py-6 text-lg rounded-2xl w-full sm:w-auto">
                <Chrome className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="text-xs">Em breve no</div>
                  <div className="font-bold">Google Play</div>
                </div>
              </Button>
            )}
          </div>

          {/* QR Code */}
          {appLinks.qr_code_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block"
            >
              <Card className="glass-card border-0 neon-glow p-6 inline-block">
                <div className="text-center mb-4">
                  <QrCode className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-purple-300 text-sm font-semibold">Escaneie para Baixar</p>
                </div>
                <img
                  src={appLinks.qr_code_url}
                  alt="QR Code para Download"
                  className="w-48 h-48 rounded-lg border-4 border-purple-600"
                />
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card border-0 neon-glow h-full text-center p-6 hover:scale-105 transition-transform">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-purple-300 text-sm">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ✅ APP SCREENS - SUBSTITUIR IMAGENS POR CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Conheça o App
            </span>
          </h2>
          <p className="text-purple-300 text-center mb-12 max-w-2xl mx-auto">
            Todas as funcionalidades que você ama na versão web, agora no seu bolso
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {appScreens.map((screen, index) => (
              <motion.div
                key={screen.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer"
              >
                <Card className="glass-card border-0 neon-glow h-full overflow-hidden">
                  <div className={`h-32 bg-gradient-to-br ${screen.gradient} flex items-center justify-center relative`}>
                    <div className="absolute inset-0 bg-black/20"></div>
                    <screen.icon className="w-12 h-12 text-white relative z-10" />
                  </div>
                  <CardContent className="p-4 text-center">
                    <h4 className="text-white font-bold text-sm mb-1">{screen.title}</h4>
                    <p className="text-purple-400 text-xs">{screen.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="glass-card border-0 neon-glow h-full p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" />
                Recursos do App
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 text-purple-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="glass-card border-0 neon-glow h-full p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-cyan-400" />
                Requisitos do Sistema
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Apple className="w-5 h-5 text-white" />
                    <h4 className="text-white font-semibold">iOS</h4>
                  </div>
                  <p className="text-purple-300 text-sm">
                    • iPhone 6s ou superior<br />
                    • iOS 13.0 ou superior<br />
                    • 50 MB de espaço livre
                  </p>
                </div>

                <div className="h-px bg-purple-900/30"></div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Chrome className="w-5 h-5 text-white" />
                    <h4 className="text-white font-semibold">Android</h4>
                  </div>
                  <p className="text-purple-300 text-sm">
                    • Android 6.0 ou superior<br />
                    • Processador dual-core<br />
                    • 50 MB de espaço livre
                  </p>
                </div>

                <div className="h-px bg-purple-900/30"></div>

                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/30">
                  <p className="text-blue-200 text-sm">
                    <Download className="w-4 h-4 inline mr-2" />
                    <strong>100% Gratuito</strong> para usuários com planos ativos
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <Card className="glass-card border-0 neon-glow p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Perguntas Frequentes
            </h3>
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-700/30">
                <h4 className="text-white font-semibold mb-2">📱 O app é gratuito?</h4>
                <p className="text-purple-300 text-sm">
                  Sim! O app é totalmente gratuito para usuários com planos ativos. Baixe agora e aproveite todos os recursos.
                </p>
              </div>

              <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-700/30">
                <h4 className="text-white font-semibold mb-2">🔄 Os dados sincronizam automaticamente?</h4>
                <p className="text-purple-300 text-sm">
                  Sim! Todas as suas transações, contas e dados sincronizam automaticamente entre o app e a versão web.
                </p>
              </div>

              <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-700/30">
                <h4 className="text-white font-semibold mb-2">🔒 Meus dados estão seguros?</h4>
                <p className="text-purple-300 text-sm">
                  Absolutamente! Utilizamos criptografia de ponta a ponta e você pode proteger o app com biometria (Touch ID / Face ID).
                </p>
              </div>

              <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-700/30">
                <h4 className="text-white font-semibold mb-2">📶 Funciona offline?</h4>
                <p className="text-purple-300 text-sm">
                  Sim! Você pode adicionar transações mesmo sem internet. Os dados serão sincronizados quando você voltar online.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Card className="glass-card border-0 border-l-4 border-purple-500 p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para começar?
            </h2>
            <p className="text-purple-300 text-lg mb-8 max-w-2xl mx-auto">
              Baixe agora e tenha suas finanças sempre sob controle
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {appLinks.ios_url && (
                <Button
                  onClick={() => window.open(appLinks.ios_url, '_blank')}
                  className="bg-black hover:bg-gray-900 text-white px-8 py-6 text-lg rounded-2xl"
                >
                  <Apple className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="text-xs">Baixar na</div>
                    <div className="font-bold">App Store</div>
                  </div>
                </Button>
              )}
              
              {appLinks.android_url && (
                <Button
                  onClick={() => window.open(appLinks.android_url, '_blank')}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-6 text-lg rounded-2xl"
                >
                  <Chrome className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="text-xs">Disponível no</div>
                    <div className="font-bold">Google Play</div>
                  </div>
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}