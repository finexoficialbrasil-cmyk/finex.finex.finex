import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // IDs dos usuários com acesso indevido por comprovante duplicado
        const usersToRevoke = [
            "68e9679f8772b8325c25d464", // nadir26clara@gmail.com
            "68e6ed3321101b58b3a3a324", // lip.rfsz@gmail.com
            "6935b8c4d1ca25b7aef34566", // larissa09071996@gmail.com
            "694eba36abcae56ac4c03da8", // alineagapejb@gmail.com
        ];

        const results = [];
        for (const userId of usersToRevoke) {
            await base44.asServiceRole.entities.User.update(userId, {
                subscription_status: "pending",
                subscription_plan: null,
                subscription_end_date: null,
            });
            results.push({ id: userId, revoked: true });
            console.log(`✅ Revogado: ${userId}`);
        }

        return Response.json({ success: true, results });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});