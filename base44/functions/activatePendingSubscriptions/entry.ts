import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticação e permissão admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Acesso negado. Apenas administradores podem ativar assinaturas.' }, { status: 403 });
        }

        console.log("🔄 Iniciando ativação de assinaturas pendentes...");

        // Buscar configurações do Asaas
        const allSettings = await base44.asServiceRole.entities.SystemSettings.list();
        const apiKeySetting = allSettings.find(s => s.key === "asaas_api_key");
        
        if (!apiKeySetting || !apiKeySetting.value) {
            return Response.json({ 
                error: 'API Key do Asaas não configurada. Configure em Admin → Config → Pagamentos.' 
            }, { status: 400 });
        }

        const asaasApiKey = apiKeySetting.value;

        // Buscar assinaturas pendentes
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            status: "pending"
        });

        console.log(`📊 Encontradas ${subscriptions.length} assinaturas pendentes`);

        if (subscriptions.length === 0) {
            return Response.json({ 
                success: true,
                message: "✅ Não há assinaturas pendentes para ativar.",
                activated: 0,
                checked: 0
            });
        }

        let activated = 0;
        let checked = 0;
        const errors = [];

        // Verificar cada assinatura no Asaas
        for (const subscription of subscriptions) {
            checked++;
            
            if (!subscription.transaction_id) {
                console.log(`⚠️ Assinatura ${subscription.id} sem transaction_id, pulando...`);
                continue;
            }

            try {
                // Consultar pagamento no Asaas
                const asaasResponse = await fetch(
                    `https://api.asaas.com/v3/payments/${subscription.transaction_id}`,
                    {
                        headers: {
                            'access_token': asaasApiKey,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!asaasResponse.ok) {
                    console.log(`⚠️ Pagamento ${subscription.transaction_id} não encontrado no Asaas`);
                    continue;
                }

                const payment = await asaasResponse.json();
                console.log(`💰 Status do pagamento ${subscription.transaction_id}: ${payment.status}`);

                // Se pagamento confirmado ou recebido, ativar assinatura
                if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
                    console.log(`✅ Ativando assinatura de ${subscription.user_email}...`);

                    // Calcular datas
                    const startDate = new Date();
                    const endDate = new Date(startDate);
                    
                    if (subscription.plan_type === 'monthly') {
                        endDate.setMonth(endDate.getMonth() + 1);
                    } else if (subscription.plan_type === 'semester') {
                        endDate.setMonth(endDate.getMonth() + 6);
                    } else if (subscription.plan_type === 'annual') {
                        endDate.setFullYear(endDate.getFullYear() + 1);
                    } else if (subscription.plan_type === 'lifetime') {
                        endDate.setFullYear(endDate.getFullYear() + 100);
                    }

                    // Atualizar assinatura
                    await base44.asServiceRole.entities.Subscription.update(subscription.id, {
                        status: "active",
                        start_date: startDate.toISOString().split('T')[0],
                        end_date: endDate.toISOString().split('T')[0]
                    });

                    // Atualizar usuário
                    const users = await base44.asServiceRole.entities.User.filter({
                        email: subscription.user_email
                    });

                    if (users && users.length > 0) {
                        const targetUser = users[0];
                        await base44.asServiceRole.entities.User.update(targetUser.id, {
                            subscription_status: "active",
                            subscription_plan: subscription.plan_type,
                            subscription_end_date: endDate.toISOString().split('T')[0]
                        });
                    }

                    activated++;
                    console.log(`✅ Assinatura de ${subscription.user_email} ativada com sucesso!`);
                }
            } catch (error) {
                console.error(`❌ Erro ao processar assinatura ${subscription.id}:`, error);
                errors.push({
                    subscription_id: subscription.id,
                    user_email: subscription.user_email,
                    error: error.message
                });
            }
        }

        const message = activated > 0
            ? `✅ Sucesso! ${activated} de ${checked} assinatura(s) ativada(s).`
            : `ℹ️ Verificadas ${checked} assinatura(s) pendente(s), mas nenhuma com pagamento confirmado no Asaas.`;

        return Response.json({
            success: true,
            message: message,
            activated: activated,
            checked: checked,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error("❌ Erro ao ativar assinaturas pendentes:", error);
        return Response.json({ 
            success: false,
            error: error.message || 'Erro desconhecido ao processar assinaturas'
        }, { status: 500 });
    }
});