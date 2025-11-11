import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    const debugLog = [];
    const log = (msg) => {
        console.log(msg);
        debugLog.push(msg);
    };

    try {
        log("🚀 adminApproveSubscription iniciada");
        const base44 = createClientFromRequest(req);

        // ✅ VERIFICAR SE É ADMIN
        log("🔍 Verificando autenticação...");
        const user = await base44.auth.me();
        log(`👤 Usuário: ${user?.email} Role: ${user?.role}`);
        
        if (!user || user.role !== 'admin') {
            log("❌ Acesso negado: Apenas admins podem aprovar");
            return Response.json({ 
                success: false,
                error: 'Unauthorized - Admin only',
                debugLog
            }, { status: 403 });
        }

        // ✅ RECEBER DADOS
        log("📦 Lendo body da requisição...");
        const body = await req.json();
        const { subscription_id, user_email, plan_type } = body;

        log(`📋 Dados recebidos:`);
        log(`   • Subscription ID: ${subscription_id}`);
        log(`   • User Email: ${user_email}`);
        log(`   • Plan Type: ${plan_type}`);

        // ✅ VALIDAR DADOS
        if (!subscription_id || !user_email || !plan_type) {
            log("❌ Dados incompletos");
            return Response.json({ 
                success: false,
                error: 'Missing required fields',
                debugLog
            }, { status: 400 });
        }

        // ✅ CALCULAR DATAS
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        if (plan_type === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan_type === 'semester') {
            endDate.setMonth(endDate.getMonth() + 6);
        } else if (plan_type === 'annual') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else if (plan_type === 'lifetime') {
            endDate.setFullYear(endDate.getFullYear() + 100);
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        log(`📅 Datas: ${startDateStr} → ${endDateStr}`);

        // ✅ VERIFICAR asServiceRole
        log("🔧 Verificando asServiceRole...");
        log(`   asServiceRole existe? ${!!base44.asServiceRole}`);
        
        if (!base44.asServiceRole) {
            log("❌ asServiceRole não disponível!");
            return Response.json({ 
                success: false,
                error: 'Service role not available',
                debugLog
            }, { status: 500 });
        }

        // ✅ TENTAR ATUALIZAR SUBSCRIPTION
        try {
            log(`🔄 Atualizando Subscription ${subscription_id}...`);
            log(`   Dados do update: status=active, start=${startDateStr}, end=${endDateStr}`);
            
            const updateResult = await base44.asServiceRole.entities.Subscription.update(subscription_id, {
                status: "active",
                start_date: startDateStr,
                end_date: endDateStr
            });
            
            log(`✅ Subscription atualizada! Result: ${JSON.stringify(updateResult)}`);
        } catch (subError) {
            log(`❌ ERRO ao atualizar Subscription:`);
            log(`   Nome: ${subError.name}`);
            log(`   Mensagem: ${subError.message}`);
            log(`   Stack: ${subError.stack}`);
            
            return Response.json({ 
                success: false,
                error: 'Failed to update subscription',
                errorDetails: {
                    name: subError.name,
                    message: subError.message,
                    stack: subError.stack
                },
                debugLog
            }, { status: 500 });
        }

        // ✅ BUSCAR USUÁRIO
        let targetUser;
        try {
            log(`🔍 Buscando usuário: ${user_email}...`);
            const users = await base44.asServiceRole.entities.User.list();
            log(`   Total de usuários: ${users.length}`);
            
            targetUser = users.find(u => u.email === user_email);

            if (!targetUser) {
                log(`❌ Usuário não encontrado: ${user_email}`);
                return Response.json({ 
                    success: false,
                    error: 'User not found',
                    debugLog
                }, { status: 404 });
            }
            log(`✅ Usuário encontrado: ${targetUser.id}`);
        } catch (userListError) {
            log(`❌ ERRO ao buscar usuário:`);
            log(`   Nome: ${userListError.name}`);
            log(`   Mensagem: ${userListError.message}`);
            
            return Response.json({ 
                success: false,
                error: 'Failed to find user',
                errorDetails: {
                    name: userListError.name,
                    message: userListError.message
                },
                debugLog
            }, { status: 500 });
        }

        // ✅ ATUALIZAR USUÁRIO
        try {
            log(`🔄 Atualizando User ${targetUser.id}...`);
            log(`   Dados: status=active, plan=${plan_type}, end=${endDateStr}`);
            
            const userUpdateResult = await base44.asServiceRole.entities.User.update(targetUser.id, {
                subscription_status: "active",
                subscription_plan: plan_type,
                subscription_end_date: endDateStr
            });
            
            log(`✅ Usuário atualizado! Result: ${JSON.stringify(userUpdateResult)}`);
        } catch (userUpdateError) {
            log(`❌ ERRO ao atualizar User:`);
            log(`   Nome: ${userUpdateError.name}`);
            log(`   Mensagem: ${userUpdateError.message}`);
            log(`   Stack: ${userUpdateError.stack}`);
            
            return Response.json({ 
                success: false,
                error: 'Failed to update user',
                errorDetails: {
                    name: userUpdateError.name,
                    message: userUpdateError.message,
                    stack: userUpdateError.stack
                },
                debugLog
            }, { status: 500 });
        }

        log("🎉 Assinatura aprovada com sucesso!");
        
        return Response.json({
            success: true,
            message: 'Assinatura aprovada com sucesso',
            data: {
                subscription_id,
                user_email,
                start_date: startDateStr,
                end_date: endDateStr
            },
            debugLog
        });

    } catch (error) {
        log(`❌ ERRO GERAL:`);
        log(`   Nome: ${error.name}`);
        log(`   Mensagem: ${error.message}`);
        log(`   Stack: ${error.stack}`);
        
        return Response.json({ 
            success: false, 
            error: error.message || 'Internal server error',
            errorDetails: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            debugLog
        }, { status: 500 });
    }
});