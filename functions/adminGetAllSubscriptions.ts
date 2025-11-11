import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // ✅ VERIFICAR SE É ADMIN
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
        }

        console.log(`🔍 Admin ${user.email} solicitou todas as assinaturas`);

        // ✅ USAR asServiceRole NO BACKEND (FUNCIONA AQUI!)
        const subscriptions = await base44.asServiceRole.entities.Subscription.list('-created_date');
        const users = await base44.asServiceRole.entities.User.list();

        console.log(`✅ Retornando ${subscriptions.length} assinaturas e ${users.length} usuários`);

        return Response.json({
            success: true,
            subscriptions,
            users
        });

    } catch (error) {
        console.error("❌ Erro na função adminGetAllSubscriptions:", error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});