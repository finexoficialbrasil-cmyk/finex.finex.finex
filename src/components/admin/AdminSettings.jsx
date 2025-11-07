
import React, { useState, useEffect } from "react";
import { SystemSettings } from "@/entities/SystemSettings";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Palette, Image, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    app_name: "FINEX", // Changed from "BASE44 FINEX" to "FINEX" as per outline
    app_logo_url: "",
    favicon_url: "" // ✅ NOVO: favicon
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false); // ✅ NOVO
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log("⚙️ Carregando configurações do sistema...");
      const allSettings = await SystemSettings.list();
      console.log("📋 Total de configurações:", allSettings.length);
      
      // Buscar configurações específicas
      const appName = allSettings.find(s => s.key === "app_name");
      const appLogo = allSettings.find(s => s.key === "app_logo_url");
      const favicon = allSettings.find(s => s.key === "favicon_url"); // ✅ NOVO
      
      console.log("📝 Nome do app:", appName?.value || "FINEX");
      console.log("🖼️ Logo do app:", appLogo?.value || "não definido");
      console.log("🎯 Favicon:", favicon?.value || "não definido"); // ✅ NOVO
      
      setSettings({
        app_name: appName?.value || "FINEX", // Changed from "BASE44 FINEX" to "FINEX" as per outline
        app_logo_url: appLogo?.value || "",
        favicon_url: favicon?.value || "" // ✅ NOVO
      });
    } catch (error) {
      console.error("❌ Erro ao carregar configurações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione uma imagem válida!");
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB!");
      return;
    }

    setIsUploading(true);
    try {
      console.log("📤 Fazendo upload do logo...");
      const { file_url } = await UploadFile({ file });
      console.log("✅ Logo enviado:", file_url);
      setSettings({ ...settings, app_logo_url: file_url });
    } catch (error) {
      console.error("❌ Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do logo. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ NOVA FUNÇÃO: Upload de favicon
  const handleFaviconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione uma imagem válida!");
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("O favicon deve ter no máximo 2MB!");
      return;
    }

    setIsUploadingFavicon(true);
    try {
      console.log("📤 Fazendo upload do favicon...");
      const { file_url } = await UploadFile({ file });
      console.log("✅ Favicon enviado:", file_url);
      setSettings({ ...settings, favicon_url: file_url });
    } catch (error) {
      console.error("❌ Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do favicon. Tente novamente.");
    } finally {
      setIsUploadingFavicon(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log("💾 Salvando configurações...");
      
      // Buscar configurações existentes
      const allSettings = await SystemSettings.list();
      const appNameSetting = allSettings.find(s => s.key === "app_name");
      const appLogoSetting = allSettings.find(s => s.key === "app_logo_url");
      const faviconSetting = allSettings.find(s => s.key === "favicon_url"); // ✅ NOVO
      
      // Atualizar ou criar app_name
      if (appNameSetting) {
        console.log("📝 Atualizando nome do app...");
        await SystemSettings.update(appNameSetting.id, {
          key: "app_name",
          value: settings.app_name,
          description: "Nome do aplicativo",
          category: "branding"
        });
      } else {
        console.log("📝 Criando configuração de nome do app...");
        await SystemSettings.create({
          key: "app_name",
          value: settings.app_name,
          description: "Nome do aplicativo",
          category: "branding"
        });
      }
      
      // Atualizar ou criar app_logo_url
      if (appLogoSetting) {
        console.log("🖼️ Atualizando logo do app...");
        await SystemSettings.update(appLogoSetting.id, {
          key: "app_logo_url",
          value: settings.app_logo_url,
          description: "URL do logo do aplicativo",
          category: "branding"
        });
      } else {
        console.log("🖼️ Criando configuração de logo do app...");
        await SystemSettings.create({
          key: "app_logo_url",
          value: settings.app_logo_url,
          description: "URL do logo do aplicativo",
          category: "branding"
        });
      }
      
      // ✅ NOVO: Atualizar ou criar favicon_url
      if (faviconSetting) {
        console.log("🎯 Atualizando favicon...");
        await SystemSettings.update(faviconSetting.id, {
          key: "favicon_url",
          value: settings.favicon_url,
          description: "URL do favicon do aplicativo",
          category: "branding"
        });
      } else {
        console.log("🎯 Criando configuração de favicon...");
        await SystemSettings.create({
          key: "favicon_url",
          value: settings.favicon_url,
          description: "URL do favicon do aplicativo",
          category: "branding"
        });
      }
      
      console.log("✅ Configurações salvas com sucesso!");
      alert("✅ Configurações salvas com sucesso! A página será recarregada para aplicar as mudanças.");
      
      // Recarregar a página para todos verem as mudanças
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("❌ Erro ao salvar configurações:", error);
      alert("❌ Erro ao salvar configurações. Tente novamente.");
    } finally {
      setIsSaving(false);
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
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            Branding do Aplicativo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Nome do App */}
            <div>
              <Label className="text-purple-200 text-sm">Nome do Aplicativo</Label>
              <Input
                value={settings.app_name}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                placeholder="Ex: Minha Fintech"
                className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
              />
              <p className="text-xs text-purple-400 mt-2">
                Este nome aparecerá no menu lateral para todos os usuários
              </p>
            </div>

            {/* Logo do App */}
            <div>
              <Label className="text-purple-200 text-sm">Logo do Aplicativo</Label>
              
              {/* Preview do Logo Atual */}
              {settings.app_logo_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 mb-3"
                >
                  <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-700/50 flex items-center gap-4">
                    <img
                      src={settings.app_logo_url}
                      alt="Logo Preview"
                      className="w-20 h-20 object-contain rounded-lg bg-white/10 p-2"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-purple-200 font-medium">Logo Atual</p>
                      <p className="text-xs text-purple-400 mt-1">Este logo aparecerá no menu para todos os usuários</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Upload Button */}
              <div className="mt-2">
                <label className="block">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    className="w-full border-purple-700 text-purple-300 hover:bg-purple-900/20 cursor-pointer"
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Image className="w-4 h-4 mr-2" />
                          {settings.app_logo_url ? "Alterar Logo" : "Enviar Logo"}
                        </>
                      )}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-xs text-purple-400 mt-2">
                  Formatos aceitos: PNG, JPG, SVG • Tamanho máximo: 5MB • Recomendado: 512x512px
                </p>
              </div>
            </div>

            {/* ✅ NOVO: Favicon do App */}
            <div>
              <Label className="text-purple-200 text-sm">Favicon (Ícone da Aba)</Label>
              
              {/* Preview do Favicon Atual */}
              {settings.favicon_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 mb-3"
                >
                  <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-700/50 flex items-center gap-4">
                    <img
                      src={settings.favicon_url}
                      alt="Favicon Preview"
                      className="w-8 h-8 object-contain rounded bg-white/10 p-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-purple-200 font-medium">Favicon Atual</p>
                      <p className="text-xs text-purple-400 mt-1">Este ícone aparecerá na aba do navegador</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Upload Button */}
              <div className="mt-2">
                <label className="block">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingFavicon}
                    className="w-full border-purple-700 text-purple-300 hover:bg-purple-900/20 cursor-pointer"
                    asChild
                  >
                    <span>
                      {isUploadingFavicon ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Image className="w-4 h-4 mr-2" />
                          {settings.favicon_url ? "Alterar Favicon" : "Enviar Favicon"}
                        </>
                      )}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconUpload}
                    className="hidden"
                    disabled={isUploadingFavicon}
                  />
                </label>
                <p className="text-xs text-purple-400 mt-2">
                  Formatos aceitos: PNG, ICO • Tamanho máximo: 2MB • Recomendado: 32x32px ou 64x64px
                </p>
              </div>
            </div>

            {/* Botão Salvar */}
            <Button
              onClick={handleSave}
              disabled={isSaving || isUploading || isUploadingFavicon}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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

      {/* Preview Card */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white text-sm">Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Preview Menu */}
          <div>
            <p className="text-xs text-purple-400 mb-2">Menu Lateral:</p>
            <div className="bg-[#0a0a0f] rounded-xl p-4 border border-purple-700/50">
              <div className="flex items-center gap-3">
                {settings.app_logo_url ? (
                  <img
                    src={settings.app_logo_url}
                    alt="Logo Preview"
                    className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-xl text-white">{settings.app_name || "Nome do App"}</h2>
                  <p className="text-xs text-purple-300">FINEX</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Favicon */}
          <div>
            <p className="text-xs text-purple-400 mb-2">Aba do Navegador:</p>
            <div className="bg-[#0a0a0f] rounded-xl p-4 border border-purple-700/50">
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
                {settings.favicon_url ? (
                  <img
                    src={settings.favicon_url}
                    alt="Favicon Preview"
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                )}
                <span className="text-xs text-white">{settings.app_name || "FINEX"} - Inteligência Financeira</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
