import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            console.log('❌ Usuário não autenticado');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 🔒 VERIFICAR SE É ADMIN
        if (user.role !== 'admin') {
            console.log(`❌ Usuário ${user.email} não é admin (role: ${user.role})`);
            return Response.json({ 
                error: 'Forbidden - Only admins can manage subscriptions',
                success: false
            }, { status: 403 });
        }

        const body = await req.json();
        const { action, subscription_id, user_email, plan_type } = body;

        console.log(`🔐 Admin ${user.email} executando ação: ${action}`);
        console.log(`📋 Dados recebidos:`, { action, subscription_id, user_email, plan_type });

        if (action === 'approve') {
            return await approveSubscription(subscription_id, user_email, plan_type, base44);
        } else if (action === 'reject') {
            return await rejectSubscription(subscription_id, base44);
        } else if (action === 'block_users_without_plan') {
            return await blockUsersWithoutPlan(base44);
        } else {
            console.log(`❌ Ação inválida: ${action}`);
            return Response.json({ 
                error: 'Invalid action. Use: approve, reject, or block_users_without_plan',
                success: false
            }, { status: 400 });
        }

    } catch (error) {
        console.error('❌ Erro na função manageSubscription:', error);
        console.error('Stack trace:', error.stack);
        return Response.json({
            error: error.message,
            success: false,
            details: error.stack
        }, { status: 500 });
    }
});

async function approveSubscription(subscriptionId, userEmail, planType, base44) {
    try {
        console.log(`✅ Aprovando assinatura ${subscriptionId} para ${userEmail}`);

        // Calcular datas
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        if (planType === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (planType === 'semester') {
            endDate.setMonth(endDate.getMonth() + 6);
        } else if (planType === 'annual') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else if (planType === 'lifetime') {
            endDate.setFullYear(endDate.getFullYear() + 100);
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        console.log(`📅 Datas: ${startDateStr} até ${endDateStr}`);

        // Atualizar assinatura usando service role (admin privileges)
        console.log('🔄 Atualizando assinatura...');
        await base44.asServiceRole.entities.Subscription.update(subscriptionId, {
            status: "active",
            start_date: startDateStr,
            end_date: endDateStr
        });

        console.log('✅ Assinatura atualizada');

        // Buscar usuário
        console.log(`🔍 Buscando usuário: ${userEmail}`);
        const users = await base44.asServiceRole.entities.User.list();
        const targetUser = users.find(u => u.email === userEmail);

        if (targetUser) {
            console.log(`✅ Usuário encontrado: ${targetUser.id}`);
            
            // Atualizar dados do usuário
            await base44.asServiceRole.entities.User.update(targetUser.id, {
                subscription_status: "active",
                subscription_plan: planType,
                subscription_end_date: endDateStr
            });

            console.log(`✅ Assinatura aprovada com sucesso para ${userEmail}`);

            return Response.json({
                success: true,
                message: 'Assinatura aprovada com sucesso',
                subscription: {
                    status: 'active',
                    start_date: startDateStr,
                    end_date: endDateStr
                }
            });
        } else {
            console.error(`❌ Usuário não encontrado: ${userEmail}`);
            throw new Error(`Usuário ${userEmail} não encontrado`);
        }

    } catch (error) {
        console.error('❌ Erro ao aprovar assinatura:', error);
        console.error('Stack trace:', error.stack);
        return Response.json({
            success: false,
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
}

async function rejectSubscription(subscriptionId, base44) {
    try {
        console.log(`❌ Rejeitando assinatura ${subscriptionId}`);

        if (!subscriptionId) {
            throw new Error('subscription_id é obrigatório');
        }

        // Buscar a assinatura primeiro para verificar se existe
        console.log('🔍 Buscando assinatura...');
        const subscriptions = await base44.asServiceRole.entities.Subscription.list();
        const subscription = subscriptions.find(s => s.id === subscriptionId);

        if (!subscription) {
            console.error(`❌ Assinatura não encontrada: ${subscriptionId}`);
            throw new Error(`Assinatura ${subscriptionId} não encontrada`);
        }

        console.log('✅ Assinatura encontrada:', subscription);

        // Atualizar assinatura usando service role
        console.log('🔄 Atualizando status para cancelled...');
        await base44.asServiceRole.entities.Subscription.update(subscriptionId, {
            status: "cancelled"
        });

        console.log(`✅ Assinatura ${subscriptionId} rejeitada com sucesso`);

        return Response.json({
            success: true,
            message: 'Assinatura rejeitada'
        });

    } catch (error) {
        console.error('❌ Erro ao rejeitar assinatura:', error);
        console.error('Stack trace:', error.stack);
        return Response.json({
            success: false,
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
}

async function blockUsersWithoutPlan(base44) {
    try {
        console.log('🔍 Buscando todos os usuários...');
        const users = await base44.asServiceRole.entities.User.list();
        console.log(`✅ ${users.length} usuários encontrados`);
        
        let blocked = 0;
        
        for (const user of users) {
            // Pular admins
            if (user.role === 'admin') {
                console.log(`⏭️ Pulando admin: ${user.email}`);
                continue;
            }
            
            // Verificar se tem plano ativo
            const hasActivePlan = user.subscription_status === 'active' && 
                                 user.subscription_end_date && 
                                 new Date(user.subscription_end_date) > new Date();
            
            const hasLifetime = user.subscription_plan === 'lifetime';
            
            // Se não tem plano ativo, bloquear
            if (!hasActivePlan && !hasLifetime) {
                console.log(`🔒 Bloqueando usuário: ${user.email}`);
                await base44.asServiceRole.entities.User.update(user.id, {
                    subscription_status: "pending",
                    subscription_plan: null,
                    subscription_end_date: null
                });
                blocked++;
            } else {
                console.log(`✅ Usuário OK: ${user.email}`);
            }
        }
        
        console.log(`✅ Processo concluído: ${blocked} usuário(s) bloqueado(s)`);
        
        return Response.json({
            success: true,
            message: `${blocked} usuário(s) bloqueado(s)`,
            blocked_count: blocked
        });

    } catch (error) {
        console.error('❌ Erro ao bloquear usuários:', error);
        console.error('Stack trace:', error.stack);
        return Response.json({
            success: false,
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
}