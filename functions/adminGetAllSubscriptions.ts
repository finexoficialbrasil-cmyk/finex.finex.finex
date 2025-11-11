import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // ✅ VERIFICAR SE É ADMIN
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            console.error("❌ Acesso negado: Apenas admins podem acessar");
            return Response.json({ 
                success: false,
                error: 'Unauthorized - Admin only' 
            }, { status: 403 });
        }

        console.log(`🔍 Admin ${user.email} solicitou todas as assinaturas`);

        // ✅ USAR SERVICE ROLE COM LIMITE (PERFORMANCE)
        try {
            // Carregar apenas últimas 200 assinaturas (mais recentes)
            // Isso melhora drasticamente a performance
            const subscriptions = await base44.asServiceRole.entities.Subscription.list('-created_date', 200);
            const users = await base44.asServiceRole.entities.User.list('-created_date', 500);

            console.log(`✅ Carregado: ${subscriptions.length} assinaturas e ${users.length} usuários (com limite de performance)`);

            return Response.json({
                success: true,
                subscriptions,
                users,
                count: {
                    subscriptions: subscriptions.length,
                    users: users.length
                },
                limited: true // ✅ Indica que há limite
            });

        } catch (serviceError) {
            console.error("❌ Erro ao usar asServiceRole:", serviceError);
            console.log("⚠️ Tentando método alternativo...");

            // ✅ FALLBACK com limite também
            const subscriptions = await base44.entities.Subscription.list('-created_date', 200);
            const users = await base44.entities.User.list('-created_date', 500);

            console.log(`✅ Fallback: ${subscriptions.length} assinaturas e ${users.length} usuários`);

            return Response.json({
                success: true,
                subscriptions,
                users,
                fallback: true,
                limited: true,
                count: {
                    subscriptions: subscriptions.length,
                    users: users.length
                }
            });
        }

    } catch (error) {
        console.error("❌ Erro geral na função adminGetAllSubscriptions:", error);
        console.error("📋 Stack:", error.stack);
        
        return Response.json({ 
            success: false, 
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});