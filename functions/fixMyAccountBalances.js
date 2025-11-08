import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        // ✅ Autenticar usuário
        const user = await base44.auth.me();
        
        if (!user) {
            console.log("❌ Usuário não autenticado");
            return Response.json({ 
                success: false,
                error: 'Unauthorized' 
            }, { status: 401 });
        }

        console.log("🔧 Iniciando correção de saldos para:", user.email);

        // ✅ Buscar todas as contas do usuário
        const accounts = await base44.entities.Account.filter({});
        console.log(`💳 Total de contas: ${accounts.length}`);

        let fixed = 0;
        const errors = [];
        const results = [];

        // ✅ Processar cada conta
        for (const account of accounts) {
            try {
                console.log(`🔄 Processando conta: ${account.name}`);
                
                // Buscar todas as transações COMPLETADAS desta conta
                const accountTransactions = await base44.entities.Transaction.filter({
                    account_id: account.id,
                    status: 'completed'
                });

                console.log(`  📊 Transações encontradas: ${accountTransactions.length}`);

                // Calcular saldo correto
                let newBalance = 0;
                
                for (const tx of accountTransactions) {
                    const amount = Number(tx.amount);
                    if (isNaN(amount)) continue;
                    
                    if (tx.type === 'income') {
                        newBalance += amount;
                    } else if (tx.type === 'expense') {
                        newBalance -= amount;
                    }
                }

                const oldBalance = account.balance || 0;
                
                console.log(`  💰 Saldo antigo: R$ ${oldBalance.toFixed(2)}`);
                console.log(`  💰 Saldo correto: R$ ${newBalance.toFixed(2)}`);

                // Atualizar saldo
                await base44.entities.Account.update(account.id, {
                    balance: parseFloat(newBalance.toFixed(2))
                });

                fixed++;
                
                results.push({
                    account: account.name,
                    oldBalance: parseFloat(oldBalance.toFixed(2)),
                    newBalance: parseFloat(newBalance.toFixed(2)),
                    difference: parseFloat((newBalance - oldBalance).toFixed(2)),
                    transactions: accountTransactions.length
                });

                console.log(`  ✅ Conta "${account.name}" corrigida!`);
                
            } catch (accountError) {
                console.error(`❌ Erro na conta ${account.name}:`, accountError.message);
                errors.push({
                    account: account.name,
                    error: accountError.message
                });
            }
        }

        console.log("✅ Correção completa!");
        console.log(`  ✔️ ${fixed} contas corrigidas`);
        console.log(`  ❌ ${errors.length} erros`);

        return Response.json({
            success: true,
            message: `${fixed} conta(s) corrigida(s)`,
            results: results,
            errors: errors.length > 0 ? errors : null
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