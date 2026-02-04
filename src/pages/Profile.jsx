import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
import { TermsOfService } from "@/entities/TermsOfService";
import { Transaction } from "@/entities/Transaction";
import { Account } from "@/entities/Account";
import { Category } from "@/entities/Category";
import { Goal } from "@/entities/Goal";
import { Bill } from "@/entities/Bill";
import { Transfer } from "@/entities/Transfer";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Upload, 
  Save, 
  LogOut, 
  Palette,
  Settings,
  FileText,
  CheckCircle,
  Calendar,
  Globe,
  Printer,
  Eye,
  Shield,
  XCircle,
  AlertTriangle,
  Download
} from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [terms, setTerms] = useState(null);
  const backupInputRef = useRef(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    theme: "dark"
  });

  useEffect(() => {
    loadUser();
    document.title = "Meu Perfil - FINEX";
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      console.log("👤 Usuário carregado:", {
        email: userData.email,
        terms_accepted: userData.terms_accepted,
        terms_version: userData.terms_version_accepted
      });
      
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        phone: userData.phone || "",
        theme: userData.theme || "dark"
      });
      
      // Sempre carregar termos (tanto para quem aceitou quanto para quem não)
      await loadActiveTerms();
      
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveTerms = async () => {
    try {
      // const { TermsOfService } = await import("@/entities/TermsOfService"); // Removed dynamic import
      const allTerms = await TermsOfService.list("-created_date", 10);
      const activeTerms = allTerms.find(t => t.is_active);
      
      console.log("📋 Termos ativos carregados:", activeTerms ? `Versão ${activeTerms.version}` : "Nenhum");
      setTerms(activeTerms);
    } catch (error) {
      console.error("Erro ao carregar termos:", error);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo muito grande! Máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.auth.updateMe({ avatar_url: file_url });
      await loadUser();
      alert("Foto atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao atualizar foto. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      alert("Nome completo é obrigatório!");
      return;
    }

    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: formData.full_name,
        phone: formData.phone,
        theme: formData.theme
      });
      
      alert("Perfil atualizado com sucesso!");
      await loadUser();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      base44.auth.logout();
    }
  };

  const handlePrintTerms = () => {
    if (!terms || !user || !user.terms_accepted) return;

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
        <title>Termos de Uso Aceitos - FINEX</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          .certificate-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
          }
          .certificate-header h1 {
            margin: 0;
            font-size: 2em;
          }
          .acceptance-info {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
            border-left: 5px solid #667eea;
          }
          .acceptance-info h2 {
            margin-top: 0;
            color: #667eea;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
          }
          .info-item {
            padding: 10px;
            background: white;
            border-radius: 5px;
          }
          .info-label {
            font-weight: bold;
            color: #555;
            font-size: 0.9em;
            margin-bottom: 5px;
          }
          .info-value {
            color: #333;
          }
          h1, h2 {
            color: #1a1a2e;
          }
          h2 {
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.5em;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
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
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 0.9em;
            color: #666;
          }
          .signature-box {
            background: #f9f9f9;
            border: 2px solid #667eea;
            padding: 20px;
            margin: 30px 0;
            border-radius: 5px;
          }
          .signature-box p {
            margin: 5px 0;
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
        <div class="certificate-header">
          <h1>🔒 CERTIFICADO DE ACEITAÇÃO</h1>
          <p style="margin: 10px 0 0 0; font-size: 1.1em;">Termos de Uso e Política de Privacidade - FINEX</p>
        </div>

        <div class="acceptance-info">
          <h2>📋 Informações da Aceitação</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">👤 Nome Completo</div>
              <div class="info-value">${user.full_name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📧 Email</div>
              <div class="info-value">${user.email}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📋 Versão dos Termos</div>
              <div class="info-value">${user.terms_version_accepted}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📅 Data de Aceitação</div>
              <div class="info-value">${new Date(user.terms_accepted_at).toLocaleString('pt-BR')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">🌐 Endereço IP</div>
              <div class="info-value">${user.terms_ip_address || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">✅ Status</div>
              <div class="info-value">ACEITO E REGISTRADO</div>
            </div>
          </div>
        </div>

        <div class="signature-box">
          <p><strong>DECLARAÇÃO:</strong></p>
          <p>
            Eu, <strong>${user.full_name}</strong>, portador do email <strong>${user.email}</strong>, 
            declaro que li, compreendi e aceito integralmente os Termos de Uso e a Política de Privacidade 
            do sistema FINEX em sua versão <strong>${user.terms_version_accepted}</strong>, 
            conforme registrado em <strong>${new Date(user.terms_accepted_at).toLocaleDateString('pt-BR')}</strong> 
            às <strong>${new Date(user.terms_accepted_at).toLocaleTimeString('pt-BR')}</strong>.
          </p>
          <p>
            Este documento constitui prova legal de aceitação dos termos e pode ser utilizado 
            para fins de conformidade e auditoria.
          </p>
        </div>

        <h2>📄 Conteúdo dos Termos Aceitos</h2>
        <p><strong>Título:</strong> ${terms.title}</p>
        <p><strong>Data de Vigência:</strong> ${new Date(terms.effective_date).toLocaleDateString('pt-BR')}</p>
        <hr style="margin: 30px 0; border: none; border-top: 2px solid #ddd;">
        ${terms.content}

        <div class="footer">
          <p><strong>FINEX - Inteligência Financeira</strong></p>
          <p>Este documento foi gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
          <p>Documento oficial válido como comprovante de aceitação de termos</p>
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

  const handleViewTerms = () => {
    setShowTermsModal(true);
  };

  const handleAcceptTermsNow = () => {
    alert("Por favor, faça logout e login novamente para aceitar os termos de uso.");
    window.location.reload();
  };

  const handleRestoreBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsRestoring(true);
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.user_info || !backup.user_info.original_email) {
        throw new Error("Arquivo de backup inválido");
      }

      if (!confirm(`⚠️ CONFIRMAR RESTAURAÇÃO\n\nRestaurar backup de: ${backup.user_info.original_email}\nData: ${new Date(backup.user_info.export_date).toLocaleDateString('pt-BR')}\n\nTodos os dados serão ADICIONADOS à sua conta atual.\n\nDeseja continuar?`)) {
        setIsRestoring(false);
        if (backupInputRef.current) backupInputRef.current.value = '';
        return;
      }

      const accountIdMap = {};
      const categoryIdMap = {};

      for (const cat of backup.categories || []) {
        const { id, created_by, created_date, updated_date, ...catData } = cat;
        const newCat = await Category.create({ ...catData });
        categoryIdMap[cat.id] = newCat.id;
      }

      for (const acc of backup.accounts || []) {
        const { id, created_by, created_date, updated_date, ...accData } = acc;
        const newAcc = await Account.create({ ...accData });
        accountIdMap[acc.id] = newAcc.id;
      }

      for (const tx of backup.transactions || []) {
        const { id, created_by, created_date, updated_date, user_email, ...txData } = tx;
        await Transaction.create({
          ...txData,
          user_email: user.email,
          category_id: categoryIdMap[tx.category_id] || tx.category_id,
          account_id: accountIdMap[tx.account_id] || tx.account_id
        });
      }

      for (const goal of backup.goals || []) {
        const { id, created_by, created_date, updated_date, ...goalData } = goal;
        await Goal.create({ ...goalData });
      }

      for (const bill of backup.bills || []) {
        const { id, created_by, created_date, updated_date, ...billData } = bill;
        await Bill.create({
          ...billData,
          category_id: categoryIdMap[bill.category_id] || bill.category_id,
          account_id: accountIdMap[bill.account_id] || bill.account_id
        });
      }

      for (const transfer of backup.transfers || []) {
        const { id, created_by, created_date, updated_date, ...transferData } = transfer;
        await Transfer.create({
          ...transferData,
          from_account_id: accountIdMap[transfer.from_account_id] || transfer.from_account_id,
          to_account_id: accountIdMap[transfer.to_account_id] || transfer.to_account_id
        });
      }

      alert(`✅ BACKUP RESTAURADO!\n\n📊 Dados restaurados:\n- ${backup.transactions?.length || 0} transações\n- ${backup.accounts?.length || 0} contas\n- ${backup.categories?.length || 0} categorias\n- ${backup.goals?.length || 0} metas\n- ${backup.bills?.length || 0} contas a pagar/receber\n- ${backup.transfers?.length || 0} transferências`);
      
      if (backupInputRef.current) backupInputRef.current.value = '';
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      alert(`❌ Erro ao restaurar backup: ${error.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-purple-300">Carregando perfil...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Meu Perfil
          </h1>
          <p className="text-purple-300 mt-2">Gerencie suas informações pessoais e preferências</p>
        </div>

        {/* Avatar e Info Básica */}
        <Card className="glass-card border-0 neon-glow">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-purple-400" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-4xl font-bold">
                        {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    <Upload className="w-8 h-8 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {isUploading && (
                  <p className="text-purple-400 text-sm">Enviando...</p>
                )}
                <p className="text-purple-300 text-sm text-center">
                  Clique na foto para alterar
                </p>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div>
                  <Label className="text-purple-200 mb-2 block">
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    Nome Completo *
                  </Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="bg-purple-900/20 border-purple-700/50 text-white"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <Label className="text-purple-200 mb-2 block">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    value={user.email}
                    disabled
                    className="bg-purple-900/20 border-purple-700/50 text-purple-400"
                  />
                  <p className="text-purple-400 text-xs mt-1">Email não pode ser alterado</p>
                </div>

                <div>
                  <Label className="text-purple-200 mb-2 block">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefone
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="bg-purple-900/20 border-purple-700/50 text-white"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status dos Termos - SEMPRE VISÍVEL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`glass-card border-0 border-l-4 ${
            user.terms_accepted ? 'border-green-500' : 'border-yellow-500'
          }`}>
            <CardHeader className="border-b border-purple-900/30">
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className={`w-5 h-5 ${user.terms_accepted ? 'text-green-400' : 'text-yellow-400'}`} />
                Termos de Uso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {user.terms_accepted ? (
                /* USUÁRIO JÁ ACEITOU */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-900/20 border border-green-700/30">
                    <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-white font-bold">✅ Termos Aceitos e Registrados</p>
                      <p className="text-green-300 text-sm">
                        Você aceitou os termos de uso do sistema FINEX
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <p className="text-purple-300 text-sm">Versão Aceita</p>
                      </div>
                      <p className="text-white font-bold">{user.terms_version_accepted}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <p className="text-purple-300 text-sm">Data de Aceitação</p>
                      </div>
                      <p className="text-white font-bold">
                        {new Date(user.terms_accepted_at).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-purple-400 text-xs mt-1">
                        {new Date(user.terms_accepted_at).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>

                    {user.terms_ip_address && (
                      <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-4 h-4 text-purple-400" />
                          <p className="text-purple-300 text-sm">IP Registrado</p>
                        </div>
                        <p className="text-white font-mono text-sm">{user.terms_ip_address}</p>
                      </div>
                    )}

                    <div className="p-4 rounded-lg bg-cyan-900/20 border border-cyan-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <p className="text-cyan-300 text-sm">Registro Legal</p>
                      </div>
                      <p className="text-cyan-200 text-xs">
                        Documento válido como comprovante
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-purple-900/30">
                    <Button
                      onClick={handleViewTerms}
                      variant="outline"
                      className="flex-1 border-purple-700 text-purple-300 hover:bg-purple-900/30"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Termos Completos
                    </Button>
                    <Button
                      onClick={handlePrintTerms}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      disabled={!terms}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimir Certificado
                    </Button>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-700/30 p-4 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      <strong className="text-blue-300">💡 Sobre este registro:</strong> Sua aceitação dos termos foi registrada 
                      legalmente com data, hora e endereço IP. Este documento serve como comprovante oficial 
                      de que você leu e aceitou os Termos de Uso e Política de Privacidade do FINEX.
                    </p>
                  </div>
                </div>
              ) : (
                /* USUÁRIO NÃO ACEITOU AINDA */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/30">
                    <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                    <div>
                      <p className="text-white font-bold">⚠️ Termos Pendentes de Aceitação</p>
                      <p className="text-yellow-300 text-sm">
                        Você ainda não aceitou os termos de uso do FINEX
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-900/20 border border-red-700/30 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-300 font-bold mb-2">🚫 ATENÇÃO: Aceite Obrigatório</p>
                        <p className="text-red-200 text-sm mb-3">
                          Para usar o sistema FINEX, você precisa ler e aceitar nossos Termos de Uso 
                          e Política de Privacidade. Este é um requisito legal obrigatório.
                        </p>
                        <ul className="text-red-200 text-sm space-y-1 list-disc list-inside">
                          <li>Aceitação registrada legalmente</li>
                          <li>Documento com valor jurídico</li>
                          <li>Conformidade com LGPD</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {terms ? (
                    <div className="bg-cyan-900/20 border border-cyan-700/30 p-4 rounded-lg">
                      <p className="text-cyan-200 text-sm mb-3">
                        <strong className="text-cyan-300">📋 Termos Disponíveis:</strong> Versão {terms.version} 
                        • Vigente desde {new Date(terms.effective_date).toLocaleDateString('pt-BR')}
                      </p>
                      <Button
                        onClick={handleViewTerms}
                        variant="outline"
                        className="w-full border-cyan-700 text-cyan-300 hover:bg-cyan-900/30"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ler Termos Antes de Aceitar
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-700/30 p-4 rounded-lg">
                      <p className="text-red-300 text-sm">
                        ⚠️ Nenhum termo cadastrado no sistema. Entre em contato com o administrador.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleAcceptTermsNow}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-lg py-6"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Aceitar Termos Agora
                  </Button>

                  <p className="text-purple-400 text-xs text-center">
                    Ao clicar acima, você será redirecionado para aceitar os termos oficialmente
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Restaurar Backup */}
        <Card className="glass-card border-0 border-l-4 border-l-cyan-500">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-cyan-400" />
              Restaurar Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-purple-300 text-sm">
              Recebeu um arquivo de backup do administrador? Faça upload aqui para restaurar seus dados.
            </p>
            <div className="flex items-center gap-3">
              <input
                ref={backupInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                className="hidden"
                disabled={isRestoring}
              />
              <Button
                onClick={() => backupInputRef.current?.click()}
                disabled={isRestoring}
                className="bg-gradient-to-r from-cyan-600 to-blue-600"
              >
                {isRestoring ? "Restaurando..." : "Selecionar Arquivo"}
              </Button>
              {isRestoring && (
                <div className="text-cyan-400 text-sm animate-pulse">
                  Processando backup...
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg text-xs text-blue-200">
              <p className="font-semibold mb-1">ℹ️ Como funciona:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>O administrador gera seu backup pelo painel admin</li>
                <li>Você recebe o arquivo .json</li>
                <li>Faça upload aqui para restaurar seus dados</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Tema */}
        <Card className="glass-card border-0 neon-glow">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              Personalização
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div>
              <Label className="text-purple-200 mb-2 block">Tema</Label>
              <Select value={formData.theme} onValueChange={(value) => setFormData({...formData, theme: value})}>
                <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">🌙 Escuro (Padrão)</SelectItem>
                  <SelectItem value="light">☀️ Claro</SelectItem>
                  <SelectItem value="purple">💜 Roxo</SelectItem>
                  <SelectItem value="blue">💙 Azul</SelectItem>
                  <SelectItem value="green">💚 Verde</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex-1 border-red-700 text-red-400 hover:bg-red-900/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Modal de Termos Completos */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              📋 {terms?.title || "Termos de Uso"}
            </DialogTitle>
            {user.terms_accepted && (
              <p className="text-purple-300 text-sm mt-2">
                Versão {user.terms_version_accepted} • Aceita em {new Date(user.terms_accepted_at).toLocaleDateString('pt-BR')}
              </p>
            )}
            {!user.terms_accepted && terms && (
              <p className="text-yellow-300 text-sm mt-2">
                Versão {terms.version} • Vigente desde {new Date(terms.effective_date).toLocaleDateString('pt-BR')}
              </p>
            )}
          </DialogHeader>

          {terms && (
            <div className="space-y-6">
              {user.terms_accepted && (
                <div className="bg-green-900/20 border border-green-700/30 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-200 text-sm">
                      Você aceitou estes termos em <strong>{new Date(user.terms_accepted_at).toLocaleString('pt-BR')}</strong>
                    </p>
                  </div>
                </div>
              )}

              {!user.terms_accepted && (
                <div className="bg-yellow-900/20 border border-yellow-700/30 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <p className="text-yellow-200 text-sm">
                      <strong>Pré-visualização:</strong> Você ainda não aceitou estes termos. 
                      Para aceitar oficialmente, feche esta janela e clique em "Aceitar Termos Agora".
                    </p>
                  </div>
                </div>
              )}

              <div 
                className="prose prose-sm prose-invert max-w-none text-purple-100"
                dangerouslySetInnerHTML={{ __html: terms.content }}
              />
            </div>
          )}

          {!terms && (
            <div className="text-center py-12">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-300">Nenhum termo cadastrado no sistema.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}