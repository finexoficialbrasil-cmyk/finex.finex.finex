import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // ✅ Tentar autenticar usuário
        let user = null;
        let useServiceRole = false;
        
        try {
            user = await base44.auth.me();
            console.log("✅ Usuário autenticado:", user?.email);
        } catch (authError) {
            console.log("⚠️ Sem autenticação de usuário, usando service role");
            useServiceRole = true;
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

        // ✅ Escolher cliente correto (service role ou user)
        const client = useServiceRole ? base44.asServiceRole : base44;

        // ✅ Aguardar 1 segundo para garantir que a transação foi commitada
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Buscar a conta
        const accounts = await client.entities.Account.filter({ id: account_id });
        if (accounts.length === 0) {
            return Response.json({ 
                success: false,
                error: 'Conta não encontrada' 
            }, { status: 404 });
        }

        const account = accounts[0];
        console.log(`📊 Conta encontrada: ${account.name}`);

        // Buscar TODAS as transações COMPLETADAS desta conta
        const allTransactions = await client.entities.Transaction.filter({ 
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

        const finalBalance = parseFloat(newBalance.toFixed(2));
        console.log(`💰 Saldo antigo: R$ ${account.balance?.toFixed(2) || '0.00'}`);
        console.log(`💰 Saldo calculado: R$ ${finalBalance.toFixed(2)}`);

        // ✅ Atualizar conta
        await client.entities.Account.update(account_id, {
            balance: finalBalance
        });

        console.log(`✅ Saldo atualizado com sucesso!`);

        // ✅ Aguardar mais 500ms para garantir que atualizou
        await new Promise(resolve => setTimeout(resolve, 500));

        // ✅ Ler novamente para confirmar
        const updatedAccounts = await client.entities.Account.filter({ id: account_id });
        const updatedBalance = updatedAccounts[0]?.balance || 0;

        console.log(`✅ Saldo confirmado no banco: R$ ${updatedBalance.toFixed(2)}`);

        return Response.json({
            success: true,
            account_name: account.name,
            old_balance: account.balance,
            new_balance: finalBalance,
            confirmed_balance: updatedBalance,
            transactions_count: allTransactions.length,
            used_service_role: useServiceRole
        });

    } catch (error) {
        console.error('❌ Erro ao recalcular saldo:', error);
        console.error('Stack:', error.stack);
        return Response.json({ 
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});