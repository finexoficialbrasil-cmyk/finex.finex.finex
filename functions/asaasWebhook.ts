
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        console.log('📥 Webhook Asaas recebido');
        
        // ✅ PEGAR TOKEN DO WEBHOOK DAS CONFIGURAÇÕES
        const settings = await base44.asServiceRole.entities.SystemSettings.list();
        const webhookTokenSetting = settings.find(s => s.key === 'asaas_webhook_token');
        const webhookToken = webhookTokenSetting?.value;

        // ✅ VALIDAR TOKEN (se configurado)
        if (webhookToken) {
            const token = req.headers.get('asaas-access-token');
            if (token !== webhookToken) {
                console.error('❌ Token inválido');
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // ✅ PEGAR DADOS DO WEBHOOK
        const body = await req.json();
        const bodyString = JSON.stringify(body);
        
        console.log('📦 Payload:', bodyString);

        const { event, payment } = body;

        // ✅ REGISTRAR WEBHOOK RECEBIDO
        await base44.asServiceRole.entities.WebhookLog.create({
            event_type: event || 'unknown',
            payment_id: payment?.id || 'unknown',
            payload: bodyString,
            status: 'received'
        });

        console.log('✅ Webhook registrado no banco');

        // ✅ VERIFICAR SE É CONFIRMAÇÃO DE PAGAMENTO
        if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
            console.log('💰 Pagamento confirmado!');
            console.log('🆔 Payment ID:', payment.id);
            console.log('💵 Valor:', payment.value);

            // ✅ BUSCAR ASSINATURA PELO TRANSACTION_ID
            const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
                transaction_id: payment.id
            });

            console.log(`🔍 Assinaturas encontradas: ${subscriptions.length}`);

            if (subscriptions.length === 0) {
                const errorMsg = `Assinatura não encontrada para payment_id: ${payment.id}`;
                console.error('❌', errorMsg);
                
                await base44.asServiceRole.entities.WebhookLog.create({
                    event_type: event,
                    payment_id: payment.id,
                    payload: bodyString,
                    status: 'error',
                    error_message: errorMsg
                });

                return Response.json({ 
                    success: false, 
                    message: errorMsg 
                });
            }

            const subscription = subscriptions[0];
            console.log('✅ Assinatura encontrada:', subscription.id);
            console.log('👤 Email:', subscription.user_email);
            console.log('📦 Plano:', subscription.plan_type);

            // ✅ CALCULAR DATA DE VENCIMENTO
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

            console.log('📅 Data início:', startDate.toISOString().split('T')[0]);
            console.log('📅 Data fim:', endDate.toISOString().split('T')[0]);

            // ✅ ATUALIZAR ASSINATURA PARA ATIVA
            await base44.asServiceRole.entities.Subscription.update(subscription.id, {
                status: 'active',
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            });

            console.log('✅ Assinatura ativada');

            // ✅ BUSCAR USUÁRIO E ATUALIZAR
            const users = await base44.asServiceRole.entities.User.filter({
                email: subscription.user_email
            });

            console.log(`🔍 Usuários encontrados: ${users.length}`);

            if (users.length > 0) {
                const user = users[0];
                
                await base44.asServiceRole.entities.User.update(user.id, {
                    subscription_status: 'active',
                    subscription_plan: subscription.plan_type,
                    subscription_end_date: endDate.toISOString().split('T')[0]
                });

                console.log('✅ Usuário atualizado:', user.email);
            } else {
                console.error('❌ Usuário não encontrado:', subscription.user_email);
            }

            // ✅ ENVIAR EMAIL DE CONFIRMAÇÃO
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: subscription.user_email,
                    subject: '🎉 Pagamento Confirmado - FINEX',
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
                                .success-badge { background: #dcfce7; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
                                .success-badge p { color: #059669; margin: 5px 0; font-weight: bold; }
                                .details { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
                                .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                                .details-row:last-child { border-bottom: none; }
                                .label { color: #6b7280; }
                                .value { color: #111827; font-weight: bold; }
                                .cta { text-align: center; margin: 30px 0; }
                                .button { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
                                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>🎉 Pagamento Confirmado!</h1>
                                </div>
                                
                                <div class="content">
                                    <div class="success-badge">
                                        <p style="font-size: 48px; margin: 0;">✅</p>
                                        <p style="font-size: 20px; margin: 10px 0;">Sua Assinatura Foi Ativada!</p>
                                    </div>
                                    
                                    <p style="color: #374151; line-height: 1.6;">
                                        Olá! Temos uma ótima notícia: seu pagamento foi confirmado com sucesso e 
                                        sua assinatura já está <strong>100% ativa</strong>!
                                    </p>
                                    
                                    <div class="details">
                                        <div class="details-row">
                                            <span class="label">📦 Plano</span>
                                            <span class="value">${
                                                subscription.plan_type === 'monthly' ? 'Mensal' :
                                                subscription.plan_type === 'semester' ? 'Semestral' :
                                                subscription.plan_type === 'annual' ? 'Anual' : 'Vitalício'
                                            }</span>
                                        </div>
                                        <div class="details-row">
                                            <span class="label">💰 Valor Pago</span>
                                            <span class="value">R$ ${subscription.amount_paid.toFixed(2)}</span>
                                        </div>
                                        <div class="details-row">
                                            <span class="label">📅 Data de Ativação</span>
                                            <span class="value">${startDate.toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div class="details-row">
                                            <span class="label">⏰ Válido Até</span>
                                            <span class="value">${endDate.toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="cta">
                                        <a href="https://finex.base44.app" class="button">
                                            🚀 Acessar FINEX Agora
                                        </a>
                                    </div>
                                    
                                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                                        <strong>✨ O que você pode fazer agora:</strong><br>
                                        • Criar transações ilimitadas<br>
                                        • Gerenciar múltiplas contas<br>
                                        • Definir metas financeiras<br>
                                        • Gerar relatórios completos<br>
                                        • Usar o Consultor IA<br>
                                        • E muito mais!
                                    </p>
                                </div>
                                
                                <div class="footer">
                                    <p>Obrigado por escolher o FINEX! 💜</p>
                                    <p>Dúvidas? Responda este email.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                });
                console.log('✅ Email enviado');
            } catch (emailError) {
                console.error('⚠️ Erro ao enviar email:', emailError);
            }

            // ✅ MARCAR WEBHOOK COMO PROCESSADO
            await base44.asServiceRole.entities.WebhookLog.create({
                event_type: event,
                payment_id: payment.id,
                payload: bodyString,
                status: 'processed'
            });

            return Response.json({ 
                success: true, 
                message: 'Assinatura ativada automaticamente' 
            });
        }

        // ✅ OUTROS EVENTOS (LOG)
        console.log(`ℹ️ Evento ignorado: ${event}`);
        return Response.json({ success: true, message: 'Evento recebido' });

    } catch (error) {
        console.error('❌ Erro no webhook:', error.message);
        console.error('Stack:', error.stack);
        
        try {
            await base44.asServiceRole.entities.WebhookLog.create({
                event_type: 'error',
                payment_id: 'unknown',
                payload: JSON.stringify({ error: error.message, stack: error.stack }),
                status: 'error',
                error_message: error.message
            });
        } catch (logError) {
            console.error('❌ Erro ao registrar erro:', logError);
        }

        return Response.json({ 
            error: 'Erro ao processar webhook',
            details: error.message 
        }, { status: 500 });
    }
});
