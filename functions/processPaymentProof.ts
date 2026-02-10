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

    // ✅ Buscar nome esperado do recebedor PIX
    const settings = await base44.asServiceRole.entities.SystemSettings.list();
    const pixReceiverName = settings.find(s => s.key === "pix_receiver_name")?.value || "MARCIO JOSE GOMES DE SOUZA";
    console.log("👤 Nome esperado:", pixReceiverName);

    // ✅ Usar IA para analisar o comprovante
    let analysisResult;
    try {
      console.log("🔍 Analisando comprovante:", proof_url);
      analysisResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em validação de comprovantes bancários PIX brasileiros.

ANALISE ESTA IMAGEM e extraia:

1. É um COMPROVANTE BANCÁRIO VÁLIDO de PIX? (tem logo de banco, dados de transferência, valor, etc)
2. VALOR PAGO (número exato em reais - ex: 7.99, 50.00, 100.00)
3. NOME DO RECEBEDOR PIX (destinatário do pagamento)
4. DATA DA TRANSAÇÃO (formato: DD/MM/YYYY ou YYYY-MM-DD)

REGRAS IMPORTANTES:
- Se NÃO for um comprovante bancário (foto qualquer, print de conversa, etc) → is_valid = false
- Se for comprovante válido de PIX → is_valid = true
- Valor esperado: R$ ${expected_amount.toFixed(2)}
- Nome esperado do recebedor: "${pixReceiverName}"
- Tolerância de valor: até R$ 0,50 centavos

Retorne JSON:
{
  "is_valid": boolean,
  "amount_paid": number,
  "receiver_name": string,
  "transaction_date": string,
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
            receiver_name: { type: "string" },
            transaction_date: { type: "string" },
            bank: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] }
          },
          required: ["is_valid", "amount_paid", "receiver_name", "transaction_date"]
        }
      });
    } catch (llmError) {
      console.error("❌ Erro na IA:", llmError);
      console.error("❌ Detalhes:", JSON.stringify(llmError, null, 2));
      
      // Se a IA falhar, enviar para análise manual
      await base44.asServiceRole.entities.Subscription.update(subscription_id, {
        status: "pending",
        notes: "Erro na análise automática. Aguardando revisão manual do admin."
      });
      
      return Response.json({
        success: true,
        auto_approved: false,
        error: "Erro na análise automática",
        message: "Comprovante enviado para análise manual do admin."
      });
    }

    console.log("📊 Resultado da análise:", analysisResult);

    const analysis = analysisResult;
    
    // ✅ Verificar VALOR (tolerância de R$ 0,50)
    const amountDifference = Math.abs(analysis.amount_paid - expected_amount);
    const amountMatches = amountDifference <= 0.50;

    // ✅ Verificar NOME do recebedor (case-insensitive, remove acentos, mais tolerante)
    const normalizeString = (str) => {
      if (!str) return "";
      return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '') // Remove pontuação
        .trim();
    };
    
    const normalizedReceiver = normalizeString(analysis.receiver_name || "");
    const normalizedExpected = normalizeString(pixReceiverName);
    
    // Verificar se contém as palavras principais do nome
    const expectedWords = normalizedExpected.split(' ').filter(w => w.length > 2);
    const receiverWords = normalizedReceiver.split(' ');
    const matchedWords = expectedWords.filter(word => receiverWords.some(rw => rw.includes(word) || word.includes(rw)));
    
    const receiverNameMatches = matchedWords.length >= Math.min(3, expectedWords.length);

    // ✅ Verificar DATA (últimas 72 horas - mais tolerante)
    let dateIsValid = false;
    try {
      const transactionDate = analysis.transaction_date;
      let parsedDate;

      // Tentar diferentes formatos
      if (transactionDate.includes('/')) {
        const parts = transactionDate.split('/');
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
        parsedDate = new Date(year, month, day);
      } else if (transactionDate.includes('-')) {
        parsedDate = new Date(transactionDate);
      }

      if (parsedDate && !isNaN(parsedDate)) {
        const now = new Date();
        const diffHours = (now - parsedDate) / (1000 * 60 * 60);
        dateIsValid = diffHours >= -2 && diffHours <= 72; // 72h tolerância + 2h futuro
      }
    } catch (e) {
      console.error("Erro ao validar data:", e);
    }

    console.log("💰 Valor:", amountMatches ? "✅ OK" : `❌ Incorreto (${analysis.amount_paid})`);
    console.log("👤 Nome:", receiverNameMatches ? "✅ OK" : `❌ Incorreto (${analysis.receiver_name})`);
    console.log("📅 Data:", dateIsValid ? "✅ OK" : `❌ Fora do prazo (${analysis.transaction_date})`);

    let subscriptionStatus = "pending";
    let activationDate = null;
    let expirationDate = null;

    // ✅ Se TUDO estiver correto = ATIVAR AUTOMATICAMENTE
    if (amountMatches && receiverNameMatches && dateIsValid && analysis.is_valid) {
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

      // ✅ Atualizar usuário via entities (não existe updateUser no auth)
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
      }

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
      // ❌ COMPROVANTE RECUSADO
      const rejectionReasons = [];
      if (!analysis.is_valid) rejectionReasons.push("Não é um comprovante válido");
      if (!amountMatches) rejectionReasons.push(`Valor incorreto (R$ ${analysis.amount_paid?.toFixed(2)})`);
      if (!receiverNameMatches) rejectionReasons.push(`Nome do recebedor incorreto (${analysis.receiver_name})`);
      if (!dateIsValid) rejectionReasons.push(`Data fora do prazo (${analysis.transaction_date})`);

      console.log("❌ COMPROVANTE RECUSADO:");
      rejectionReasons.forEach(r => console.log(`   - ${r}`));
      
      await base44.asServiceRole.entities.Subscription.update(subscription_id, {
        status: "cancelled",
        notes: `❌ RECUSADO - ${rejectionReasons.join(", ")}`
      });
    }

    return Response.json({
      success: true,
      auto_approved: subscriptionStatus === "active",
      analysis: {
        is_valid: analysis.is_valid,
        amount_paid: analysis.amount_paid,
        receiver_name: analysis.receiver_name,
        transaction_date: analysis.transaction_date,
        amount_expected: expected_amount,
        expected_receiver: pixReceiverName,
        amount_matches: amountMatches,
        receiver_matches: receiverNameMatches,
        date_valid: dateIsValid,
        confidence: analysis.confidence,
        bank: analysis.bank
      },
      activation: subscriptionStatus === "active" ? {
        start_date: activationDate,
        end_date: expirationDate
      } : null,
      message: subscriptionStatus === "active" 
        ? "✅ Assinatura ativada automaticamente! Aguarde alguns instantes e recarregue a página." 
        : "❌ Comprovante recusado. Entre em contato com o financeiro."
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