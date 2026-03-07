import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle, Wallet } from "lucide-react";
import { xhopanPayment } from "@/functions/xhopanPayment";

// Gera payload PIX BR Code padrão Banco Central
function generatePixPayload(token, amount) {
  const pixKey = token;
  const merchantName = "XHOPAN BANK";
  const merchantCity = "CUIABA";
  const txId = token.replace(/[^A-Z0-9]/gi, '').substring(0, 25).toUpperCase();
  const amountStr = amount ? amount.toFixed(2) : "0.00";

  const pad = (id, value) => {
    const len = String(value.length).padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const merchantAccountInfo = pad("00", "BR.GOV.BCB.PIX") + pad("01", pixKey);
  const additionalData = pad("05", txId);

  let payload =
    pad("00", "01") +
    pad("26", merchantAccountInfo) +
    pad("52", "0000") +
    pad("53", "986") +
    pad("54", amountStr) +
    pad("58", "BR") +
    pad("59", merchantName) +
    pad("60", merchantCity) +
    pad("62", additionalData) +
    "6304";

  // CRC16 CCITT
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return payload + (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export default function XhopanPaymentFlow({ selectedPlan, user, xhopanState, setXhopanState, onSuccess, onCancel }) {

  // Ao montar, gerar token + QR Code automaticamente
  useEffect(() => {
    if (!xhopanState.token && !xhopanState.loading && !xhopanState.error) {
      generateToken();
    }
  }, []);

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

  const confirmPayment = async () => {
    setXhopanState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await xhopanPayment({
        action: "confirm_payment_token",
        token: xhopanState.token
      });
      const data = res.data;
      if (data.success || data.confirmed) {
        setXhopanState(s => ({ ...s, loading: false, confirmed: true }));
        onSuccess();
      } else {
        setXhopanState(s => ({ ...s, loading: false, error: data.error || "Pagamento não confirmado ainda. Verifique se escaneou o QR Code no Banco Xhopan." }));
      }
    } catch (err) {
      setXhopanState(s => ({ ...s, loading: false, error: err.message }));
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

      {/* Loading */}
      {xhopanState.loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="text-cyan-300 text-sm">
            {xhopanState.confirmed ? "Ativando assinatura..." : xhopanState.token ? "Confirmando pagamento..." : "Gerando QR Code..."}
          </p>
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

      {/* QR Code gerado */}
      {xhopanState.token && !xhopanState.loading && !xhopanState.confirmed && (
        <>
          <div className="text-center">
            {xhopanState.qrcode_base64 ? (
              <div className="bg-white p-4 rounded-xl inline-block shadow-lg shadow-cyan-500/20">
                <img
                  src={`data:image/png;base64,${xhopanState.qrcode_base64}`}
                  alt="QR Code Xhopan"
                  className="w-56 h-56 mx-auto"
                />
              </div>
            ) : xhopanState.qrcode ? (
              <div className="bg-white p-4 rounded-xl inline-block shadow-lg shadow-cyan-500/20">
                <img
                  src={xhopanState.qrcode}
                  alt="QR Code Xhopan"
                  className="w-56 h-56 mx-auto"
                />
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl inline-block shadow-lg shadow-cyan-500/20">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=224x224&data=${encodeURIComponent(generatePixPayload(xhopanState.token, selectedPlan?.price))}`}
                  alt="QR Code Xhopan"
                  className="w-56 h-56 mx-auto"
                />
              </div>
            )}
            <p className="text-cyan-300 text-sm mt-3">📱 Abra o Banco Xhopan e escaneie este QR Code</p>
          </div>

          {/* Instruções */}
          <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/30">
            <ol className="text-blue-200 text-sm space-y-2 list-decimal list-inside">
              <li>Abra o app <strong>Banco Xhopan</strong> em <a href="https://xhopan.base44.app" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">xhopan.base44.app</a></li>
              <li>Vá em <strong>PIX → Pagar / Escanear</strong></li>
              <li>Aponte a câmera para o QR Code acima</li>
              <li>Confirme o débito de <strong>R$ {selectedPlan?.price?.toFixed(2)}</strong> do seu saldo</li>
              <li>Clique em <strong>"Confirmar Pagamento"</strong> abaixo</li>
            </ol>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-purple-700/50 text-purple-200 hover:bg-purple-900/30"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmPayment}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Pagamento
            </Button>
          </div>
        </>
      )}
    </div>
  );
}