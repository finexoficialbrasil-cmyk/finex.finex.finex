import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, CheckCircle, AlertTriangle, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CompleteProfile() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      // ✅ VERIFICAR SE TEM TELEFONE
      if (!userData.phone || userData.phone.trim() === "") {
        setShowModal(true);
      }
    } catch (error) {
      console.error("Erro ao verificar perfil:", error);
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formata: (XX) XXXXX-XXXX
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    return value;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError("");
  };

  const validatePhone = (phone) => {
    // Remove formatação
    const numbers = phone.replace(/\D/g, '');
    
    // Validar: deve ter 10 (fixo) ou 11 (celular) dígitos
    if (numbers.length < 10 || numbers.length > 11) {
      return "Telefone inválido. Use formato: (XX) XXXXX-XXXX";
    }
    
    // Validar DDD
    const ddd = parseInt(numbers.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      return "DDD inválido";
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validar telefone
    const validationError = validatePhone(phoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Salvar no banco
      await User.updateMyUserData({
        phone: phoneNumber.replace(/\D/g, ''), // Salvar apenas números
        whatsapp_notifications: whatsappNotifications,
        phone_verified: false // Será verificado depois
      });
      
      alert("✅ Telefone cadastrado com sucesso!\n\nAgora você poderá receber cobranças e notificações via WhatsApp!");
      setShowModal(false);
      window.location.reload(); // Recarregar para atualizar
    } catch (error) {
      console.error("Erro ao salvar telefone:", error);
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Não renderizar nada se não precisa mostrar modal
  if (!showModal) return null;

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="max-w-md w-full"
          >
            <Card className="glass-card border-2 border-cyan-500/50 shadow-2xl">
              <CardHeader className="border-b border-cyan-900/30 text-center pb-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center mb-4 animate-pulse">
                  <Phone className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  📱 Complete seu Cadastro
                </CardTitle>
                <p className="text-purple-300 text-sm mt-2">
                  Para receber cobranças e avisos via WhatsApp
                </p>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Info Box */}
                  <div className="p-4 rounded-lg bg-cyan-900/20 border border-cyan-700/30">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-cyan-200">
                        <p className="font-semibold mb-1">💬 Por que precisamos do seu telefone?</p>
                        <ul className="space-y-1 text-cyan-300">
                          <li>• Avisos de vencimento via WhatsApp</li>
                          <li>• Cobranças mais efetivas</li>
                          <li>• Comunicação rápida e direta</li>
                          <li>• Suporte prioritário</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div>
                    <Label className="text-purple-200 font-semibold mb-2 block">
                      Número de WhatsApp *
                    </Label>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      className="bg-purple-900/20 border-purple-700/50 text-white text-lg"
                      maxLength={15}
                      required
                    />
                    {error && (
                      <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    )}
                    <p className="text-purple-400 text-xs mt-2">
                      ℹ️ Use o número com DDD (ex: 65 98129-7511)
                    </p>
                  </div>

                  {/* WhatsApp Notifications Checkbox */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-900/20 border border-green-700/30">
                    <Checkbox
                      id="whatsapp"
                      checked={whatsappNotifications}
                      onCheckedChange={setWhatsappNotifications}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="whatsapp" className="text-green-200 font-medium cursor-pointer">
                        Aceito receber notificações via WhatsApp
                      </Label>
                      <p className="text-green-300 text-xs mt-1">
                        Cobranças, avisos de vencimento e novidades
                      </p>
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-700/30">
                    <div className="flex items-center gap-2 text-purple-200 text-xs">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>
                        🔒 Seu número está seguro. Não compartilhamos com terceiros.
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !phoneNumber}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-lg py-6"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Salvar e Continuar
                      </>
                    )}
                  </Button>
                </form>

                {/* Skip Link (opcional) */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-purple-400 text-sm hover:text-purple-300 transition-colors"
                  >
                    Completar depois
                  </button>
                  <p className="text-purple-500 text-xs mt-1">
                    ⚠️ Sem telefone, não receberá cobranças via WhatsApp
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}