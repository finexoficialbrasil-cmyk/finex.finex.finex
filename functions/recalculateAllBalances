import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Segurança: Apenas administradores podem executar esta função.
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Acesso negado. A operação requer privilégios de administrador.' }, { status: 403 });
        }

        console.log(`🚀 Iniciando recálculo de saldos (v2 - paginado) a pedido de: ${user.email}`);

        let accountsProcessed = 0;
        let accountsUpdated = 0;
        const errors = [];
        const pageSize = 500; // Processa 500 contas por vez para evitar timeouts.
        let page = 0;
        let hasMoreAccounts = true;

        // 2. Loop com paginação para buscar contas em lotes.
        while (hasMoreAccounts) {
            console.log(`📖 Buscando página ${page + 1} de contas...`);
            const offset = page * pageSize;
            const accountsBatch = await base44.asServiceRole.entities.Account.list(null, pageSize, offset);

            if (accountsBatch.length === 0) {
                hasMoreAccounts = false;
                break;
            }

            console.log(`📊 Encontradas ${accountsBatch.length} contas nesta página para processar.`);

            // 3. Itera sobre o lote de contas.
            for (const account of accountsBatch) {
                try {
                    accountsProcessed++;
                    
                    const accountTransactions = await base44.asServiceRole.entities.Transaction.filter(
                        { account_id: account.id, status: 'completed' }, 
                        null, 
                        50000 // Limite alto de transações por conta.
                    );

                    const correctBalance = accountTransactions.reduce((balance, tx) => {
                        const amount = Number(tx.amount) || 0;
                        return tx.type === 'income' ? balance + amount : balance - amount;
                    }, 0);

                    const currentBalance = Number(account.balance) || 0;

                    if (currentBalance.toFixed(2) !== correctBalance.toFixed(2)) {
                        console.log(`⚠️ Corrigindo saldo da conta ${account.name || `ID ${account.id}`} de R$ ${currentBalance.toFixed(2)} para R$ ${correctBalance.toFixed(2)}`);
                        await base44.asServiceRole.entities.Account.update(account.id, {
                            balance: parseFloat(correctBalance.toFixed(2))
                        });
                        accountsUpdated++;
                    }
                } catch (error) {
                    const errorMessage = `Falha ao processar conta ID ${account.id}: ${error.message}`;
                    console.error(`❌ ${errorMessage}`);
                    errors.push(errorMessage);
                }
            }
            page++;
        }

        console.log(`✅ Concluído! ${accountsProcessed} contas processadas, ${accountsUpdated} atualizadas.`);

        const responseMessage = `Operação concluída. ${accountsUpdated} de ${accountsProcessed} contas tiveram seus saldos corrigidos.`;
        return Response.json({
            success: true,
            message: responseMessage,
            accountsProcessed,
            accountsUpdated,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        const fatalErrorMessage = `Erro fatal no servidor: ${error.message}`;
        console.error(`❌ ${fatalErrorMessage}`);
        return Response.json({ 
            success: false,
            error: fatalErrorMessage
        }, { status: 500 });
    }
});