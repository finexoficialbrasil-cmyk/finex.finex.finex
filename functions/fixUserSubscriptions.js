import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // ✅ Apenas admin pode executar
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        console.log("🔧 Iniciando correção de assinaturas...");
        console.log("👤 Executado por:", user.email);

        // ✅ Buscar todos os usuários com service role
        const allUsers = await base44.asServiceRole.entities.User.list();
        console.log(`👥 Total de usuários encontrados: ${allUsers.length}`);

        let fixed = 0;
        let alreadyCorrect = 0;
        let expired = 0;
        const errors = [];
        const updates = [];

        for (const usr of allUsers) {
            try {
                // Pular admins
                if (usr.role === 'admin') {
                    console.log(`⏭️ Pulando admin: ${usr.email}`);
                    continue;
                }

                // Se não tem plano ou data de vencimento, pular
                if (!usr.subscription_plan || !usr.subscription_end_date) {
                    console.log(`⏭️ ${usr.email} - sem plano/data (${usr.subscription_plan}, ${usr.subscription_end_date})`);
                    continue;
                }

                // ✅ Validar formato da data
                if (!usr.subscription_end_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    console.warn(`⚠️ ${usr.email} - formato de data inválido: ${usr.subscription_end_date}`);
                    errors.push({ email: usr.email, error: 'Data em formato inválido' });
                    continue;
                }

                // ✅ Parse da data SEM timezone
                const [year, month, day] = usr.subscription_end_date.split('-').map(Number);
                const endDate = new Date(year, month - 1, day);
                
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                
                const isActive = endDate >= today;
                const currentStatus = usr.subscription_status;

                console.log(`📊 ${usr.email}:`, {
                    plan: usr.subscription_plan,
                    endDate: usr.subscription_end_date,
                    endDateFormatted: endDate.toLocaleDateString('pt-BR'),
                    today: today.toLocaleDateString('pt-BR'),
                    shouldBeActive: isActive,
                    currentStatus: currentStatus
                });

                // ✅ Corrigir se necessário - ATUALIZAR APENAS O STATUS
                if (isActive && currentStatus !== 'active') {
                    console.log(`🔧 ATIVANDO: ${usr.email}`);
                    
                    // ✅ IMPORTANTE: Atualizar APENAS o campo subscription_status
                    await base44.asServiceRole.entities.User.update(usr.id, {
                        subscription_status: 'active'
                    });
                    
                    fixed++;
                    updates.push(`✅ ${usr.email} - ATIVADO`);
                    
                } else if (!isActive && currentStatus === 'active') {
                    console.log(`⏰ EXPIRANDO: ${usr.email}`);
                    
                    await base44.asServiceRole.entities.User.update(usr.id, {
                        subscription_status: 'expired'
                    });
                    
                    expired++;
                    updates.push(`⏰ ${usr.email} - EXPIRADO`);
                    
                } else {
                    console.log(`✅ ${usr.email} - já está correto (${currentStatus})`);
                    alreadyCorrect++;
                }

            } catch (userError) {
                console.error(`❌ Erro ao processar ${usr.email}:`, userError);
                console.error("Stack:", userError.stack);
                errors.push({
                    email: usr.email,
                    error: userError.message
                });
            }
        }

        console.log("\n✅ ========== CORREÇÃO COMPLETA ==========");
        console.log(`✔️ ${fixed} usuários ATIVADOS`);
        console.log(`⏰ ${expired} usuários EXPIRADOS`);
        console.log(`✅ ${alreadyCorrect} já estavam corretos`);
        console.log(`❌ ${errors.length} erros`);
        console.log("========================================\n");

        if (updates.length > 0) {
            console.log("📋 MUDANÇAS REALIZADAS:");
            updates.forEach(u => console.log(u));
        }

        if (errors.length > 0) {
            console.log("\n❌ ERROS:");
            errors.forEach(e => console.log(`  - ${e.email}: ${e.error}`));
        }

        return Response.json({
            success: true,
            message: "Correção de assinaturas concluída!",
            stats: {
                total: allUsers.length,
                fixed,
                expired,
                alreadyCorrect,
                errors: errors.length
            },
            updates: updates.length > 0 ? updates : undefined,
            errorDetails: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error("❌ ERRO GERAL ao corrigir assinaturas:", error);
        console.error("Stack completo:", error.stack);
        
        return Response.json({ 
            success: false,
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});