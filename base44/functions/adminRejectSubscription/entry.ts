import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // ✅ VERIFICAR SE É ADMIN
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            console.error("❌ Acesso negado: Apenas admins podem rejeitar");
            return Response.json({ 
                success: false,
                error: 'Unauthorized - Admin only' 
            }, { status: 403 });
        }

        // ✅ RECEBER DADOS
        const body = await req.json();
        const { subscription_id } = body;

        console.log(`🔍 Admin ${user.email} rejeitando assinatura: ${subscription_id}`);

        // ✅ VALIDAR DADOS
        if (!subscription_id) {
            console.error("❌ subscription_id não fornecido");
            return Response.json({ 
                success: false,
                error: 'Missing required field: subscription_id' 
            }, { status: 400 });
        }

        // ✅ ATUALIZAR SUBSCRIPTION COM asServiceRole
        try {
            console.log(`🔄 Atualizando Subscription ${subscription_id} para 'cancelled'...`);
            await base44.asServiceRole.entities.Subscription.update(subscription_id, {
                status: "cancelled"
            });
            console.log(`✅ Subscription rejeitada com sucesso`);
        } catch (subError) {
            console.error("❌ Erro ao rejeitar Subscription:", subError);
            return Response.json({ 
                success: false,
                error: 'Failed to reject subscription',
                details: subError.message
            }, { status: 500 });
        }

        return Response.json({
            success: true,
            message: 'Assinatura rejeitada com sucesso',
            data: {
                subscription_id
            }
        });

    } catch (error) {
        console.error("❌ Erro geral ao rejeitar assinatura:", error);
        console.error("📋 Stack:", error.stack);
        
        return Response.json({ 
            success: false, 
            error: error.message || 'Internal server error',
            details: error.stack
        }, { status: 500 });
    }
});