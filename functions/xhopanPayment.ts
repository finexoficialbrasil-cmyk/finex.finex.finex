import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const XHOPAN_API_URL = "https://api.base44.app/api/apps/6983682c6d8afe8c8522e760/functions";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, plan_type, plan_name, amount } = body;

    const apiKey = Deno.env.get("XHOPAN_API_SECRET");
    if (!apiKey) {
      return Response.json({ error: 'XHOPAN_API_SECRET não configurada' }, { status: 500 });
    }

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey
    };

    if (action === "generate_payment_token") {
      // Gera token + QR Code para o usuário pagar com saldo Xhopan
      const res = await fetch(`${XHOPAN_API_URL}/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "generate_payment_token",
          user_email: user.email,
          amount: amount,
          description: `Assinatura FINEX - ${plan_name}`,
          metadata: {
            plan_type,
            finex_user_id: user.id,
            finex_user_email: user.email
          }
        })
      });

      const data = await res.json();
      return Response.json(data, { status: res.status });
    }

    if (action === "check_balance") {
      const res = await fetch(`${XHOPAN_API_URL}/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "check_balance",
          user_email: user.email
        })
      });

      const data = await res.json();
      return Response.json(data, { status: res.status });
    }

    if (action === "confirm_payment_token") {
      const { token } = body;
      const res = await fetch(`${XHOPAN_API_URL}/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "confirm_payment_token",
          token: token
        })
      });

      const data = await res.json();
      return Response.json(data, { status: res.status });
    }

    return Response.json({ error: 'Action inválida' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});