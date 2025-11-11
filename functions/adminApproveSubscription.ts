import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // ✅ VERIFICAR SE É ADMIN
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            console.error("❌ Acesso negado: Apenas admins podem aprovar");
            return Response.json({ 
                success: false,
                error: 'Unauthorized - Admin only' 
            }, { status: 403 });
        }

        // ✅ RECEBER DADOS
        const { subscription_id, user_email, plan_type } = await req.json();

        console.log(`🔍 Admin ${user.email} aprovando assinatura:`);
        console.log(`   • Subscription ID: ${subscription_id}`);
        console.log(`   • User Email: ${user_email}`);
        console.log(`   • Plan Type: ${plan_type}`);

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

        console.log(`📅 Datas calculadas:`);
        console.log(`   • Início: ${startDateStr}`);
        console.log(`   • Fim: ${endDateStr}`);

        // ✅ ATUALIZAR SUBSCRIPTION
        await base44.asServiceRole.entities.Subscription.update(subscription_id, {
            status: "active",
            start_date: startDateStr,
            end_date: endDateStr
        });

        console.log(`✅ Subscription atualizada com sucesso`);

        // ✅ BUSCAR USUÁRIO
        const users = await base44.asServiceRole.entities.User.list();
        const targetUser = users.find(u => u.email === user_email);

        if (!targetUser) {
            console.error(`❌ Usuário não encontrado: ${user_email}`);
            return Response.json({ 
                success: false,
                error: 'User not found' 
            }, { status: 404 });
        }

        console.log(`👤 Usuário encontrado: ${targetUser.id}`);

        // ✅ ATUALIZAR USUÁRIO
        await base44.asServiceRole.entities.User.update(targetUser.id, {
            subscription_status: "active",
            subscription_plan: plan_type,
            subscription_end_date: endDateStr
        });

        console.log(`✅ Usuário atualizado com sucesso`);

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
        console.error("❌ Erro ao aprovar assinatura:", error);
        console.error("📋 Stack:", error.stack);
        
        return Response.json({ 
            success: false, 
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});