import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ✅ LOGS ULTRA DETALHADOS
Deno.serve(async (req) => {
    console.log("═".repeat(70));
    console.log("🚀 FUNÇÃO INICIADA - adminApproveSubscription");
    console.log("═".repeat(70));
    
    const debugLog = [];
    const log = (msg) => {
        console.log(msg);
        debugLog.push(msg);
    };

    try {
        log("1️⃣ Criando cliente Base44...");
        const base44 = createClientFromRequest(req);
        log("✅ Cliente criado");

        log("2️⃣ Verificando autenticação...");
        const user = await base44.auth.me();
        log(`✅ Usuário: ${user?.email} Role: ${user?.role}`);
        
        if (!user || user.role !== 'admin') {
            log("❌ Não é admin!");
            return Response.json({ 
                success: false,
                error: 'Unauthorized - Admin only',
                debugLog
            }, { status: 403 });
        }

        log("3️⃣ Lendo body da requisição...");
        const body = await req.json();
        const { subscription_id, user_email, plan_type } = body;

        log(`📋 subscription_id: ${subscription_id}`);
        log(`📋 user_email: ${user_email}`);
        log(`📋 plan_type: ${plan_type}`);

        if (!subscription_id || !user_email || !plan_type) {
            log("❌ Dados incompletos");
            return Response.json({ 
                success: false,
                error: 'Missing required fields',
                received: { subscription_id, user_email, plan_type },
                debugLog
            }, { status: 400 });
        }

        log("4️⃣ Calculando datas...");
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
        log(`✅ Start: ${startDateStr} | End: ${endDateStr}`);

        log("5️⃣ Verificando asServiceRole...");
        if (!base44.asServiceRole) {
            log("❌ asServiceRole não existe!");
            return Response.json({ 
                success: false,
                error: 'asServiceRole not available',
                debugLog
            }, { status: 500 });
        }
        log("✅ asServiceRole disponível");

        log("6️⃣ Verificando entidades...");
        if (!base44.asServiceRole.entities) {
            log("❌ Entities não existe!");
            return Response.json({ 
                success: false,
                error: 'Entities not available',
                debugLog
            }, { status: 500 });
        }
        log("✅ Entities disponível");

        log("7️⃣ Verificando Subscription entity...");
        if (!base44.asServiceRole.entities.Subscription) {
            log("❌ Subscription entity não existe!");
            return Response.json({ 
                success: false,
                error: 'Subscription entity not available',
                availableEntities: Object.keys(base44.asServiceRole.entities),
                debugLog
            }, { status: 500 });
        }
        log("✅ Subscription entity disponível");

        log(`8️⃣ TENTANDO ATUALIZAR Subscription ${subscription_id}...`);
        log(`   Payload: status=active, start=${startDateStr}, end=${endDateStr}`);
        
        try {
            const updateResult = await base44.asServiceRole.entities.Subscription.update(
                subscription_id,
                {
                    status: "active",
                    start_date: startDateStr,
                    end_date: endDateStr
                }
            );
            log(`✅ Subscription atualizada!`);
            log(`   Result: ${JSON.stringify(updateResult)}`);
        } catch (subError) {
            log(`❌ ERRO AO ATUALIZAR SUBSCRIPTION:`);
            log(`   Name: ${subError.name}`);
            log(`   Message: ${subError.message}`);
            log(`   Code: ${subError.code || 'N/A'}`);
            log(`   Status: ${subError.status || 'N/A'}`);
            
            // ✅ Retornar erro DETALHADO
            return Response.json({ 
                success: false,
                error: 'Failed to update subscription',
                errorName: subError.name,
                errorMessage: subError.message,
                errorCode: subError.code,
                errorStatus: subError.status,
                stack: subError.stack,
                debugLog
            }, { status: 500 });
        }

        log("9️⃣ Buscando usuário...");
        let targetUser;
        try {
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
            log(`❌ ERRO AO BUSCAR USUÁRIO:`);
            log(`   Message: ${userListError.message}`);
            
            return Response.json({ 
                success: false,
                error: 'Failed to list users',
                errorMessage: userListError.message,
                debugLog
            }, { status: 500 });
        }

        log("🔟 Atualizando User...");
        try {
            const userUpdateResult = await base44.asServiceRole.entities.User.update(
                targetUser.id,
                {
                    subscription_status: "active",
                    subscription_plan: plan_type,
                    subscription_end_date: endDateStr
                }
            );
            log(`✅ User atualizado!`);
            log(`   Result: ${JSON.stringify(userUpdateResult)}`);
        } catch (userUpdateError) {
            log(`❌ ERRO AO ATUALIZAR USER:`);
            log(`   Message: ${userUpdateError.message}`);
            
            return Response.json({ 
                success: false,
                error: 'Failed to update user',
                errorMessage: userUpdateError.message,
                debugLog
            }, { status: 500 });
        }

        log("🎉 SUCESSO COMPLETO!");
        
        console.log("═".repeat(70));
        console.log("✅ FUNÇÃO FINALIZADA COM SUCESSO");
        console.log("═".repeat(70));
        
        return Response.json({
            success: true,
            message: 'Assinatura aprovada!',
            data: {
                subscription_id,
                user_email,
                start_date: startDateStr,
                end_date: endDateStr
            },
            debugLog
        });

    } catch (generalError) {
        // ✅ CATCH GERAL - pega QUALQUER erro
        log(`❌ ERRO GERAL NÃO CAPTURADO:`);
        log(`   Name: ${generalError.name}`);
        log(`   Message: ${generalError.message}`);
        log(`   Stack: ${generalError.stack}`);
        
        console.log("═".repeat(70));
        console.error("❌ ERRO GERAL:", generalError);
        console.log("═".repeat(70));
        
        return Response.json({ 
            success: false, 
            error: generalError.message || 'Internal server error',
            errorName: generalError.name,
            errorMessage: generalError.message,
            stack: generalError.stack,
            debugLog
        }, { status: 500 });
    }
});