import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // ✅ Segurança: Apenas administradores
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
        }

        console.log(`🚀 Iniciando recálculo de saldos - Admin: ${user.email}`);

        let accountsProcessed = 0;
        let accountsUpdated = 0;
        const errors = [];

        // ✅ CORRIGIDO: Buscar TODAS as contas de uma vez (limite razoável)
        console.log(`📖 Buscando contas...`);
        const allAccounts = await base44.asServiceRole.entities.Account.list(null, 1000);
        
        console.log(`📊 Total de contas encontradas: ${allAccounts.length}`);

        // ✅ Processar em lotes para evitar sobrecarga
        const batchSize = 10; // Processa 10 contas por vez
        
        for (let i = 0; i < allAccounts.length; i += batchSize) {
            const batch = allAccounts.slice(i, i + batchSize);
            console.log(`⚙️ Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(allAccounts.length/batchSize)}`);
            
            // Processar contas do lote em paralelo
            await Promise.all(batch.map(async (account) => {
                try {
                    accountsProcessed++;
                    
                    // Buscar transações completadas da conta
                    const accountTransactions = await base44.asServiceRole.entities.Transaction.filter(
                        { account_id: account.id, status: 'completed' }, 
                        null, 
                        10000
                    );

                    // Calcular saldo correto
                    const correctBalance = accountTransactions.reduce((balance, tx) => {
                        const amount = Number(tx.amount) || 0;
                        return tx.type === 'income' ? balance + amount : balance - amount;
                    }, 0);

                    const currentBalance = Number(account.balance) || 0;

                    // Atualizar apenas se diferente
                    if (Math.abs(currentBalance - correctBalance) > 0.01) {
                        console.log(`⚠️ Corrigindo conta ${account.name || account.id}: R$ ${currentBalance.toFixed(2)} → R$ ${correctBalance.toFixed(2)}`);
                        
                        await base44.asServiceRole.entities.Account.update(account.id, {
                            balance: parseFloat(correctBalance.toFixed(2))
                        });
                        
                        accountsUpdated++;
                    }
                } catch (error) {
                    const errorMessage = `Erro na conta ${account.id}: ${error.message}`;
                    console.error(`❌ ${errorMessage}`);
                    errors.push(errorMessage);
                }
            }));
        }

        console.log(`✅ Concluído! ${accountsProcessed} processadas, ${accountsUpdated} corrigidas.`);

        return Response.json({
            success: true,
            message: `✅ Recálculo concluído com sucesso!`,
            accountsProcessed,
            accountsUpdated,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limitar erros retornados
        });

    } catch (error) {
        console.error(`❌ Erro fatal:`, error);
        return Response.json({ 
            success: false,
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});