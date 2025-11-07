import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Autenticar usuário
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Pegar dados da requisição
        const { account_id } = await req.json();
        
        if (!account_id) {
            return Response.json({ 
                success: false,
                error: 'account_id é obrigatório' 
            }, { status: 400 });
        }

        console.log(`🔄 Recalculando saldo da conta: ${account_id}`);

        // Buscar a conta
        const accounts = await base44.entities.Account.filter({ id: account_id });
        if (accounts.length === 0) {
            return Response.json({ 
                success: false,
                error: 'Conta não encontrada' 
            }, { status: 404 });
        }

        const account = accounts[0];
        console.log(`📊 Conta encontrada: ${account.name}`);

        // Buscar TODAS as transações COMPLETADAS desta conta
        const allTransactions = await base44.entities.Transaction.filter({ 
            account_id: account_id,
            status: 'completed'
        });

        console.log(`📋 Total de transações completadas: ${allTransactions.length}`);

        // Calcular novo saldo
        let newBalance = 0;
        
        for (const tx of allTransactions) {
            const amount = Number(tx.amount);
            if (isNaN(amount)) {
                console.warn(`⚠️ Transação ${tx.id} com valor inválido: ${tx.amount}`);
                continue;
            }
            
            if (tx.type === 'income') {
                newBalance += amount;
                console.log(`  + R$ ${amount.toFixed(2)} (${tx.description})`);
            } else if (tx.type === 'expense') {
                newBalance -= amount;
                console.log(`  - R$ ${amount.toFixed(2)} (${tx.description})`);
            }
        }

        console.log(`💰 Saldo calculado: R$ ${newBalance.toFixed(2)}`);

        // Atualizar conta
        await base44.entities.Account.update(account_id, {
            balance: parseFloat(newBalance.toFixed(2))
        });

        console.log(`✅ Saldo atualizado com sucesso!`);

        return Response.json({
            success: true,
            account_name: account.name,
            old_balance: account.balance,
            new_balance: parseFloat(newBalance.toFixed(2)),
            transactions_count: allTransactions.length
        });

    } catch (error) {
        console.error('❌ Erro ao recalcular saldo:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});