import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token, plan_type, amount } = await req.json();

    if (!token || !plan_type || !amount) {
      return Response.json({
        success: false,
        error: 'Token, plan_type e amount são obrigatórios'
      }, { status: 400 });
    }

    console.log(`🔍 Verificando pagamento Xhopan...`);
    console.log(`  Token: ${token}`);
    console.log(`  Plano: ${plan_type}`);
    console.log(`  Valor: R$ ${amount}`);
    console.log(`  Usuário: ${user.email}`);

    // ✅ Chamar Xhopan para confirmar o pagamento
    const xhopanApiSecret = Deno.env.get('XHOPAN_API_SECRET');
    const xhopanApiUrl = 'https://xhopan.base44.app/api/v1/payments';

    if (!xhopanApiSecret) {
      console.error('❌ XHOPAN_API_SECRET não configurado');
      return Response.json({
        success: false,
        error: 'Sistema não configurado para Xhopan'
      }, { status: 500 });
    }

    const xhopanRes = await fetch(xhopanApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${xhopanApiSecret}`
      },
      body: JSON.stringify({
        action: 'confirm_payment_token',
        payment_token: token
      })
    });

    const xhopanData = await xhopanRes.json();

    console.log(`📊 Resposta Xhopan:`, xhopanData);

    // ✅ Validar resposta do Xhopan
    if (!xhopanData.success || !xhopanData.confirmed || !xhopanData.debited) {
      console.warn(`⚠️ Pagamento não confirmado no Xhopan`);
      return Response.json({
        success: false,
        confirmed: false,
        error: 'Pagamento ainda não foi processado no Xhopan'
      }, { status: 400 });
    }

    console.log(`✅ Xhopan confirmou debitação! Ativando assinatura...`);

    // ✅ Ativar assinatura no FINEX
    try {
      const Subscription = base44.entities.Subscription;
      const User = base44.entities.User;

      // Calcular datas de início e fim baseado no plano
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let endDate = new Date(startDate);
      const planDurations = {
        'monthly': 1,
        'semester': 6,
        'annual': 12,
        'lifetime': 999 // Vitalício
      };

      const months = planDurations[plan_type] || 1;
      if (months !== 999) {
        endDate.setMonth(endDate.getMonth() + months);
      } else {
        endDate.setFullYear(2099, 11, 31); // Data bem distante para vitalício
      }

      const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      // Criar registro de assinatura
      const subscription = await Subscription.create({
        user_email: user.email,
        plan_type: plan_type,
        status: 'active',
        start_date: startStr,
        end_date: endStr,
        amount_paid: amount,
        payment_method: 'pix',
        transaction_id: token,
        notes: `Pagamento via Banco Xhopan - Token: ${token} - Debitado com sucesso`
      });

      // Atualizar dados do usuário
      await User.updateMyUserData({
        subscription_plan: plan_type,
        subscription_status: 'active',
        subscription_start_date: startStr,
        subscription_end_date: endStr
      });

      console.log(`✅ Assinatura criada e usuário atualizado!`);
      console.log(`  ID: ${subscription.id}`);
      console.log(`  Válida até: ${endStr}`);

      return Response.json({
        success: true,
        confirmed: true,
        message: 'Assinatura ativada com sucesso!',
        subscription: {
          id: subscription.id,
          plan_type: plan_type,
          status: 'active',
          start_date: startStr,
          end_date: endStr,
          amount_paid: amount
        }
      });

    } catch (subError) {
      console.error(`❌ Erro ao criar assinatura:`, subError);
      return Response.json({
        success: false,
        xhopan_confirmed: true,
        error: `Pagamento confirmado no Xhopan mas erro ao ativar: ${subError.message}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error(`❌ ERRO GERAL:`, error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});