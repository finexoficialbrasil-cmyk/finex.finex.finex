import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICONS = {
  success: { Icon: Check, color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/40" },
  warning: { Icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/40" },
  error: { Icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40" },
  info: { Icon: Info, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/40" },
};

export default function AlertModal({ open, onOpenChange, type = "info", title, message, confirmText = "Entendi" }) {
  const { Icon, color, bg, border } = ICONS[type] || ICONS.info;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-purple-700/50 text-white max-w-[90vw] sm:max-w-md p-0 overflow-hidden rounded-2xl">
        {/* Botão X de fechar */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-20 p-1.5 rounded-lg bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 hover:text-white transition-all"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center px-6 pt-10 pb-6">
          {/* Ícone */}
          <div className={`p-4 rounded-full ${bg} border-2 ${border} mb-5`}>
            <Icon className={`w-8 h-8 ${color}`} />
          </div>

          {/* Título */}
          {title && (
            <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
          )}

          {/* Mensagem */}
          <p className="text-sm text-purple-200 leading-relaxed mb-6 whitespace-pre-line">
            {message}
          </p>

          {/* Botão */}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg"
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}