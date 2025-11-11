import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        console.log("🚀 adminApproveSubscription iniciada");
        const base44 = createClientFromRequest(req);

        // ✅ VERIFICAR SE É ADMIN
        console.log("🔍 Verificando autenticação...");
        const user = await base44.auth.me();
        console.log("👤 Usuário:", user?.email, "Role:", user?.role);
        
        if (!user || user.role !== 'admin') {
            console.error("❌ Acesso negado: Apenas admins podem aprovar");
            return Response.json({ 
                success: false,
                error: 'Unauthorized - Admin only' 
            }, { status: 403 });
        }

        // ✅ RECEBER DADOS
        console.log("📦 Lendo body da requisição...");
        const body = await req.json();
        const { subscription_id, user_email, plan_type } = body;

        console.log(`🔍 Admin ${user.email} aprovando assinatura:`);
        console.log(`   • Subscription ID: ${subscription_id}`);
        console.log(`   • User Email: ${user_email}`);
        console.log(`   • Plan Type: ${plan_type}`);

        // ✅ VALIDAR DADOS
        if (!subscription_id || !user_email || !plan_type) {
            console.error("❌ Dados incompletos:", { subscription_id, user_email, plan_type });
            return Response.json({ 
                success: false,
                error: 'Missing required fields: subscription_id, user_email, or plan_type' 
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
        } else {
            console.error(`❌ Tipo de plano inválido: ${plan_type}`);
            return Response.json({ 
                success: false,
                error: `Invalid plan type: ${plan_type}` 
            }, { status: 400 });
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        console.log(`📅 Datas calculadas:`);
        console.log(`   • Início: ${startDateStr}`);
        console.log(`   • Fim: ${endDateStr}`);

        // ✅ VERIFICAR SE asServiceRole EXISTE
        console.log("🔧 Verificando asServiceRole...");
        console.log("asServiceRole existe?", !!base44.asServiceRole);
        
        if (!base44.asServiceRole) {
            console.error("❌ asServiceRole não disponível!");
            return Response.json({ 
                success: false,
                error: 'Service role not available. Please contact support.'
            }, { status: 500 });
        }

        // ✅ ATUALIZAR SUBSCRIPTION COM TRY/CATCH
        try {
            console.log(`🔄 Tentando atualizar Subscription ${subscription_id}...`);
            
            const updateResult = await base44.asServiceRole.entities.Subscription.update(subscription_id, {
                status: "active",
                start_date: startDateStr,
                end_date: endDateStr
            });
            
            console.log(`✅ Subscription atualizada:`, updateResult);
        } catch (subError) {
            console.error("❌ Erro ao atualizar Subscription:", subError);
            console.error("📋 Nome:", subError.name);
            console.error("📋 Mensagem:", subError.message);
            console.error("📋 Stack:", subError.stack);
            
            return Response.json({ 
                success: false,
                error: 'Failed to update subscription',
                details: subError.message,
                errorName: subError.name
            }, { status: 500 });
        }

        // ✅ BUSCAR USUÁRIO COM TRY/CATCH
        let targetUser;
        try {
            console.log(`🔍 Buscando usuário: ${user_email}...`);
            const users = await base44.asServiceRole.entities.User.list();
            console.log(`📊 Total de usuários encontrados: ${users.length}`);
            
            targetUser = users.find(u => u.email === user_email);

            if (!targetUser) {
                console.error(`❌ Usuário não encontrado: ${user_email}`);
                return Response.json({ 
                    success: false,
                    error: 'User not found' 
                }, { status: 404 });
            }
            console.log(`✅ Usuário encontrado: ${targetUser.id}`);
        } catch (userListError) {
            console.error("❌ Erro ao buscar usuário:", userListError);
            console.error("📋 Nome:", userListError.name);
            console.error("📋 Mensagem:", userListError.message);
            console.error("📋 Stack:", userListError.stack);
            
            return Response.json({ 
                success: false,
                error: 'Failed to find user',
                details: userListError.message,
                errorName: userListError.name
            }, { status: 500 });
        }

        // ✅ ATUALIZAR USUÁRIO COM TRY/CATCH
        try {
            console.log(`🔄 Tentando atualizar User ${targetUser.id}...`);
            
            const userUpdateResult = await base44.asServiceRole.entities.User.update(targetUser.id, {
                subscription_status: "active",
                subscription_plan: plan_type,
                subscription_end_date: endDateStr
            });
            
            console.log(`✅ Usuário atualizado:`, userUpdateResult);
        } catch (userUpdateError) {
            console.error("❌ Erro ao atualizar User:", userUpdateError);
            console.error("📋 Nome:", userUpdateError.name);
            console.error("📋 Mensagem:", userUpdateError.message);
            console.error("📋 Stack:", userUpdateError.stack);
            
            return Response.json({ 
                success: false,
                error: 'Failed to update user',
                details: userUpdateError.message,
                errorName: userUpdateError.name
            }, { status: 500 });
        }

        console.log("🎉 Assinatura aprovada com sucesso!");
        
        return Response.json({
            success: true,
            message: 'Assinatura aprovada com sucesso',
            data: {
                subscription_id,
                user_email,
                start_date: startDateStr,
                end_date: endDateStr
            }
        });

    } catch (error) {
        console.error("❌ ERRO GERAL ao aprovar assinatura:", error);
        console.error("📋 Stack:", error.stack);
        console.error("📋 Name:", error.name);
        console.error("📋 Message:", error.message);
        console.error("📋 Tipo:", typeof error);
        
        return Response.json({ 
            success: false, 
            error: error.message || 'Internal server error',
            details: error.stack || 'No stack trace available',
            errorName: error.name || 'Unknown error',
            errorType: typeof error
        }, { status: 500 });
    }
});