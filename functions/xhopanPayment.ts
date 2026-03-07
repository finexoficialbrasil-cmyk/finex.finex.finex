import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const XHOPAN_API_URL = "https://api.xhopan/api/xhopan";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, plan_type, plan_name, amount, token } = body;

    const apiKey = Deno.env.get("XHOPAN_API_SECRET");
    if (!apiKey) {
      console.error("❌ XHOPAN_API_SECRET não configurada");
      return Response.json({ error: 'XHOPAN_API_SECRET não configurada' }, { status: 500 });
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };

    console.log(`🔄 Xhopan Action: ${action} | User: ${user.email}`);

    if (action === "generate_payment_token") {
      console.log(`💳 Gerando token para plano: ${plan_name} | Valor: R$ ${amount}`);
      
      const res = await fetch(XHOPAN_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "generate_payment_token",
          user_email: user.email,
          amount: amount,
          description: `Assinatura FINEX - ${plan_name}`
        })
      });

      const data = await res.json();
      console.log(`✅ Token gerado:`, { success: !!data.token, expires_in: data.expires_in });
      
      return Response.json({
        success: !!data.token,
        token: data.token,
        qr_code: data.qr_code,
        payment_token: data.token,
        qrcode: data.qr_code,
        expires_in: data.expires_in
      }, { status: res.status });
    }

    if (action === "check_balance") {
      console.log(`💰 Verificando saldo`);
      
      const res = await fetch(XHOPAN_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "check_balance",
          user_email: user.email
        })
      });

      const data = await res.json();
      console.log(`✅ Saldo: R$ ${data.balance}`);
      
      return Response.json(data, { status: res.status });
    }

    if (action === "confirm_payment_token") {
      console.log(`✅ Confirmando pagamento | Token: ${token}`);
      
      const res = await fetch(XHOPAN_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "confirm_payment_token",
          user_email: user.email,
          token: token
        })
      });

      const data = await res.json();
      console.log(`✅ Confirmação:`, { success: data.success, new_balance: data.new_balance });
      
      return Response.json({
        success: data.success,
        confirmed: data.success,
        message: data.message,
        new_balance: data.new_balance,
        transaction_id: data.transaction_id
      }, { status: res.status });
    }

    if (action === "debit") {
      console.log(`💸 Debitando saldo | Valor: R$ ${amount}`);
      
      const res = await fetch(XHOPAN_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "debit",
          user_email: user.email,
          amount: amount,
          description: `Assinatura FINEX - ${plan_name}`
        })
      });

      const data = await res.json();
      console.log(`✅ Débito realizado:`, { success: data.success, new_balance: data.new_balance });
      
      return Response.json({
        success: data.success,
        new_balance: data.new_balance,
        transaction_id: data.transaction_id
      }, { status: res.status });
    }

    return Response.json({ error: 'Action inválida' }, { status: 400 });

  } catch (error) {
    console.error("❌ Erro em xhopanPayment:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});