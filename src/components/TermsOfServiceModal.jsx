import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
import { TermsOfService } from "@/entities/TermsOfService";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, AlertTriangle, Shield, CheckCircle, Loader2, Printer } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsOfServiceModal({ user, onAccepted }) {
  const [terms, setTerms] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef(null);

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    try {
      console.log("📋 TermsModal: Carregando termos...");
      const allTerms = await TermsOfService.list("-created_date", 10);
      console.log("📋 TermsModal: Total de termos encontrados:", allTerms.length);
      
      const activeTerms = allTerms.find(t => t.is_active);
      console.log("📋 TermsModal: Termos ativos:", activeTerms ? `Versão ${activeTerms.version}` : "NENHUM");
      
      setTerms(activeTerms);
    } catch (error) {
      console.error("❌ TermsModal: Erro ao carregar termos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const needsToAcceptTerms = () => {
    if (!user || !terms) {
      console.log("📋 TermsModal: Verificação negativa:", {
        hasUser: !!user,
        hasTerms: !!terms
      });
      return false;
    }
    
    console.log("📋 TermsModal: Verificando necessidade de aceitar:", {
      email: user.email,
      terms_accepted: user.terms_accepted,
      terms_version_user: user.terms_version_accepted,
      terms_version_active: terms.version
    });
    
    // Nunca aceitou os termos
    if (!user.terms_accepted) {
      console.log("⚠️ TermsModal: Usuário NUNCA aceitou os termos!");
      return true;
    }
    
    // Aceitou uma versão antiga (versão mudou)
    if (user.terms_version_accepted !== terms.version) {
      console.log("⚠️ TermsModal: Versão DESATUALIZADA! User:", user.terms_version_accepted, "Ativo:", terms.version);
      return true;
    }
    
    console.log("✅ TermsModal: Termos já aceitos e atualizados");
    return false;
  };

  const isOpen = needsToAcceptTerms();

  console.log("📋 TermsModal: Modal aberto?", isOpen);

  const handlePrint = () => {
    if (!contentRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Termos de Uso - FINEX - Versão ${terms.version}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          h1 {
            color: #1a1a2e;
            border-bottom: 3px solid #8b5cf6;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          h2 {
            color: #8b5cf6;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.5em;
          }
          h3 {
            color: #555;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          p {
            margin-bottom: 15px;
          }
          ul, ol {
            margin-bottom: 15px;
            padding-left: 30px;
          }
          li {
            margin-bottom: 8px;
          }
          strong {
            color: #1a1a2e;
          }
          .header-info {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 0.9em;
            color: #666;
          }
          hr {
            border: none;
            border-top: 2px solid #ddd;
            margin: 30px 0;
          }
          @media print {
            body {
              margin: 0;
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-info">
          <h1>${terms.title}</h1>
          <p><strong>Versão:</strong> ${terms.version}</p>
          <p><strong>Data de Vigência:</strong> ${new Date(terms.effective_date).toLocaleDateString('pt-BR')}</p>
          <p><strong>Impresso em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        ${terms.content}
        <div class="footer">
          <p>FINEX - Inteligência Financeira</p>
          <p>Este documento foi impresso para fins de consulta e referência.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleAccept = async () => {
    if (!accepted) {
      alert("Por favor, confirme que leu e aceita os Termos de Uso.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Capturar IP
      let userIP = "N/A";
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIP = ipData.ip;
      } catch (error) {
        console.log("⚠️ Não foi possível capturar IP:", error);
      }

      const updateData = {
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        terms_version_accepted: terms.version,
        terms_ip_address: userIP
      };

      console.log("📋 Registrando aceitação dos termos:", updateData);

      await User.updateMyUserData(updateData);

      console.log("✅ Termos aceitos com sucesso!");

      if (onAccepted) {
        onAccepted();
      }

      window.location.reload();

    } catch (error) {
      console.error("❌ Erro ao aceitar termos:", error);
      alert("Erro ao registrar aceitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    console.log("⏳ TermsModal: Ainda carregando...");
    return null;
  }

  if (!isOpen || !terms) {
    console.log("🚫 TermsModal: Não deve mostrar modal");
    return null;
  }

  console.log("✅ TermsModal: RENDERIZANDO MODAL!");

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="glass-card border-purple-700/50 text-white w-[95vw] max-w-5xl h-[95vh] flex flex-col p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header Fixo */}
        <DialogHeader className="p-4 sm:p-6 border-b border-purple-700/30 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                📋 Termos de Uso e Política de Privacidade
              </DialogTitle>
              <p className="text-purple-300 text-xs sm:text-sm mt-2">
                Versão {terms.version} • Vigência: {new Date(terms.effective_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="border-cyan-700 text-cyan-300 hover:bg-cyan-900/20 flex-shrink-0"
              title="Imprimir termos"
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Conteúdo Rolável */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-4 sm:px-6">
            <div className="space-y-4 py-4">
              {/* Ilustração */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
                  <div className="relative p-3 sm:p-4 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600">
                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Aviso Importante */}
              <div className="bg-yellow-900/20 border border-yellow-700/30 p-3 sm:p-4 rounded-lg">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-bold mb-1 text-sm sm:text-base">
                      ⚠️ Leitura Obrigatória
                    </p>
                    <p className="text-yellow-200 text-xs sm:text-sm">
                      Por favor, role e leia atentamente os termos abaixo. Ao aceitar, você concorda com todas as cláusulas e condições de uso do FINEX.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conteúdo dos Termos - Container com altura controlada */}
              <div className="border border-purple-700/30 rounded-lg p-3 sm:p-4 bg-purple-900/10">
                <div 
                  ref={contentRef}
                  className="prose prose-sm prose-invert max-w-none text-purple-100
                             prose-headings:text-white prose-headings:font-bold
                             prose-h2:text-base sm:prose-h2:text-xl prose-h2:mt-4 prose-h2:mb-2
                             prose-h3:text-sm sm:prose-h3:text-lg prose-h3:mt-3 prose-h3:mb-2
                             prose-p:leading-relaxed prose-p:mb-2 prose-p:text-xs sm:prose-p:text-sm
                             prose-ul:my-2 prose-li:my-1 prose-li:text-xs sm:prose-li:text-sm
                             prose-strong:text-cyan-300
                             prose-a:text-cyan-400"
                  dangerouslySetInnerHTML={{ __html: terms.content }}
                />
              </div>

              {/* Dica de Impressão */}
              <div className="bg-cyan-900/20 border border-cyan-700/30 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Printer className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-cyan-200 text-xs sm:text-sm">
                    <strong className="text-cyan-300">💡 Dica:</strong> Use o botão <Printer className="w-3 h-3 inline" /> no topo para imprimir ou salvar os termos em PDF.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer Fixo */}
        <DialogFooter className="p-4 sm:p-6 border-t-2 border-yellow-500/50 flex-shrink-0 bg-[#0d0d1a] backdrop-blur-sm">
          <div className="w-full space-y-3">

            {/* ⚠️ Seta indicativa */}
            <div className="flex items-center justify-center gap-2 animate-pulse">
              <span className="text-yellow-400 text-sm font-bold">👇 MARQUE A CAIXA ABAIXO PARA CONTINUAR 👇</span>
            </div>

            {/* Checkbox de Aceitação — destaque máximo */}
            <div
              onClick={() => setAccepted(!accepted)}
              className={`cursor-pointer border-2 rounded-xl p-4 transition-all duration-300 ${
                accepted
                  ? "bg-green-900/40 border-green-400 shadow-lg shadow-green-500/30"
                  : "bg-yellow-950/60 border-yellow-400 shadow-lg shadow-yellow-500/30 hover:bg-yellow-900/40"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  accepted ? "bg-green-500 border-green-400" : "bg-transparent border-yellow-400"
                }`}>
                  {accepted && <CheckCircle className="w-5 h-5 text-white" />}
                </div>
                <label className="text-sm sm:text-base text-white font-semibold cursor-pointer flex-1 leading-snug">
                  ✅ Li e aceito os <span className="text-yellow-300 underline">Termos de Uso</span> e a <span className="text-yellow-300 underline">Política de Privacidade</span> do FINEX. Concordo em usar o sistema de acordo com as regras estabelecidas.
                </label>
              </div>
            </div>

            {/* Info de Segurança */}
            <div className="bg-green-900/30 border border-green-500/40 p-2 sm:p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-200 text-xs">
                  <strong className="text-green-300">🔒 Registro Legal:</strong> Sua aceitação será registrada com data, hora e IP para fins legais.
                </p>
              </div>
            </div>

            {/* Botão de Aceitar */}
            <Button
              onClick={handleAccept}
              disabled={!accepted || isSubmitting}
              className={`w-full text-sm sm:text-base py-5 sm:py-6 font-bold text-lg transition-all duration-300 ${
                accepted
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/40 scale-100"
                  : "bg-gradient-to-r from-gray-700 to-gray-600 cursor-not-allowed opacity-60"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {accepted ? "✅ Aceitar e Continuar" : "Marque a caixa acima para continuar"}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}