import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        console.log("🔄 Iniciando recalculateAccountBalance...");

        // Pegar dados da requisição
        const { account_id } = await req.json();
        
        if (!account_id) {
            console.error("❌ account_id não fornecido!");
            return Response.json({ 
                success: false,
                error: 'account_id é obrigatório' 
            }, { status: 400 });
        }

        console.log(`📊 Recalculando conta: ${account_id}`);

        // ✅ SEMPRE usar service role para garantir permissões
        const client = base44.asServiceRole;

        // ✅ AGUARDAR 1.5 segundos para garantir que a transação foi commitada
        console.log("⏰ Aguardando 1.5s para transação commitar...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Buscar a conta
        console.log("🔍 Buscando conta...");
        const accounts = await client.entities.Account.filter({ id: account_id });
        
        if (accounts.length === 0) {
            console.error(`❌ Conta ${account_id} não encontrada!`);
            return Response.json({ 
                success: false,
                error: 'Conta não encontrada' 
            }, { status: 404 });
        }

        const account = accounts[0];
        console.log(`✅ Conta encontrada: ${account.name}`);
        console.log(`💰 Saldo atual: R$ ${account.balance?.toFixed(2) || '0.00'}`);

        // Buscar TODAS as transações COMPLETADAS desta conta
        console.log("🔍 Buscando transações...");
        const allTransactions = await client.entities.Transaction.filter({ 
            account_id: account_id,
            status: 'completed'
        });

        console.log(`📋 Total de transações completadas: ${allTransactions.length}`);

        // Calcular novo saldo
        let newBalance = 0;
        
        console.log("🧮 Calculando saldo:");
        for (const tx of allTransactions) {
            const amount = Number(tx.amount);
            if (isNaN(amount)) {
                console.warn(`⚠️ Transação ${tx.id} com valor inválido: ${tx.amount}`);
                continue;
            }
            
            if (tx.type === 'income') {
                newBalance += amount;
                console.log(`  ✅ + R$ ${amount.toFixed(2)} (${tx.description})`);
            } else if (tx.type === 'expense') {
                newBalance -= amount;
                console.log(`  ❌ - R$ ${amount.toFixed(2)} (${tx.description})`);
            }
        }

        const finalBalance = parseFloat(newBalance.toFixed(2));
        console.log(`💰 Saldo ANTIGO: R$ ${account.balance?.toFixed(2) || '0.00'}`);
        console.log(`💰 Saldo NOVO: R$ ${finalBalance.toFixed(2)}`);
        console.log(`💰 Diferença: R$ ${(finalBalance - (account.balance || 0)).toFixed(2)}`);

        // ✅ Atualizar conta usando SERVICE ROLE
        console.log("💾 Atualizando saldo no banco...");
        await client.entities.Account.update(account_id, {
            balance: finalBalance
        });

        console.log("✅ Update enviado! Aguardando confirmação...");

        // ✅ Aguardar 1 segundo para garantir que salvou
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ✅ Ler novamente para confirmar
        console.log("🔍 Confirmando atualização...");
        const updatedAccounts = await client.entities.Account.filter({ id: account_id });
        const confirmedBalance = updatedAccounts[0]?.balance || 0;

        console.log(`✅ Saldo CONFIRMADO no banco: R$ ${confirmedBalance.toFixed(2)}`);

        if (confirmedBalance !== finalBalance) {
            console.error(`⚠️ ATENÇÃO: Saldo esperado (${finalBalance}) != Saldo confirmado (${confirmedBalance})`);
        } else {
            console.log("✅ Saldo atualizado com SUCESSO!");
        }

        return Response.json({
            success: true,
            account_id: account_id,
            account_name: account.name,
            old_balance: account.balance || 0,
            calculated_balance: finalBalance,
            confirmed_balance: confirmedBalance,
            difference: finalBalance - (account.balance || 0),
            transactions_count: allTransactions.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao recalcular saldo:', error);
        console.error('Stack completo:', error.stack);
        return Response.json({ 
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});