
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  User,
  ChevronRight,
  Receipt,
  FileText,
  Zap,
  Target,
  PlayCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Tags,
  Shield,
  Sparkles,
  Crown,
  MessageCircle,
  Upload
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar, // ✅ NOVO: Hook para controlar sidebar
} from "@/components/ui/sidebar";
import { User as UserEntity } from "@/entities/User";
import { motion, AnimatePresence } from "framer-motion";
import SubscriptionGuard from "./components/SubscriptionGuard";
import WelcomeEmailSender from "./components/WelcomeEmailSender";
import ReceivablesNotification from "./components/ReceivablesNotification";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    gradient: "from-purple-500 via-purple-600 to-pink-600"
  },
  {
    title: "Assinaturas",
    url: createPageUrl("Plans"),
    icon: Crown,
    gradient: "from-yellow-500 via-amber-600 to-orange-600"
  },
  {
    title: "Transações",
    url: createPageUrl("Transactions"),
    icon: ArrowLeftRight,
    gradient: "from-blue-500 via-blue-600 to-cyan-600"
  },
  {
    title: "Importar Dados",
    url: createPageUrl("Import"),
    icon: Upload,
    gradient: "from-cyan-500 via-blue-600 to-indigo-600"
  },
  {
    title: "Contas a Pagar",
    url: createPageUrl("Payables"),
    icon: ArrowDownCircle,
    gradient: "from-red-500 via-red-600 to-orange-600"
  },
  {
    title: "Contas a Receber",
    url: createPageUrl("Receivables"),
    icon: ArrowUpCircle,
    gradient: "from-green-500 via-emerald-600 to-teal-600"
  },
  {
    title: "Carteiras",
    url: createPageUrl("Accounts"),
    icon: Wallet,
    gradient: "from-indigo-500 via-purple-600 to-violet-600"
  },
  {
    title: "Categorias",
    url: createPageUrl("Categories"),
    icon: Tags,
    gradient: "from-pink-500 via-rose-600 to-red-600"
  },
  {
    title: "Metas Financeiras",
    url: createPageUrl("Goals"),
    icon: Target,
    gradient: "from-cyan-500 via-blue-600 to-indigo-600"
  },
  {
    title: "Extrato Financeiro",
    url: createPageUrl("Statement"),
    icon: FileText,
    gradient: "from-violet-500 via-purple-600 to-fuchsia-600"
  },
  {
    title: "Consultor IA",
    url: createPageUrl("Consultor"),
    icon: Sparkles,
    gradient: "from-yellow-500 via-amber-600 to-orange-600"
  },
  {
    title: "Baixar App",
    url: createPageUrl("DownloadApp"),
    icon: PlayCircle,
    gradient: "from-green-500 via-emerald-600 to-teal-600"
  },
  {
    title: "Tutoriais",
    url: createPageUrl("Tutorials"),
    icon: PlayCircle,
    gradient: "from-lime-500 via-green-600 to-emerald-600"
  },
  {
    title: "Perfil",
    url: createPageUrl("Profile"),
    icon: User,
    gradient: "from-fuchsia-500 via-pink-600 to-rose-600"
  },
];

// ✅ NOVO: Componente interno que tem acesso ao contexto da Sidebar
function LayoutContent({ children }) {
  const location = useLocation();
  const { setOpenMobile } = useSidebar(); // ✅ Hook para controlar sidebar mobile
  const [user, setUser] = React.useState(null);
  const [userPlan, setUserPlan] = React.useState(null);
  const [hoveredItem, setHoveredItem] = React.useState(null);
  const [theme, setTheme] = React.useState("dark");
  const [appName, setAppName] = React.useState("FINEX");
  const [appLogo, setAppLogo] = React.useState("");
  
  const [themeSettings, setThemeSettings] = React.useState({
    particles: true,
    scanLine: true,
    textGradient: true,
    neonBorder: true,
    gridBg: true,
    glowEffects: true,
    pulseDots: true,
    animationSpeed: "normal"
  });

  const [isLoadingLayout, setIsLoadingLayout] = React.useState(true);
  const [hasLayoutError, setHasLayoutError] = React.useState(false);

  React.useEffect(() => {
    loadUserAndSettings();
  }, []);

  const loadUserAndSettings = async () => {
    setIsLoadingLayout(true);
    setHasLayoutError(false);
    try {
      // ✅ OTIMIZADO: Carregar apenas o essencial primeiro
      const userData = await UserEntity.me();
      setUser(userData);
      setTheme(userData.theme || "dark");

      setThemeSettings({
        particles: userData.theme_particles !== false,
        scanLine: userData.theme_scan_line !== false,
        textGradient: userData.theme_text_gradient !== false,
        neonBorder: userData.theme_neon_border !== false,
        gridBg: userData.theme_grid_bg !== false,
        glowEffects: userData.theme_glow_effects !== false,
        pulseDots: userData.theme_pulse_dots !== false,
        animationSpeed: userData.theme_animation_speed || "normal"
      });

      // ✅ LIBERAR A UI IMEDIATAMENTE
      setIsLoadingLayout(false);

      // ✅ Carregar resto em segundo plano (não bloqueia)
      loadAdditionalDataInBackground(userData);
      
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      setHasLayoutError(true);
      setAppName("FINEX");
      setAppLogo("");
      document.title = "FINEX - Inteligência Financeira";
      setIsLoadingLayout(false); // ✅ Mesmo com erro, liberar UI
    }
  };

  // ✅ NOVO: Carregar dados secundários em segundo plano
  const loadAdditionalDataInBackground = async (userData) => {
    try {
      // Carregar plano do usuário (se necessário)
      if (userData.subscription_plan && userData.role !== 'admin') {
        const { SystemPlan } = await import("@/entities/SystemPlan");
        const plans = await SystemPlan.list();
        const plan = plans.find(p => p.plan_type === userData.subscription_plan);
        setUserPlan(plan);
      }

      // Carregar configurações do sistema
      const { SystemSettings } = await import("@/entities/SystemSettings");
      const allSettings = await SystemSettings.list();
      
      const appNameSetting = allSettings.find(s => s.key === "app_name");
      const appLogoSetting = allSettings.find(s => s.key === "app_logo_url");
      const faviconSetting = allSettings.find(s => s.key === "favicon_url");
      
      if (appNameSetting && appNameSetting.value) {
        setAppName(appNameSetting.value);
        document.title = `${appNameSetting.value} - Inteligência Financeira`;
      } else {
        setAppName("FINEX"); // Default if not found
        document.title = "FINEX - Inteligência Financeira";
      }
      
      if (appLogoSetting && appLogoSetting.value) {
        setAppLogo(appLogoSetting.value);
      } else {
        setAppLogo(""); // Default if not found
      }

      if (faviconSetting && faviconSetting.value) {
        updateFavicon(faviconSetting.value);
      }
    } catch (error) {
      console.warn("⚠️ Erro ao carregar dados secundários (não crítico):", error);
    }
  };

  const updateFavicon = (faviconUrl) => {
    const existingFavicons = document.querySelectorAll("link[rel*='icon']");
    existingFavicons.forEach(favicon => favicon.remove());

    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = faviconUrl;
    document.head.appendChild(link);

    console.log("✅ Favicon atualizado:", faviconUrl);
  };

  // ✅ LOADING MAIS RÁPIDO E BONITO
  if (isLoadingLayout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Sparkles className="w-12 h-12 text-purple-400 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-purple-600/30 blur-xl animate-pulse" />
          </div>
          <p className="text-purple-300 text-lg font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (hasLayoutError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erro ao carregar aplicação. Por favor, tente novamente.</p>
          <Button onClick={loadUserAndSettings} className="bg-purple-600 text-white hover:bg-purple-700">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const getAnimationDuration = (base) => {
    const speeds = {
      slow: base * 1.5,
      normal: base,
      fast: base * 0.7
    };
    return `${speeds[themeSettings.animationSpeed]}s`;
  };

  const getThemeColors = () => {
    const themes = {
      dark: {
        bg: "from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]",
        sidebar: "#0a0a0f",
        sidebarBorder: "rgba(168, 85, 247, 0.3)",
        text: "text-white",
        textSecondary: "text-purple-300",
        card: "rgba(26, 26, 46, 0.85)",
        border: "rgba(168, 85, 247, 0.3)"
      },
      light: {
        bg: "from-gray-50 via-blue-50 to-indigo-50",
        sidebar: "#ffffff",
        sidebarBorder: "rgba(99, 102, 241, 0.3)",
        text: "text-gray-900",
        textSecondary: "text-gray-700",
        card: "rgba(255, 255, 255, 0.95)",
        border: "rgba(99, 102, 241, 0.3)"
      },
      purple: {
        bg: "from-purple-950 via-fuchsia-950 to-purple-950",
        sidebar: "#2e0249",
        sidebarBorder: "rgba(217, 70, 239, 0.4)",
        text: "text-white",
        textSecondary: "text-purple-200",
        card: "rgba(59, 7, 100, 0.85)",
        border: "rgba(217, 70, 239, 0.4)"
      },
      blue: {
        bg: "from-slate-950 via-blue-950 to-slate-950",
        sidebar: "#0f172a",
        sidebarBorder: "rgba(59, 130, 246, 0.4)",
        text: "text-white",
        textSecondary: "text-blue-200",
        card: "rgba(15, 23, 42, 0.85)",
        border: "rgba(59, 130, 246, 0.4)"
      },
      green: {
        bg: "from-emerald-950 via-teal-950 to-emerald-950",
        sidebar: "#064e3b",
        sidebarBorder: "rgba(16, 185, 129, 0.4)",
        text: "text-white",
        textSecondary: "text-emerald-200",
        card: "rgba(6, 78, 59, 0.85)",
        border: "rgba(16, 185, 129, 0.4)"
      }
    };
    return themes[theme] || themes.dark;
  };

  const themeColors = getThemeColors();

  const getFilteredMenuItems = () => {
    if (!user) return [];
    
    if (user.role === 'admin') {
      return [
        ...navigationItems,
        {
          title: "Painel Admin",
          url: createPageUrl("Admin"),
          icon: Shield,
          gradient: "from-red-500 via-orange-600 to-yellow-600",
          isAdmin: true
        }
      ];
    }

    if (!userPlan) {
      return navigationItems.filter(item => 
        ["Dashboard", "Perfil", "Assinaturas"].includes(item.title)
      );
    }

    const allowedPages = userPlan.allowed_pages || [];
    const basePages = ["Dashboard", "Profile", "Plans"];

    return navigationItems.filter(item => {
      let pageName = item.title;
      
      switch(item.title) {
        case "Consultor IA": pageName = "Consultor"; break;
        case "Contas a Pagar": pageName = "Payables"; break;
        case "Contas a Receber": pageName = "Receivables"; break;
        case "Transações": pageName = "Transactions"; break;
        case "Importar Dados": pageName = "Import"; break; // Added mapping for Importar Dados
        case "Carteiras": pageName = "Accounts"; break;
        case "Categorias": pageName = "Categories"; break;
        case "Metas Financeiras": pageName = "Goals"; break;
        // 'Relatórios IA' case is no longer needed here as it's removed from navigationItems
        case "Extrato Financeiro": pageName = "Statement"; break;
        case "Tutoriais": pageName = "Tutorials"; break;
        case "Perfil": pageName = "Profile"; break;
        case "Assinaturas": pageName = "Plans"; break;
        case "Dashboard": pageName = "Dashboard"; break;
        case "Baixar App": pageName = "DownloadApp"; break;
        default: pageName = item.title.replace(/\s/g, '');
      }
      
      return allowedPages.includes(pageName) || basePages.includes(pageName);
    });
  };

  const menuItems = getFilteredMenuItems();

  // ✅ NOVA FUNÇÃO: Fechar sidebar ao clicar no link (mobile)
  const handleMenuItemClick = () => {
    // Fechar sidebar no mobile
    if (window.innerWidth < 768) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <style>{`
        body {
          background: ${theme === 'light' ? '#f9fafb' : '#0a0a0f'} !important;
        }

        [data-sidebar="sidebar"] {
          background: ${themeColors.sidebar} !important;
          border-right: 2px solid ${themeColors.sidebarBorder} !important;
        }

        [data-sidebar-header],
        [data-sidebar-content],
        [data-sidebar-footer],
        [data-sidebar-group],
        [data-sidebar-group-content],
        [data-sidebar-menu] {
          background: transparent !important;
        }

        /* ✅ FORÇAR estilos nos botões do menu */
        .sidebar-menu-item {
          background: transparent !important; /* Ensure base is transparent */
          transition: all 0.3s ease !important;
        }

        .sidebar-menu-item:hover {
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%) !important;
          border-left: 3px solid #a855f7 !important;
          padding-left: calc(1rem - 3px) !important;
        }

        .sidebar-menu-item.active {
          background: linear-gradient(90deg, rgba(147, 51, 234, 0.4) 0%, rgba(168, 85, 247, 0.25) 100%) !important;
          border-left: 4px solid #a855f7 !important;
          padding-left: calc(1rem - 4px) !important;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.3) !important;
        }

        /* Remover todos os backgrounds padrão dos componentes da UI lib */
        [data-sidebar-menu-button],
        [data-sidebar-menu-button] * {
          background: transparent !important;
        }

        [data-sidebar-menu-button]:hover {
          background: transparent !important;
        }

        [data-sidebar-menu-button][data-active="true"] {
          background: transparent !important;
        }

        @media (max-width: 768px) {
          [data-sidebar="sidebar"] {
            position: fixed !important;
            z-index: 50 !important;
            height: 100vh !important;
            background: ${themeColors.sidebar} !important;
          }

          [data-sidebar="sidebar"][data-state="open"] {
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5) !important;
          }
        }

        button[data-sidebar="trigger"] {
          color: ${theme === 'light' ? '#374151' : '#e5e7eb'} !important;
          background: ${theme === 'light' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(168, 85, 247, 0.2)'} !important;
          border: 1px solid ${themeColors.sidebarBorder} !important;
          padding: 8px !important;
          border-radius: 8px !important;
          transition: all 0.2s !important;
        }

        button[data-sidebar="trigger"]:hover {
          background: ${theme === 'light' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(168, 85, 247, 0.3)'} !important;
          transform: scale(1.05) !important;
        }

        [role="listbox"], [data-radix-select-content] {
          background: ${theme === 'light' ? '#ffffff' : '#1a1a2e'} !important;
          border: 2px solid ${theme === 'light' ? '#818cf8' : '#a855f7'} !important;
          box-shadow: 0 10px 40px rgba(168, 85, 247, 0.3) !important;
          z-index: 100 !important;
        }

        [role="option"], [data-radix-select-item] {
          color: ${theme === 'light' ? '#1f2937' : '#ffffff'} !important;
          background: transparent !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          padding: 12px 16px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }

        [role="option"]:hover,
        [data-radix-select-item]:hover,
        [data-radix-select-item][data-highlighted] {
          background: ${theme === 'light' ? '#f3f4f6' : 'rgba(168, 85, 247, 0.2)'} !important;
        }

        input, textarea, select {
          color: ${theme === 'light' ? '#1f2937' : '#ffffff'} !important;
          font-weight: 500 !important;
        }

        label {
          color: ${theme === 'light' ? '#374151' : '#e5e7eb'} !important;
          font-weight: 600 !important;
        }

        .glass-card {
          background: ${themeColors.card} !important;
          backdrop-filter: blur(20px);
          border: 1px solid ${themeColors.border};
        }

        /* ✨ ANIMAÇÕES PERSONALIZÁVEIS */
        ${themeSettings.textGradient ? `
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes text-shimmer {
          0%, 100% { 
            text-shadow: 
              0 0 20px rgba(168, 85, 247, 0.8),
              0 0 40px rgba(236, 72, 153, 0.6),
              2px 2px 10px rgba(59, 130, 246, 0.4);
            filter: brightness(1);
          }
          50% { 
            text-shadow: 
              0 0 30px rgba(168, 85, 247, 1),
              0 0 60px rgba(236, 72, 153, 0.8),
              3px 3px 15px rgba(59, 130, 246, 0.6);
            filter: brightness(1.3);
          }
        }

        .logo-text {
          animation: text-shimmer ${getAnimationDuration(3)} ease-in-out infinite, gradient-shift ${getAnimationDuration(6)} ease infinite;
          background: linear-gradient(
            135deg,
            #a855f7 0%,
            #ec4899 25%,
            #3b82f6 50%,
            #06b6d4 75%,
            #a855f7 100%
          );
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 900;
          letter-spacing: -0.5px;
        }

        .logo-subtitle {
          background: linear-gradient(
            90deg,
            #a855f7,
            #ec4899,
            #06b6d4,
            #10b981
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift ${getAnimationDuration(4)} ease infinite;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        ` : `
        .logo-text {
          color: #ffffff;
          font-weight: 900;
          letter-spacing: -0.5px;
        }

        .logo-subtitle {
          color: #a855f7;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        `}

        ${themeSettings.particles ? `
        @keyframes float-particle {
          0% {
            transform: translateY(0) translateX(0) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
            transform: scale(1);
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100px) translateX(20px) scale(0);
            opacity: 0;
          }
        }

        .financial-particle {
          position: absolute;
          font-size: 12px;
          color: rgba(168, 85, 247, 0.4);
          animation: float-particle ${getAnimationDuration(6)} ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }

        .financial-particle:nth-child(1) {
          left: 20%;
          animation-delay: 0s;
          top: 100%;
        }

        .financial-particle:nth-child(2) {
          left: 50%;
          animation-delay: ${parseFloat(getAnimationDuration(6)) / 3}s;
          top: 120%;
        }

        .financial-particle:nth-child(3) {
          left: 80%;
          animation-delay: ${parseFloat(getAnimationDuration(6)) * 2 / 3}s;
          top: 80%;
        }
        ` : ''}

        ${themeSettings.scanLine ? `
        @keyframes scan-line {
          0% { top: -100%; }
          100% { top: 100%; }
        }

        .scan-line {
          position: absolute;
          top: -100%;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(
            to right,
            transparent,
            rgba(59, 130, 246, 0.8),
            transparent
          );
          animation: scan-line ${getAnimationDuration(3)} ease-in-out infinite;
          pointer-events: none;
          z-index: 20;
        }
        ` : ''}

        ${themeSettings.neonBorder ? `
        .neon-border {
          position: absolute;
          inset: -1px;
          background: linear-gradient(
            45deg,
            #a855f7,
            #ec4899,
            #3b82f6,
            #06b6d4,
            #a855f7
          );
          background-size: 400% 400%;
          border-radius: inherit;
          opacity: 0.3;
          filter: blur(8px);
          animation: gradient-shift ${getAnimationDuration(6)} ease infinite;
          z-index: -1;
        }
        ` : ''}

        .logo-header-container {
          position: relative;
          overflow: hidden;
        }

        .logo-container {
          position: relative;
          z-index: 10;
        }

        .logo-box {
          position: relative;
          overflow: hidden;
          border: 2px solid transparent;
          background: 
            linear-gradient(#1a1a2e, #1a1a2e) padding-box,
            linear-gradient(135deg, #a855f7, #ec4899, #3b82f6, #06b6d4) border-box;
        }

        .logo-text-container {
          position: relative;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
          }
        }
      `}</style>
      
      <WelcomeEmailSender />
      
      <div className={`min-h-screen flex w-full bg-gradient-to-br ${themeColors.bg}`}>
        <Sidebar>
          <SidebarHeader className="border-b-2 border-purple-900/50 p-6 relative overflow-hidden logo-header-container">
            
            {themeSettings.particles && (
              <>
                <div className="financial-particle">$</div>
                <div className="financial-particle">₿</div>
                <div className="financial-particle">€</div>
              </>
            )}

            <div className="flex items-center gap-4 relative z-10">
              <div className="logo-container relative">
                {themeSettings.neonBorder && <div className="neon-border"></div>}
                {appLogo ? (
                  <div className="w-14 h-14 rounded-xl logo-box relative">
                    {themeSettings.scanLine && <div className="scan-line"></div>}
                    <img
                      src={appLogo}
                      alt={appName}
                      className="w-full h-full object-contain relative z-10 p-1"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center logo-box relative">
                    {themeSettings.scanLine && <div className="scan-line"></div>}
                    <Sparkles className="w-7 h-7 text-white relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  </div>
                )}
              </div>

              <div className="logo-text-container">
                <h2 className="font-bold text-2xl logo-text leading-tight">
                  {appName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] logo-subtitle">
                    FINEX
                  </p>
                  {themeSettings.pulseDots && (
                    <div className="flex gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse"></div>
                      <div className="w-1 h-1 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                      <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {themeSettings.glowEffects && (
              <>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: getAnimationDuration(4) }}></div>
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-blue-600/30 via-cyan-600/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: getAnimationDuration(5), animationDelay: '1s' }}></div>
              </>
            )}
            
            {themeSettings.gridBg && (
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `
                  linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}></div>
            )}
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.url;
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild data-active={isActive ? "true" : "false"}>
                          <Link 
                            to={item.url} 
                            className={`sidebar-menu-item ${isActive ? 'active' : ''} flex items-center gap-3 px-4 py-3 rounded-lg`}
                            onClick={handleMenuItemClick}
                          >
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient}`}>
                              <item.icon className="w-5 h-5 text-white" />
                            </div>
                            <span className={`font-medium text-sm ${
                              isActive 
                                ? theme === 'dark'
                                  ? 'text-purple-200'
                                  : theme === 'light'
                                  ? 'text-indigo-700'
                                  : theme === 'purple'
                                  ? 'text-fuchsia-200'
                                  : theme === 'blue'
                                  ? 'text-blue-200'
                                  : 'text-emerald-200'
                                : 'text-white'
                            }`}>
                              {item.title}
                            </span>
                            {item.isAdmin && (
                              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-600/20 text-red-400">
                                ADMIN
                              </span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t-2 border-purple-900/50 p-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-900/20 relative overflow-hidden mb-3">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 animate-pulse"></div>
              
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center relative z-10">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{user?.full_name?.charAt(0) || "U"}</span>
                )}
              </div>
              <div className="relative z-10">
                <p className="font-semibold text-white text-sm">{user?.full_name || "Usuário"}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-xs text-cyan-300">ONLINE</p>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/5565981297511?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20FINEX."
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                size="sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                💬 Suporte WhatsApp
              </Button>
            </a>
            <p className="text-center text-xs text-purple-400 mt-2">
              Precisa de ajuda? Fale conosco!
            </p>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b-2 border-purple-900/50 px-4 py-3 md:hidden sticky top-0 z-40" style={{ background: themeColors.sidebar }}>
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-purple-900/30 p-2 rounded-lg transition-colors" />
              <div className="flex items-center gap-2">
                {appLogo ? (
                  <img
                    src={appLogo}
                    alt={appName}
                    className="w-8 h-8 rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <h1 className="text-xl font-bold text-white">{appName}</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto" style={{ background: theme === 'light' ? '#f9fafb' : '#0a0a0f' }}>
            <SubscriptionGuard>
              {children}
            </SubscriptionGuard>
          </div>
        </main>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
