import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { xhopanPayment } from "@/functions/xhopanPayment";

export default function XhopanPaymentFlow({ selectedPlan, user, xhopanState, setXhopanState, onSuccess, onCancel }) {
  const pollingRef = useRef(null);
  const pollingCountRef = useRef(0);
  const MAX_POLLS = 60; // 5 minutos (a cada 5s)

  useEffect(() => {
    if (!xhopanState.token && !xhopanState.loading && !xhopanState.error) {
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
    setXhopanState(s => ({ ...s, loading: true, error: null }));
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
          qrcode_base64: data.qrcode_base64 || data.qr_code_base64
        }));
      } else {
        setXhopanState(s => ({ ...s, loading: false, error: data.error || "Erro ao gerar QR Code" }));
      }
    } catch (err) {
      setXhopanState(s => ({ ...s, loading: false, error: err.message }));
    }
  };

  const checkPayment = async () => {
    try {
      const res = await xhopanPayment({
        action: "confirm_payment_token",
        token: xhopanState.token
      });
      const data = res.data;
      
      // ✅ SÓ confirmar se Xhopan validar o pagamento com sucesso
      // Não é suficiente só ter o token - precisa ter EVIDÊNCIA de debitação
      if (data.success && data.confirmed && data.debited) {
        stopPolling();
        setXhopanState(s => ({ ...s, confirmed: true }));
        onSuccess();
      } else {
        // Se ainda não foi debitado, continua aguardando
        console.log("⏳ Pagamento não detectado ainda. Token:", xhopanState.token);
      }
    } catch (err) {
      console.log("⏳ Verificando pagamento... (continuando)", err.message);
      // Continuar tentando
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
            <div className="bg-white p-4 rounded-xl inline-block shadow-lg shadow-cyan-500/20">
              {xhopanState.qrcode_base64 ? (
                <img
                  src={`data:image/png;base64,${xhopanState.qrcode_base64}`}
                  alt="QR Code Xhopan"
                  className="w-56 h-56 mx-auto"
                />
              ) : xhopanState.qrcode ? (
                <img
                  src={xhopanState.qrcode}
                  alt="QR Code Xhopan"
                  className="w-56 h-56 mx-auto"
                />
              ) : (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=224x224&data=${encodeURIComponent(xhopanState.token)}`}
                  alt="QR Code Xhopan"
                  className="w-56 h-56 mx-auto"
                />
              )}
            </div>
            <p className="text-cyan-300 text-sm mt-3">📱 Abra o Banco Xhopan e escaneie este QR Code</p>
          </div>

          {/* Copiar token para compartilhar */}
          <div className="flex gap-2 items-center bg-cyan-900/20 border border-cyan-700/40 rounded-xl p-3">
            <code className="flex-1 text-cyan-200 text-xs font-mono break-all">{xhopanState.token}</code>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(xhopanState.token);
                alert("✅ Token copiado! Envie para outro usuário pagar.");
              }}
              className="shrink-0 bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
            >
              📋 Copiar
            </Button>
          </div>
          <p className="text-cyan-400 text-xs text-center -mt-2">Compartilhe este código para outra pessoa pagar pelo app Xhopan</p>

          {/* Botão para gerar novo token se necessário */}
          <div className="text-center">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setXhopanState(s => ({
                  loading: false,
                  token: null,
                  qrcode: null,
                  qrcode_base64: null,
                  confirmed: false,
                  error: null
                }));
                setTimeout(generateToken, 100);
              }}
              variant="outline"
              className="border-cyan-700/50 text-cyan-200 hover:bg-cyan-900/30 text-xs"
            >
              🔄 Gerar Novo QR Code
            </Button>
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
          <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-blue-900/20 border border-blue-700/30">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <div className="text-blue-300 text-sm">
              <p className="font-semibold">⏳ Aguardando confirmação do Banco Xhopan...</p>
              <p className="text-xs mt-1 text-blue-400">Certifique-se de que o pagamento foi realizado no app Xhopan</p>
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