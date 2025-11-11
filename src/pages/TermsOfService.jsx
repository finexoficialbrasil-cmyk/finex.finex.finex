import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TermsOfService() {
  const [terms, setTerms] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTerms();
    document.title = "Termos de Uso - FINEX";
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

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-purple-300">Carregando termos...</div>
      </div>
    );
  }

  if (!terms) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center p-4">
        <Card className="glass-card border-0 max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Termos não encontrados</h2>
            <p className="text-purple-300 mb-4">
              Não há termos de uso cadastrados no sistema.
            </p>
            <Link to={createPageUrl("Dashboard")}>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Termos de Uso e Política de Privacidade
            </h1>
            <p className="text-purple-300 mt-2">
              Documentos oficiais do sistema FINEX
            </p>
          </div>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="border-purple-700 text-purple-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* Info Card */}
        <Card className="glass-card border-0 border-l-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-600/20">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg mb-1">
                    Versão {terms.version}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      Vigência: {new Date(terms.effective_date).toLocaleDateString('pt-BR')}
                    </Badge>
                    <Badge className="bg-green-600">
                      <Shield className="w-3 h-3 mr-1" />
                      Documento Oficial
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handlePrint}
                className="bg-gradient-to-r from-purple-600 to-pink-600 whitespace-nowrap"
              >
                <Download className="w-4 h-4 mr-2" />
                Imprimir / Salvar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary (se existir) */}
        {terms.summary && (
          <Card className="glass-card border-0">
            <CardHeader className="border-b border-purple-900/30">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-purple-200 leading-relaxed">
                {terms.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <Card className="glass-card border-0 neon-glow">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              {terms.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div 
              className="prose prose-invert prose-lg max-w-none text-purple-100 
                         prose-headings:text-white prose-headings:font-bold
                         prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                         prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                         prose-p:leading-relaxed prose-p:mb-4
                         prose-ul:my-4 prose-li:my-2
                         prose-strong:text-cyan-300
                         prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: terms.content }}
            />
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card className="glass-card border-0 bg-purple-900/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-purple-200 text-sm">
                  <strong className="text-white">Última atualização:</strong>{' '}
                  {new Date(terms.updated_date || terms.created_date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-purple-300 text-xs mt-2">
                  Este documento pode ser atualizado periodicamente. Usuários serão notificados sobre alterações significativas e precisarão aceitar a nova versão para continuar usando o sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .glass-card {
            border: 1px solid #ddd !important;
            background: white !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}