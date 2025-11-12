import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
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
      const { TermsOfService } = await import("@/entities/TermsOfService");
      const allTerms = await TermsOfService.list("-created_date", 1);
      const activeTerms = allTerms.find(t => t.is_active);
      
      setTerms(activeTerms);
    } catch (error) {
      console.error("Erro ao carregar termos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const needsToAcceptTerms = () => {
    if (!user || !terms) return false;
    
    // Nunca aceitou os termos
    if (!user.terms_accepted) return true;
    
    // Aceitou uma versão antiga (versão mudou)
    if (user.terms_version_accepted !== terms.version) return true;
    
    return false;
  };

  const isOpen = needsToAcceptTerms();

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
    
    // Aguardar carregar e imprimir
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
      // Capturar IP (aproximado do lado do cliente)
      let userIP = "N/A";
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIP = ipData.ip;
      } catch (error) {
        console.log("Não foi possível capturar IP:", error);
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
    return null; // Não mostra nada enquanto carrega
  }

  if (!isOpen || !terms) {
    return null; // Não mostra modal se não precisa aceitar
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="glass-card border-purple-700/50 text-white w-[95vw] max-w-4xl max-h-[95vh] flex flex-col p-4 sm:p-6"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent text-center">
                📋 Termos de Uso e Política de Privacidade
              </DialogTitle>
              <p className="text-purple-300 text-sm text-center mt-2">
                Versão {terms.version} • Vigência: {new Date(terms.effective_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="border-cyan-700 text-cyan-300 hover:bg-cyan-900/20 flex-shrink-0 ml-2"
              title="Imprimir termos"
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Ilustração */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
              <div className="relative p-4 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
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
                  Por favor, leia atentamente os termos abaixo. Ao aceitar, você concorda com todas as cláusulas e condições de uso do FINEX.
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo dos Termos */}
          <ScrollArea className="flex-1 border border-purple-700/30 rounded-lg p-4 bg-purple-900/10">
            <div 
              ref={contentRef}
              className="prose prose-sm prose-invert max-w-none text-purple-100
                         prose-headings:text-white prose-headings:font-bold
                         prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                         prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
                         prose-p:leading-relaxed prose-p:mb-3
                         prose-ul:my-3 prose-li:my-1
                         prose-strong:text-cyan-300
                         prose-a:text-cyan-400"
              dangerouslySetInnerHTML={{ __html: terms.content }}
            />
          </ScrollArea>

          {/* Dica de Impressão */}
          <div className="bg-cyan-900/20 border border-cyan-700/30 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Printer className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-cyan-200 text-xs sm:text-sm">
                <strong className="text-cyan-300">💡 Dica:</strong> Use o botão <Printer className="w-3 h-3 inline" /> no topo para imprimir ou salvar os termos em PDF para sua referência.
              </p>
            </div>
          </div>

          {/* Checkbox de Aceitação */}
          <div className="bg-purple-900/20 border border-purple-700/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Checkbox
                id="accept-terms"
                checked={accepted}
                onCheckedChange={setAccepted}
                className="mt-0.5"
              />
              <label 
                htmlFor="accept-terms" 
                className="text-sm sm:text-base text-purple-200 cursor-pointer flex-1"
              >
                Li e aceito os <strong className="text-white">Termos de Uso</strong> e a <strong className="text-white">Política de Privacidade</strong> do FINEX. Concordo em usar o sistema de acordo com as regras estabelecidas.
              </label>
            </div>
          </div>

          {/* Info de Segurança */}
          <div className="bg-green-900/20 border border-green-700/30 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-200 text-xs sm:text-sm">
                <strong className="text-green-300">🔒 Registro Legal:</strong> Sua aceitação será registrada com data, hora e IP para fins legais e de conformidade.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            onClick={handleAccept}
            disabled={!accepted || isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-base sm:text-lg py-5 sm:py-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Aceitar e Continuar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}