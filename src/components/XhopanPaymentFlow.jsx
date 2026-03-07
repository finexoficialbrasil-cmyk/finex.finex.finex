import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { xhopanPayment } from "@/functions/xhopanPayment";

export default function XhopanPaymentFlow({ selectedPlan, user, xhopanState, setXhopanState, onSuccess, onCancel }) {
  const pollingRef = useRef(null);
  const pollingCountRef = useRef(0);
  const MAX_POLLS = 120; // 10 minutos (a cada 5s)

  useEffect(() => {
    // Gerar token APENAS na primeira vez - não regenerar
    if (!xhopanState.token && !xhopanState.loading && !xhopanState.error && !xhopanState.attempted) {
      generateToken();
    }
  }, []);

  // Iniciar polling quando tiver token
  useEffect(() => {
    if (xhopanState.token && !xhopanState.confirmed && !xhopanState.loading) {
      startPolling();
    }
    return () => stopPolling();
  }, [xhopanState.token]);

  const startPolling = () => {
    stopPolling();
    pollingCountRef.current = 0;
    pollingRef.current = setInterval(async () => {
      pollingCountRef.current++;
      if (pollingCountRef.current >= MAX_POLLS) {
        stopPolling();
        setXhopanState(s => ({ ...s, error: "Tempo de pagamento expirado. Gere um novo QR Code." }));
        return;
      }
      await checkPayment();
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const generateToken = async () => {
    setXhopanState(s => ({ ...s, loading: true, error: null, attempted: true }));
    try {
      const res = await xhopanPayment({
        action: "generate_payment_token",
        plan_type: selectedPlan.plan_type,
        plan_name: selectedPlan.name,
        amount: selectedPlan.price
      });
      const data = res.data;
      if (data.success || data.token || data.payment_token) {
        setXhopanState(s => ({
          ...s,
          loading: false,
          token: data.payment_token || data.token,
          qrcode: data.qrcode || data.qr_code,
          qrcode_base64: data.qrcode_base64 || data.qr_code_base64,
          attempted: true
        }));
      } else {
        setXhopanState(s => ({ ...s, loading: false, error: data.error || "Erro ao gerar QR Code", attempted: true }));
      }
    } catch (err) {
      setXhopanState(s => ({ ...s, loading: false, error: err.message, attempted: true }));
    }
  };

  const checkPayment = async () => {
    try {
      const res = await xhopanPayment({
        action: "confirm_payment_token",
        token: xhopanState.token
      });
      const data = res.data;
      
      if (data.success || data.confirmed) {
        stopPolling();
        setXhopanState(s => ({ ...s, confirmed: true }));
        onSuccess();
      } else if (data.error && data.error.includes("already used")) {
        // Token foi usado = pagamento confirmado!
        stopPolling();
        setXhopanState(s => ({ ...s, confirmed: true }));
        onSuccess();
      }
      // Se não confirmado ainda, polling continua silenciosamente
    } catch (err) {
      // Ignorar erros de polling, continuar tentando
      console.log(`⏳ Aguardando confirmação... (tentativa ${pollingCountRef.current}/${MAX_POLLS})`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-cyan-900/20 border border-cyan-700/40">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl shrink-0">
          🏦
        </div>
        <div>
          <h3 className="text-white font-bold">Pagar com Banco Xhopan</h3>
          <p className="text-cyan-300 text-sm">Escaneie o QR Code pelo app Xhopan para debitar seu saldo</p>
        </div>
      </div>

      {/* Valor */}
      <div className="text-center p-5 rounded-xl bg-cyan-600/20 border-2 border-cyan-500/40">
        <p className="text-cyan-300 text-sm font-semibold mb-1">💰 Valor a Pagar</p>
        <p className="text-4xl font-bold text-white">R$ {selectedPlan?.price?.toFixed(2)}</p>
        <p className="text-cyan-300 text-xs mt-1">{selectedPlan?.name}</p>
      </div>

      {/* Loading inicial */}
      {xhopanState.loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="text-cyan-300 text-sm">Gerando QR Code...</p>
        </div>
      )}

      {/* Erro */}
      {xhopanState.error && !xhopanState.loading && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-bold text-sm mb-1">Erro</p>
            <p className="text-red-200 text-sm">{xhopanState.error}</p>
            <Button
              size="sm"
              onClick={generateToken}
              className="mt-2 bg-red-700 hover:bg-red-600 text-white text-xs"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      )}

      {/* QR Code gerado - aguardando pagamento automaticamente */}
      {xhopanState.token && !xhopanState.loading && !xhopanState.confirmed && !xhopanState.error && (
        <>
          <div className="text-center">
            <div className="bg-white p-6 rounded-xl inline-block shadow-lg shadow-cyan-500/20">
              {xhopanState.qrcode_base64 ? (
                <img
                  src={`data:image/png;base64,${xhopanState.qrcode_base64}`}
                  alt="QR Code Xhopan"
                  className="w-64 h-64"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              ) : xhopanState.qrcode ? (
                <img
                  src={xhopanState.qrcode}
                  alt="QR Code Xhopan"
                  className="w-64 h-64"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              ) : (
                <svg viewBox="0 0 250 250" className="w-64 h-64">
                  <rect width="250" height="250" fill="white"/>
                  <image 
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(xhopanState.token)}`}
                    width="250" 
                    height="250" 
                  />
                </svg>
              )}
            </div>
            <p className="text-cyan-300 text-sm mt-4">📱 Abra o Banco Xhopan e escaneie este QR Code</p>
          </div>

          {/* Instruções simplificadas */}
          <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/30">
            <ol className="text-blue-200 text-sm space-y-2 list-decimal list-inside">
              <li>Abra o app <strong>Banco Xhopan</strong> em <a href="https://xhopan.base44.app" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">xhopan.base44.app</a></li>
              <li>Vá em <strong>PIX → Pagar / Escanear</strong></li>
              <li>Aponte a câmera para o QR Code acima</li>
              <li>Confirme o débito de <strong>R$ {selectedPlan?.price?.toFixed(2)}</strong> do seu saldo</li>
            </ol>
          </div>

          {/* Status de detecção automática */}
          <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-green-900/20 border border-green-700/30">
            <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
            <div>
              <p className="text-green-300 text-sm font-semibold">
                ⚡ Detectando pagamento automaticamente...
              </p>
              <p className="text-green-400 text-xs mt-1">
                Isso pode levar alguns segundos. Não feche esta tela.
              </p>
            </div>
          </div>

          {/* Botão cancelar */}
          <Button
            type="button"
            variant="outline"
            onClick={() => { stopPolling(); onCancel(); }}
            className="w-full border-purple-700/50 text-purple-200 hover:bg-purple-900/30"
          >
            Cancelar
          </Button>
        </>
      )}

      {/* Confirmado - Mensagem verde de sucesso */}
      {xhopanState.confirmed && (
        <div className="text-center py-8 space-y-4">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <div>
            <p className="text-green-300 text-2xl font-bold">✅ Pagamento Realizado!</p>
            <p className="text-green-200 text-lg mt-1">Desfrute do seu FINEX 🚀</p>
          </div>
          <div className="bg-green-900/30 border border-green-600/40 rounded-xl p-4">
            <p className="text-green-300 text-sm">🎉 Sua assinatura <strong>{selectedPlan?.name}</strong> foi ativada com sucesso!</p>
            <p className="text-green-400 text-xs mt-2">Redirecionando em instantes...</p>
          </div>
          <Loader2 className="w-5 h-5 text-green-400 animate-spin mx-auto" />
        </div>
      )}
    </div>
  );
}