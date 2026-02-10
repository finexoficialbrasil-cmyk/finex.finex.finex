import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription_id, proof_url, expected_amount, plan_type } = await req.json();

    console.log("🔍 Analisando comprovante PIX...");
    console.log("📊 Valor esperado:", expected_amount);
    console.log("📋 Tipo de plano:", plan_type);

    // ✅ Usar IA para analisar o comprovante
    let analysisResult;
    try {
      analysisResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em validação de comprovantes bancários PIX brasileiros.

ANALISE ESTA IMAGEM e identifique:

1. É um COMPROVANTE BANCÁRIO VÁLIDO de PIX? (tem logo de banco, dados de transferência, valor, etc)
2. VALOR PAGO (número exato em reais - ex: 50.00, 100.00)

REGRAS IMPORTANTES:
- Se NÃO for um comprovante bancário (foto qualquer, print de conversa, etc) → is_valid = false
- Se for comprovante válido de PIX → is_valid = true
- O valor esperado é R$ ${expected_amount.toFixed(2)}
- Tolerância de até R$ 0,50 centavos

Retorne JSON:
{
  "is_valid": boolean,
  "amount_paid": number,
  "bank": string,
  "confidence": "high" | "medium" | "low"
}`,
        add_context_from_internet: false,
        file_urls: [proof_url],
        response_json_schema: {
          type: "object",
          properties: {
            is_valid: { type: "boolean" },
            amount_paid: { type: "number" },
            bank: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] }
          },
          required: ["is_valid", "amount_paid"]
        }
      });
    } catch (llmError) {
      console.error("❌ Erro na IA:", llmError);
      throw new Error("Não foi possível analisar a imagem. Verifique se enviou um comprovante válido.");
    }

    console.log("📊 Resultado da análise:", analysisResult);

    const analysis = analysisResult;
    
    // ✅ Verificar se o valor corresponde (tolerância de R$ 0,50)
    const amountDifference = Math.abs(analysis.amount_paid - expected_amount);
    const amountMatches = amountDifference <= 0.50;

    console.log("💰 Diferença de valor:", amountDifference);
    console.log("✅ Valor corresponde:", amountMatches);

    let subscriptionStatus = "pending";
    let activationDate = null;
    let expirationDate = null;

    // ✅ Se o valor corresponder E o comprovante for válido = ATIVAR AUTOMATICAMENTE
    if (amountMatches && analysis.is_valid) {
      console.log("🎉 ATIVANDO ASSINATURA AUTOMATICAMENTE!");
      
      // Calcular datas
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      activationDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      
      const endDate = new Date(startDate);
      
      // Calcular data de expiração baseado no tipo de plano
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
          endDate.setFullYear(endDate.getFullYear() + 100); // 100 anos = vitalício
          break;
      }
      
      expirationDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      
      subscriptionStatus = "active";

      // ✅ Atualizar subscription
      await base44.asServiceRole.entities.Subscription.update(subscription_id, {
        status: "active",
        start_date: activationDate,
        end_date: expirationDate,
        notes: `Ativado automaticamente via IA | Banco: ${analysis.bank || 'N/A'} | Confiança: ${analysis.confidence}`
      });

      // ✅ Atualizar usuário
      const { updateMe } = await import('npm:@base44/sdk@0.8.6');
      await base44.asServiceRole.auth.updateUser(user.email, {
        subscription_status: "active",
        subscription_plan: plan_type,
        subscription_end_date: expirationDate,
        trial_started_at: null,
        trial_ends_at: null
      });

      // ✅ Enviar email de confirmação
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: "✅ Assinatura Ativada - FINEX",
          body: `
            <h2>🎉 Sua assinatura foi ativada com sucesso!</h2>
            <p>Olá <strong>${user.full_name}</strong>,</p>
            <p>Seu pagamento foi confirmado e sua assinatura já está ativa!</p>
            <ul>
              <li><strong>Plano:</strong> ${plan_type === 'monthly' ? 'Mensal' : plan_type === 'semester' ? 'Semestral' : plan_type === 'annual' ? 'Anual' : 'Vitalício'}</li>
              <li><strong>Valor:</strong> R$ ${expected_amount.toFixed(2)}</li>
              <li><strong>Válido até:</strong> ${new Date(expirationDate + 'T12:00:00').toLocaleDateString('pt-BR')}</li>
            </ul>
            <p>Aproveite todos os recursos do FINEX! 🚀</p>
          `
        });
      } catch (emailError) {
        console.error("❌ Erro ao enviar email:", emailError);
      }

    } else {
      console.log("⚠️ Comprovante precisa de revisão manual");
      console.log("   Motivos:");
      if (!amountMatches) console.log("   - Valor não corresponde");
      if (!analysis.is_valid) console.log("   - Comprovante inválido");
      if (analysis.confidence === "low") console.log("   - Baixa confiança na análise");
      
      // Atualizar apenas com as informações da análise
      await base44.asServiceRole.entities.Subscription.update(subscription_id, {
        notes: `Aguardando aprovação manual | Valor detectado: R$ ${analysis.amount_paid.toFixed(2)} | Esperado: R$ ${expected_amount.toFixed(2)} | Banco: ${analysis.bank || 'N/A'} | Confiança: ${analysis.confidence}`
      });
    }

    return Response.json({
      success: true,
      auto_approved: subscriptionStatus === "active",
      analysis: {
        is_valid: analysis.is_valid,
        amount_paid: analysis.amount_paid,
        amount_expected: expected_amount,
        amount_matches: amountMatches,
        confidence: analysis.confidence,
        bank: analysis.bank,
        date: analysis.date
      },
      activation: subscriptionStatus === "active" ? {
        start_date: activationDate,
        end_date: expirationDate
      } : null,
      message: subscriptionStatus === "active" 
        ? "✅ Assinatura ativada automaticamente! Aguarde alguns instantes e recarregue a página." 
        : "⏳ Comprovante enviado para revisão manual. O admin aprovará em até 24h."
    });

  } catch (error) {
    console.error("❌ Erro ao processar comprovante:", error);
    return Response.json({ 
      success: false,
      error: error.message,
      details: "Erro ao analisar comprovante. O admin fará a revisão manual."
    }, { status: 500 });
  }
});