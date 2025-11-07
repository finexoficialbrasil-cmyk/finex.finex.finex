import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        // ✅ Autenticar usuário
        const user = await base44.auth.me();

        // ✅ Verificar se é admin
        if (!user || user.role !== 'admin') {
            console.log("❌ Acesso negado - usuário não é admin");
            return Response.json({ 
                success: false,
                error: 'Unauthorized - Admin only' 
            }, { status: 401 });
        }

        console.log("🔧 Iniciando correção de assinaturas...");
        console.log("👤 Executado por:", user.email);

        // ✅ Buscar todos os usuários
        const allUsers = await base44.asServiceRole.entities.User.list();
        console.log(`👥 Total de usuários: ${allUsers.length}`);

        let fixed = 0;
        let alreadyCorrect = 0;
        let expired = 0;
        const errors = [];

        // ✅ Processar cada usuário
        for (const usr of allUsers) {
            try {
                // Pular admins
                if (usr.role === 'admin') {
                    continue;
                }

                // Pular se não tem dados de assinatura
                if (!usr.subscription_plan || !usr.subscription_end_date) {
                    continue;
                }

                // ✅ Validar formato da data
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(usr.subscription_end_date)) {
                    console.warn(`⚠️ Data inválida: ${usr.email}`);
                    errors.push({ email: usr.email, error: 'Formato de data inválido' });
                    continue;
                }

                // ✅ Calcular se está ativo (SEM timezone)
                const parts = usr.subscription_end_date.split('-');
                const endYear = parseInt(parts[0]);
                const endMonth = parseInt(parts[1]) - 1;
                const endDay = parseInt(parts[2]);
                const endDate = new Date(endYear, endMonth, endDay);
                
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                
                const shouldBeActive = endDate >= today;
                const currentStatus = usr.subscription_status;

                // ✅ Atualizar apenas se necessário
                if (shouldBeActive && currentStatus !== 'active') {
                    console.log(`🔧 Ativando: ${usr.email}`);
                    
                    await base44.asServiceRole.entities.User.update(usr.id, {
                        subscription_status: 'active'
                    });
                    
                    fixed++;
                    
                } else if (!shouldBeActive && currentStatus === 'active') {
                    console.log(`⏰ Expirando: ${usr.email}`);
                    
                    await base44.asServiceRole.entities.User.update(usr.id, {
                        subscription_status: 'expired'
                    });
                    
                    expired++;
                    
                } else {
                    alreadyCorrect++;
                }

            } catch (userError) {
                console.error(`❌ Erro em ${usr.email}:`, userError.message);
                errors.push({
                    email: usr.email,
                    error: userError.message
                });
            }
        }

        console.log("✅ Correção completa!");
        console.log(`  ✔️ ${fixed} ativados`);
        console.log(`  ⏰ ${expired} expirados`);
        console.log(`  ✅ ${alreadyCorrect} corretos`);
        console.log(`  ❌ ${errors.length} erros`);

        return Response.json({
            success: true,
            stats: {
                total: allUsers.length,
                fixed: fixed,
                expired: expired,
                alreadyCorrect: alreadyCorrect,
                errors: errors.length
            },
            errorDetails: errors.length > 0 ? errors : null
        });

    } catch (error) {
        console.error("❌ ERRO GERAL:", error);
        console.error("Stack:", error.stack);
        
        return Response.json({ 
            success: false,
            error: error.message || 'Erro desconhecido',
            stack: error.stack
        }, { status: 500 });
    }
});