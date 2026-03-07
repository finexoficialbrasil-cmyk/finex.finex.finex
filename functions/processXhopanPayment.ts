import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription_id, plan_type, amount } = await req.json();

    console.log(`🎯 Processando pagamento Xhopan para: ${user.email}`);
    console.log(`📊 Detalhes: Plano=${plan_type}, Valor=R$ ${amount}`);

    // ✅ Buscar a subscription
    const allSubscriptions = await base44.asServiceRole.entities.Subscription.list();
    const subscription = allSubscriptions.find(s => s.id === subscription_id);

    if (!subscription) {
      console.error(`❌ Subscription não encontrada: ${subscription_id}`);
      return Response.json({ error: 'Subscription não encontrada' }, { status: 404 });
    }

    // ✅ Se já está ativa, não processar novamente
    if (subscription.status === 'active') {
      console.log(`⚠️ Subscription já está ativa: ${subscription_id}`);
      return Response.json({ 
        success: true, 
        message: 'Assinatura já está ativa',
        already_active: true 
      });
    }

    // 🏦 DEBITAR DO BANCO XHOPAN
    const xhopanApiSecret = Deno.env.get("XHOPAN_API_SECRET");
    let xhopanDebitResult = null;
    let debitSuccess = false;

    if (xhopanApiSecret) {
      try {
        console.log(`💳 Debitando R$ ${amount} do Banco Xhopan...`);
        const xhopanDebitResponse = await fetch("https://api.base44.app/api/apps/6983682c6d8afe8c8522e760/functions/xhopanPayAPI", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${xhopanApiSecret}`
          },
          body: JSON.stringify({
            action: "debit",
            user_email: user.email,
            amount: amount,
            description: `Assinatura FINEX - ${plan_type === 'monthly' ? 'Mensal' : plan_type === 'semester' ? 'Semestral' : plan_type === 'annual' ? 'Anual' : 'Vitalício'}`
          })
        });

        xhopanDebitResult = await xhopanDebitResponse.json();
        
        if (xhopanDebitResult.success) {
          debitSuccess = true;
          console.log(`✅ Saldo debitado com sucesso!`, {
            new_balance: xhopanDebitResult.new_balance,
            transaction_id: xhopanDebitResult.transaction_id
          });
        } else {
          console.warn(`⚠️ Débito no Xhopan falhou - ${xhopanDebitResult.error}`);
          debitSuccess = false;
        }
      } catch (xhopanError) {
        console.error("❌ Erro ao debitar no Xhopan:", xhopanError.message);
        debitSuccess = false;
      }
    } else {
      console.warn("⚠️ XHOPAN_API_SECRET não configurada");
      return Response.json({ error: 'XHOPAN_API_SECRET não configurada' }, { status: 500 });
    }

    // ✅ Se débito falhou, não ativar assinatura
    if (!debitSuccess) {
      console.error("❌ Débito falhou - não ativando assinatura");
      await base44.asServiceRole.entities.Subscription.update(subscription_id, {
        status: "pending",
        notes: "❌ Débito no Xhopan falhou. Tente novamente."
      });
      return Response.json({ 
        success: false, 
        error: 'Débito no Xhopan falhou',
        message: 'Erro ao processar pagamento. Saldo não foi debitado.'
      });
    }

    // ✅ ATIVAR A ASSINATURA
    console.log("🎉 ATIVANDO ASSINATURA!");
    
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const activationDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    
    const endDate = new Date(startDate);
    
    switch(plan_type) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'semester':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'annual':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'lifetime':
        endDate.setFullYear(endDate.getFullYear() + 100);
        break;
    }
    
    const expirationDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    // ✅ Atualizar subscription
    await base44.asServiceRole.entities.Subscription.update(subscription_id, {
      status: "active",
      start_date: activationDate,
      end_date: expirationDate,
      transaction_id: xhopanDebitResult?.transaction_id || null,
      notes: `✅ Ativado automaticamente via Xhopan | TX: ${xhopanDebitResult?.transaction_id || 'N/A'}`
    });

    // ✅ Atualizar usuário
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.email === user.email);
    
    if (targetUser) {
      await base44.asServiceRole.entities.User.update(targetUser.id, {
        subscription_status: "active",
        subscription_plan: plan_type,
        subscription_end_date: expirationDate,
        trial_started_at: null,
        trial_ends_at: null
      });
      console.log(`✅ Usuário atualizado: ${user.email}`);
    }

    // ✅ Enviar email de confirmação
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: "✅ Assinatura Ativada - FINEX",
        body: `
          <h2>🎉 Sua assinatura foi ativada com sucesso!</h2>
          <p>Olá <strong>${user.full_name}</strong>,</p>
          <p>Seu pagamento foi processado e sua assinatura já está ativa!</p>
          <ul>
            <li><strong>Plano:</strong> ${plan_type === 'monthly' ? 'Mensal' : plan_type === 'semester' ? 'Semestral' : plan_type === 'annual' ? 'Anual' : 'Vitalício'}</li>
            <li><strong>Valor:</strong> R$ ${amount.toFixed(2)}</li>
            <li><strong>Válido até:</strong> ${new Date(expirationDate + 'T12:00:00').toLocaleDateString('pt-BR')}</li>
          </ul>
          <p>Aproveite todos os recursos do FINEX! 🚀</p>
        `
      });
      console.log(`📧 Email de confirmação enviado`);
    } catch (emailError) {
      console.error("⚠️ Erro ao enviar email:", emailError);
    }

    return Response.json({
      success: true,
      message: "✅ Pagamento processado e assinatura ativada!",
      activation: {
        start_date: activationDate,
        end_date: expirationDate,
        transaction_id: xhopanDebitResult?.transaction_id
      }
    });

  } catch (error) {
    console.error("❌ Erro ao processar pagamento Xhopan:", error);
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
});