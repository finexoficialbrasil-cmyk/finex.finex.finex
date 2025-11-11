import React, { useState } from "react";
import { User } from "@/entities/User";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, AlertTriangle, Shield, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function PhoneVerificationModal({ user, onPhoneUpdated }) {
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isOpen = !user?.phone || user.phone.trim() === "";

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const validatePhone = (phoneNumber) => {
    const numbers = phoneNumber.replace(/\D/g, '');
    
    if (numbers.length < 10 || numbers.length > 11) {
      return "Telefone inválido. Use formato: (XX) XXXXX-XXXX";
    }
    
    const ddd = parseInt(numbers.slice(0, 2));
    if (ddd < 11 || ddd > 99) {
      return "DDD inválido";
    }
    
    if (numbers.length === 11 && numbers[2] !== '9') {
      return "Celular deve começar com 9";
    }
    
    return null;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validatePhone(phone);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const numbers = phone.replace(/\D/g, '');
      const internationalPhone = `+55${numbers}`;
      
      console.log("📞 Salvando telefone:", internationalPhone);
      
      await User.updateMyUserData({
        phone: internationalPhone,
        phone_verified: true
      });
      
      console.log("✅ Telefone salvo com sucesso!");
      
      if (onPhoneUpdated) {
        onPhoneUpdated(internationalPhone);
      }
      
      window.location.reload();
      
    } catch (error) {
      console.error("❌ Erro ao salvar telefone:", error);
      setError("Erro ao salvar telefone. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="glass-card border-purple-700/50 text-white w-[95vw] max-w-md max-h-[95vh] overflow-y-auto p-4 sm:p-6"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent text-center">
            📱 Verificação de Telefone Obrigatória
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Ilustração */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-2xl"></div>
              <div className="relative p-4 sm:p-6 rounded-full bg-gradient-to-br from-green-600 to-emerald-600">
                <Smartphone className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Explicação */}
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-700/30 p-3 sm:p-4 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-300 font-bold mb-2 text-sm sm:text-base">
                    Por que precisamos do seu telefone?
                  </p>
                  <ul className="text-yellow-200 text-xs sm:text-sm space-y-1">
                    <li>✅ Enviar avisos de vencimento de assinatura</li>
                    <li>✅ Notificar sobre cobranças importantes</li>
                    <li>✅ Comunicados e atualizações do sistema</li>
                    <li>✅ Suporte rápido via WhatsApp</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-900/20 border border-green-700/30 p-3 sm:p-4 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-300 font-bold mb-1 text-sm sm:text-base">
                    🔒 Seus dados estão seguros
                  </p>
                  <p className="text-green-200 text-xs sm:text-sm">
                    Não compartilhamos seu telefone com terceiros. 
                    Usamos apenas para comunicação oficial do FINEX.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-purple-200 mb-2 block text-sm sm:text-base">
                <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                Número de Telefone *
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(65) 98129-7511"
                required
                className="bg-purple-900/20 border-purple-700/50 text-white text-base sm:text-lg"
                maxLength={15}
              />
              <p className="text-purple-400 text-xs mt-2">
                📱 Digite seu celular com DDD (usado para WhatsApp)
              </p>
              {error && (
                <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                  {error}
                </p>
              )}
            </div>

            {/* Exemplo */}
            <div className="bg-cyan-900/20 border border-cyan-700/30 p-3 sm:p-4 rounded-lg">
              <p className="text-cyan-300 text-xs sm:text-sm mb-2 font-bold">
                📝 Exemplo de formato válido:
              </p>
              <div className="space-y-1 text-cyan-200 text-xs sm:text-sm">
                <p>✅ (65) 98129-7511</p>
                <p>✅ (11) 99876-5432</p>
                <p>✅ (21) 3456-7890 (fixo)</p>
              </div>
            </div>

            {/* Aviso Bloqueio */}
            <div className="bg-red-900/20 border border-red-700/30 p-3 sm:p-4 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs sm:text-sm font-bold">
                  ⚠️ OBRIGATÓRIO: Você não poderá usar o sistema sem cadastrar um telefone válido!
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !phone}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-base sm:text-lg py-5 sm:py-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Confirmar e Continuar
                </>
              )}
            </Button>

            <p className="text-purple-400 text-xs text-center">
              Ao continuar, você concorda em receber comunicações importantes via WhatsApp
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}