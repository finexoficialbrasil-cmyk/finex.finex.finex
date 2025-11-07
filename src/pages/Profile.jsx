
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User as UserIcon, Mail, Phone, Shield, Palette, Camera, Save, Loader2, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    theme: "dark",
    theme_particles: true,
    theme_scan_line: true,
    theme_text_gradient: true,
    theme_neon_border: true,
    theme_grid_bg: true,
    theme_glow_effects: true,
    theme_pulse_dots: true,
    theme_animation_speed: "normal"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    loadUser();
    document.title = "Meu Perfil - FINEX";
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      console.log("👤 Usuário carregado:", userData);
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        phone: userData.phone || "",
        avatar_url: userData.avatar_url || "",
        theme: userData.theme || "dark",
        theme_particles: userData.theme_particles !== false,
        theme_scan_line: userData.theme_scan_line !== false,
        theme_text_gradient: userData.theme_text_gradient !== false,
        theme_neon_border: userData.theme_neon_border !== false,
        theme_grid_bg: userData.theme_grid_bg !== false,
        theme_glow_effects: userData.theme_glow_effects !== false,
        theme_pulse_dots: userData.theme_pulse_dots !== false,
        theme_animation_speed: userData.theme_animation_speed || "normal"
      });
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
      alert("❌ Erro ao carregar perfil. Recarregue a página.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione uma imagem válida!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB!");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      console.log("📤 Fazendo upload da foto...");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      console.log("✅ Foto enviada:", file_url);
      setFormData({ ...formData, avatar_url: file_url });
      alert("✅ Foto carregada! Clique em 'Salvar Alterações' para confirmar.");
    } catch (error) {
      console.error("❌ Erro ao fazer upload:", error);
      alert("❌ Erro ao fazer upload da foto. Tente novamente.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || formData.full_name.trim() === "") {
      alert("❌ Por favor, preencha seu nome completo!");
      return;
    }

    setIsSaving(true);

    try {
      console.log("💾 Iniciando salvamento do perfil...");
      console.log("📝 Nome atual:", user.full_name);
      console.log("📝 Novo nome:", formData.full_name);
      
      const dataToUpdate = {
        full_name: formData.full_name.trim(),
        phone: formData.phone || "",
        avatar_url: formData.avatar_url || "",
        theme: formData.theme,
        theme_particles: formData.theme_particles,
        theme_scan_line: formData.theme_scan_line,
        theme_text_gradient: formData.theme_text_gradient,
        theme_neon_border: formData.theme_neon_border,
        theme_grid_bg: formData.theme_grid_bg,
        theme_glow_effects: formData.theme_glow_effects,
        theme_pulse_dots: formData.theme_pulse_dots,
        theme_animation_speed: formData.theme_animation_speed
      };

      console.log("📤 Dados que serão enviados:", JSON.stringify(dataToUpdate, null, 2));
      
      // ✅ Usar updateMe do SDK
      const result = await base44.auth.updateMe(dataToUpdate);
      
      console.log("✅ Resposta do servidor:", result);
      console.log("✅ Perfil atualizado com sucesso!");
      
      alert("✅ Perfil atualizado com sucesso!\n\n🔄 A página será recarregada para aplicar as mudanças.");
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("❌ ERRO COMPLETO:", error);
      console.error("❌ Mensagem:", error.message);
      console.error("❌ Stack:", error.stack);
      alert(`❌ Erro ao salvar perfil.\n\nDetalhes: ${error.message}\n\nTente novamente ou contate o suporte.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm("🚪 Tem certeza que deseja sair do sistema?")) {
      base44.auth.logout();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-purple-300 flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          Carregando perfil...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block p-4 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 mb-4"
          >
            <UserIcon className="w-12 h-12 text-purple-400 mx-auto mb-2" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Meu Perfil
            </h1>
          </motion.div>
          <p className="text-purple-300 text-lg">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Foto de Perfil */}
          <Card className="glass-card border-0 neon-glow">
            <CardHeader className="border-b border-purple-900/30">
              <CardTitle className="text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                Foto de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Avatar"
                      className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-4 border-purple-500">
                      <span className="text-white font-bold text-5xl">
                        {formData.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={isUploadingPhoto || isSaving}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingPhoto || isSaving}
                      className="w-full md:w-auto border-purple-700 text-purple-300 hover:bg-purple-900/20"
                      onClick={(e) => {
                        e.preventDefault();
                        e.target.previousElementSibling.click();
                      }}
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          {formData.avatar_url ? "Alterar Foto" : "Enviar Foto"}
                        </>
                      )}
                    </Button>
                  </label>
                  <p className="text-xs text-purple-400 mt-2">
                    Formatos: JPG, PNG • Tamanho máximo: 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Pessoais */}
          <Card className="glass-card border-0 neon-glow">
            <CardHeader className="border-b border-purple-900/30">
              <CardTitle className="text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-purple-400" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Nome Completo */}
              <div>
                <Label className="text-purple-200 flex items-center gap-2 font-semibold">
                  <UserIcon className="w-4 h-4" />
                  Nome Completo *
                </Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => {
                    console.log("✏️ Nome sendo digitado:", e.target.value);
                    setFormData({ ...formData, full_name: e.target.value });
                  }}
                  placeholder="Digite seu nome completo"
                  className="bg-purple-900/20 border-purple-700/50 text-white mt-2 font-medium text-lg"
                  disabled={isSaving}
                  required
                />
                <p className="text-xs text-cyan-400 mt-1">
                  ✏️ Este nome aparecerá em todo o sistema
                </p>
              </div>

              {/* Email */}
              <div>
                <Label className="text-purple-200 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-purple-900/20 border-purple-700/50 text-purple-400 mt-2"
                />
                <p className="text-xs text-purple-400 mt-1">
                  🔒 Email do Google não pode ser alterado
                </p>
              </div>

              {/* Telefone */}
              <div>
                <Label className="text-purple-200 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
                  disabled={isSaving}
                />
              </div>

              {user?.role === 'admin' && (
                <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-700/30">
                  <div className="flex items-center gap-2 text-yellow-300">
                    <Shield className="w-5 h-5" />
                    <span className="font-semibold">Administrador do Sistema</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tema e Aparência */}
          <Card className="glass-card border-0 neon-glow">
            <CardHeader className="border-b border-purple-900/30">
              <CardTitle className="text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                Tema e Aparência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-purple-200">Tema de Cor</Label>
                <Select
                  value={formData.theme}
                  onValueChange={(value) => setFormData({ ...formData, theme: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-2">
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

              <div>
                <Label className="text-purple-200">Velocidade das Animações</Label>
                <Select
                  value={formData.theme_animation_speed}
                  onValueChange={(value) => setFormData({ ...formData, theme_animation_speed: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">🐌 Lenta</SelectItem>
                    <SelectItem value="normal">⚡ Normal</SelectItem>
                    <SelectItem value="fast">🚀 Rápida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-purple-200 mb-3 block">Efeitos Visuais</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'theme_particles', label: '✨ Partículas Flutuantes' },
                    { key: 'theme_scan_line', label: '📡 Linha de Scan' },
                    { key: 'theme_text_gradient', label: '🌈 Gradiente no Texto' },
                    { key: 'theme_neon_border', label: '💫 Borda Neon' },
                    { key: 'theme_grid_bg', label: '🔲 Grid de Fundo' },
                    { key: 'theme_glow_effects', label: '✨ Brilhos de Fundo' },
                    { key: 'theme_pulse_dots', label: '🔵 Pontos Pulsantes' }
                  ].map(effect => (
                    <button
                      key={effect.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, [effect.key]: !formData[effect.key] })}
                      disabled={isSaving}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData[effect.key]
                          ? 'bg-purple-600/30 border-purple-500 text-white'
                          : 'bg-purple-900/20 border-purple-700/50 text-purple-300 hover:border-purple-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData[effect.key] ? 'bg-purple-500 border-purple-500' : 'border-purple-500'
                        }`}>
                          {formData[effect.key] && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-sm">{effect.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col md:flex-row gap-4">
            <Button
              type="submit"
              disabled={isSaving || isUploadingPhoto}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleLogout}
              variant="outline"
              className="md:w-48 border-red-700 text-red-400 hover:bg-red-900/20 py-6"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sair do Sistema
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
