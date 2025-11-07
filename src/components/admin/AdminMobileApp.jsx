import React, { useState, useEffect } from "react";
import { SystemSettings } from "@/entities/SystemSettings";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Save, Loader2, ExternalLink, Apple, Chrome, QrCode } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminMobileApp() {
  const [settings, setSettings] = useState({
    mobile_app_ios_url: "",
    mobile_app_android_url: "",
    mobile_app_qr_code_url: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const allSettings = await SystemSettings.list();
      
      const iosUrl = allSettings.find(s => s.key === "mobile_app_ios_url");
      const androidUrl = allSettings.find(s => s.key === "mobile_app_android_url");
      const qrCode = allSettings.find(s => s.key === "mobile_app_qr_code_url");
      
      setSettings({
        mobile_app_ios_url: iosUrl?.value || "",
        mobile_app_android_url: androidUrl?.value || "",
        mobile_app_qr_code_url: qrCode?.value || ""
      });
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRCodeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione uma imagem válida!");
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setSettings({ ...settings, mobile_app_qr_code_url: file_url });
      alert("✅ QR Code enviado com sucesso!");
    } catch (error) {
      alert("❌ Erro ao fazer upload do QR Code. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const allSettings = await SystemSettings.list();
      
      const settingsToSave = {
        mobile_app_ios_url: settings.mobile_app_ios_url,
        mobile_app_android_url: settings.mobile_app_android_url,
        mobile_app_qr_code_url: settings.mobile_app_qr_code_url
      };

      for (const [key, value] of Object.entries(settingsToSave)) {
        const existing = allSettings.find(s => s.key === key);
        
        if (existing) {
          await SystemSettings.update(existing.id, {
            key,
            value,
            description: `Configuração App Mobile: ${key}`,
            category: "integrations"
          });
        } else {
          await SystemSettings.create({
            key,
            value,
            description: `Configuração App Mobile: ${key}`,
            category: "integrations"
          });
        }
      }
      
      alert("✅ Configurações do App Mobile salvas com sucesso!");
      loadSettings();
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("❌ Erro ao salvar configurações.");
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
            <Smartphone className="w-5 h-5 text-purple-400" />
            Configurações do App Mobile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* iOS App Store */}
            <div>
              <Label className="text-purple-200 flex items-center gap-2 mb-2">
                <Apple className="w-4 h-4" />
                Link da App Store (iOS)
              </Label>
              <Input
                value={settings.mobile_app_ios_url}
                onChange={(e) => setSettings({ ...settings, mobile_app_ios_url: e.target.value })}
                placeholder="https://apps.apple.com/..."
                className="bg-purple-900/20 border-purple-700/50 text-white"
              />
              <p className="text-purple-400 text-xs mt-1">
                Cole o link da sua app na App Store da Apple
              </p>
              {settings.mobile_app_ios_url && (
                <a
                  href={settings.mobile_app_ios_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 text-xs flex items-center gap-1 mt-2 hover:text-cyan-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  Testar link
                </a>
              )}
            </div>

            {/* Android Google Play */}
            <div>
              <Label className="text-purple-200 flex items-center gap-2 mb-2">
                <Chrome className="w-4 h-4" />
                Link da Google Play (Android)
              </Label>
              <Input
                value={settings.mobile_app_android_url}
                onChange={(e) => setSettings({ ...settings, mobile_app_android_url: e.target.value })}
                placeholder="https://play.google.com/store/apps/..."
                className="bg-purple-900/20 border-purple-700/50 text-white"
              />
              <p className="text-purple-400 text-xs mt-1">
                Cole o link da sua app na Google Play Store
              </p>
              {settings.mobile_app_android_url && (
                <a
                  href={settings.mobile_app_android_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 text-xs flex items-center gap-1 mt-2 hover:text-cyan-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  Testar link
                </a>
              )}
            </div>

            {/* QR Code */}
            <div>
              <Label className="text-purple-200 flex items-center gap-2 mb-2">
                <QrCode className="w-4 h-4" />
                QR Code para Download
              </Label>
              
              {settings.mobile_app_qr_code_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-3"
                >
                  <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-700/50 inline-block">
                    <img
                      src={settings.mobile_app_qr_code_url}
                      alt="QR Code Preview"
                      className="w-32 h-32 rounded-lg border-2 border-purple-600"
                    />
                  </div>
                </motion.div>
              )}

              <div>
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
                          <QrCode className="w-4 h-4 mr-2" />
                          {settings.mobile_app_qr_code_url ? "Alterar QR Code" : "Enviar QR Code"}
                        </>
                      )}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQRCodeUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-purple-400 text-xs mt-2">
                  📱 Gere um QR Code que redirecione para o download do app
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-cyan-900/20 p-5 rounded-lg border border-cyan-700/30">
              <h4 className="text-cyan-300 font-bold mb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Como configurar
              </h4>
              <ul className="text-cyan-200 text-sm space-y-2">
                <li>1. Publique seu app na App Store e Google Play</li>
                <li>2. Copie os links das lojas e cole acima</li>
                <li>3. Gere um QR Code que redirecione para download</li>
                <li>4. Faça upload do QR Code</li>
                <li>5. Salve as configurações</li>
              </ul>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving || isUploading}
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
      {(settings.mobile_app_ios_url || settings.mobile_app_android_url) && (
        <Card className="glass-card border-0 neon-glow">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="text-white text-sm">Preview da Página de Download</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-[#0a0a0f] rounded-xl p-6 border border-purple-700/50 text-center">
              <p className="text-purple-300 text-sm mb-4">Os usuários verão:</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {settings.mobile_app_ios_url && (
                  <div className="bg-black px-6 py-3 rounded-xl">
                    <Apple className="w-5 h-5 text-white inline mr-2" />
                    <span className="text-white text-sm font-bold">App Store</span>
                  </div>
                )}
                {settings.mobile_app_android_url && (
                  <div className="bg-green-600 px-6 py-3 rounded-xl">
                    <Chrome className="w-5 h-5 text-white inline mr-2" />
                    <span className="text-white text-sm font-bold">Google Play</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}