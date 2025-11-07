import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // ✅ Segurança: Apenas administradores
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
        }

        console.log(`🚀 INÍCIO - Admin: ${user.email}`);

        let accountsProcessed = 0;
        let accountsUpdated = 0;
        const errors = [];

        // ✅ SUPER SIMPLES: Buscar contas sem parâmetros complexos
        console.log(`📖 Buscando todas as contas...`);
        const allAccounts = await base44.asServiceRole.entities.Account.list();
        
        console.log(`📊 Total: ${allAccounts.length} contas`);

        // ✅ PROCESSAR UMA POR VEZ (sem paralelismo)
        for (const account of allAccounts) {
            try {
                console.log(`⚙️ Processando: ${account.name || account.id}`);
                accountsProcessed++;
                
                // ✅ CORRIGIDO: Buscar Transaction, não Account
                const accountTransactions = await base44.asServiceRole.entities.Transaction.filter(
                    { account_id: account.id, status: 'completed' }
                );

                console.log(`  📋 ${accountTransactions.length} transações encontradas`);

                // Calcular saldo correto
                let correctBalance = 0;
                for (const tx of accountTransactions) {
                    const amount = parseFloat(tx.amount) || 0;
                    if (tx.type === 'income') {
                        correctBalance += amount;
                    } else if (tx.type === 'expense') {
                        correctBalance -= amount;
                    }
                }

                const currentBalance = parseFloat(account.balance) || 0;

                console.log(`  💰 Saldo atual: R$ ${currentBalance.toFixed(2)}`);
                console.log(`  💰 Saldo correto: R$ ${correctBalance.toFixed(2)}`);

                // Atualizar se diferente (tolerância de 1 centavo)
                if (Math.abs(currentBalance - correctBalance) > 0.01) {
                    console.log(`  ✏️ ATUALIZANDO...`);
                    
                    await base44.asServiceRole.entities.Account.update(account.id, {
                        balance: parseFloat(correctBalance.toFixed(2))
                    });
                    
                    accountsUpdated++;
                    console.log(`  ✅ Conta atualizada!`);
                } else {
                    console.log(`  ✅ Saldo já correto, nada a fazer`);
                }

            } catch (error) {
                const errorMessage = `Erro na conta ${account.id}: ${error.message}`;
                console.error(`  ❌ ${errorMessage}`);
                errors.push(errorMessage);
            }
        }

        console.log(`\n✅ CONCLUÍDO!`);
        console.log(`📊 Processadas: ${accountsProcessed}`);
        console.log(`✅ Corrigidas: ${accountsUpdated}`);
        console.log(`❌ Erros: ${errors.length}`);

        return Response.json({
            success: true,
            message: `Recálculo concluído!`,
            accountsProcessed,
            accountsUpdated,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error(`❌ ERRO FATAL:`, error.message);
        console.error(`Stack:`, error.stack);
        
        return Response.json({ 
            success: false,
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});