import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ✅ Verificar autenticação (apenas admin)
    const currentUser = await base44.auth.me();
    if (!currentUser || currentUser.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    console.log('🔄 Iniciando ativação manual de assinaturas pendentes...');

    // ✅ BUSCAR TODAS AS ASSINATURAS PENDENTES
    const allSubscriptions = await base44.asServiceRole.entities.Subscription.list();
    const pendingSubscriptions = allSubscriptions.filter(s => s.status === 'pending');

    console.log(`📊 Total de assinaturas: ${allSubscriptions.length}`);
    console.log(`⏳ Assinaturas pendentes: ${pendingSubscriptions.length}`);

    if (pendingSubscriptions.length === 0) {
      return Response.json({
        success: true,
        message: 'Nenhuma assinatura pendente encontrada',
        total: 0,
        activated: 0,
        errors: []
      });
    }

    const results = {
      total: pendingSubscriptions.length,
      activated: 0,
      errors: [],
      details: []
    };

    // ✅ PROCESSAR CADA ASSINATURA PENDENTE
    for (const subscription of pendingSubscriptions) {
      try {
        console.log(`\n📝 Processando assinatura ${subscription.id}`);
        console.log(`   👤 Email: ${subscription.user_email}`);
        console.log(`   📦 Plano: ${subscription.plan_type}`);
        console.log(`   💰 Valor: R$ ${subscription.amount_paid}`);

        // ✅ CALCULAR DATAS
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        switch(subscription.plan_type) {
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

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        console.log(`   📅 Início: ${startDateStr}`);
        console.log(`   📅 Fim: ${endDateStr}`);

        // ✅ ATUALIZAR ASSINATURA
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: 'active',
          start_date: startDateStr,
          end_date: endDateStr
        });

        console.log('   ✅ Assinatura atualizada');

        // ✅ BUSCAR E ATUALIZAR USUÁRIO
        const users = await base44.asServiceRole.entities.User.filter({
          email: subscription.user_email
        });

        if (users.length > 0) {
          const user = users[0];
          
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'active',
            subscription_plan: subscription.plan_type,
            subscription_end_date: endDateStr
          });

          console.log('   ✅ Usuário atualizado');

          // ✅ ENVIAR EMAIL DE CONFIRMAÇÃO
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: subscription.user_email,
              subject: '🎉 Sua Assinatura Foi Ativada - FINEX',
              body: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 30px; }
                    .success { background: #dcfce7; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
                    .details { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
                    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                    .button { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🎉 Assinatura Ativada!</h1>
                    </div>
                    <div class="content">
                      <div class="success">
                        <p style="font-size: 48px; margin: 0;">✅</p>
                        <p style="font-size: 20px; color: #059669; margin: 10px 0; font-weight: bold;">Tudo Pronto!</p>
                      </div>
                      <p style="color: #374151; line-height: 1.6;">
                        Olá, <strong>${user.full_name}</strong>!<br><br>
                        Sua assinatura foi confirmada e já está <strong>100% ativa</strong>!
                      </p>
                      <div class="details">
                        <div class="row">
                          <span style="color: #6b7280;">📦 Plano</span>
                          <span style="color: #111827; font-weight: bold;">${
                            subscription.plan_type === 'monthly' ? 'Mensal' :
                            subscription.plan_type === 'semester' ? 'Semestral' :
                            subscription.plan_type === 'annual' ? 'Anual' : 'Vitalício'
                          }</span>
                        </div>
                        <div class="row">
                          <span style="color: #6b7280;">💰 Valor</span>
                          <span style="color: #111827; font-weight: bold;">R$ ${subscription.amount_paid.toFixed(2)}</span>
                        </div>
                        <div class="row">
                          <span style="color: #6b7280;">⏰ Válido Até</span>
                          <span style="color: #111827; font-weight: bold;">${endDate.toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div style="text-align: center;">
                        <a href="https://finex.base44.app" class="button">
                          🚀 Acessar FINEX Agora
                        </a>
                      </div>
                      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        <strong>✨ Aproveite todos os recursos:</strong><br>
                        • Transações ilimitadas<br>
                        • Múltiplas contas<br>
                        • Metas financeiras<br>
                        • Relatórios completos<br>
                        • Consultor IA<br>
                      </p>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
                      <p>FINEX - Inteligência Financeira 💜</p>
                    </div>
                  </div>
                </body>
                </html>
              `
            });
            console.log('   ✅ Email enviado');
          } catch (emailError) {
            console.error('   ⚠️ Erro ao enviar email:', emailError);
          }

          results.activated++;
          results.details.push({
            subscription_id: subscription.id,
            email: subscription.user_email,
            plan: subscription.plan_type,
            status: 'activated',
            end_date: endDateStr
          });

        } else {
          const errorMsg = `Usuário não encontrado: ${subscription.user_email}`;
          console.error(`   ❌ ${errorMsg}`);
          results.errors.push({
            subscription_id: subscription.id,
            email: subscription.user_email,
            error: errorMsg
          });
        }

      } catch (error) {
        console.error(`   ❌ Erro ao processar assinatura ${subscription.id}:`, error);
        results.errors.push({
          subscription_id: subscription.id,
          email: subscription.user_email,
          error: error.message
        });
      }
    }

    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`   ✅ Ativadas: ${results.activated}/${results.total}`);
    console.log(`   ❌ Erros: ${results.errors.length}`);

    return Response.json({
      success: true,
      message: `Processo concluído: ${results.activated} assinaturas ativadas`,
      ...results
    });

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});