import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // ✅ Apenas admin pode executar
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log("🔧 Iniciando correção de assinaturas...");

        // ✅ Buscar todos os usuários
        const allUsers = await base44.asServiceRole.entities.User.list();
        console.log(`👥 Total de usuários: ${allUsers.length}`);

        let fixed = 0;
        let alreadyCorrect = 0;
        let expired = 0;

        for (const usr of allUsers) {
            // Pular admins
            if (usr.role === 'admin') {
                console.log(`⏭️ Pulando admin: ${usr.email}`);
                continue;
            }

            // Se não tem plano ou data de vencimento, pular
            if (!usr.subscription_plan || !usr.subscription_end_date) {
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
                endDate: endDate.toLocaleDateString('pt-BR'),
                today: today.toLocaleDateString('pt-BR'),
                shouldBeActive: isActive,
                currentStatus: currentStatus
            });

            // ✅ Corrigir se necessário
            if (isActive && currentStatus !== 'active') {
                console.log(`🔧 CORRIGINDO: ${usr.email} deveria estar ATIVO`);
                await base44.asServiceRole.entities.User.update(usr.id, {
                    subscription_status: 'active'
                });
                fixed++;
            } else if (!isActive && currentStatus === 'active') {
                console.log(`⏰ EXPIRANDO: ${usr.email} deveria estar EXPIRADO`);
                await base44.asServiceRole.entities.User.update(usr.id, {
                    subscription_status: 'expired'
                });
                expired++;
            } else {
                alreadyCorrect++;
            }
        }

        console.log(`✅ Correção completa!`);
        console.log(`✔️ ${fixed} usuários ATIVADOS`);
        console.log(`⏰ ${expired} usuários EXPIRADOS`);
        console.log(`✅ ${alreadyCorrect} já estavam corretos`);

        return Response.json({
            success: true,
            message: "Correção de assinaturas concluída!",
            stats: {
                total: allUsers.length,
                fixed,
                expired,
                alreadyCorrect
            }
        });

    } catch (error) {
        console.error("❌ Erro ao corrigir assinaturas:", error);
        return Response.json({ 
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});