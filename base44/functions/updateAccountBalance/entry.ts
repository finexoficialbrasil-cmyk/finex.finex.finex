import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // ✅ VERIFICAR AUTENTICAÇÃO E PERMISSÃO ADMIN
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }
        if (user.role !== 'admin') {
            return Response.json({ success: false, error: 'Acesso restrito a administradores' }, { status: 403 });
        }

        console.log("💰 Iniciando updateAccountBalance...");

        // Pegar dados da requisição
        const { account_id, amount, operation } = await req.json();
        
        if (!account_id) {
            console.error("❌ account_id não fornecido!");
            return Response.json({ 
                success: false,
                error: 'account_id é obrigatório' 
            }, { status: 400 });
        }

        if (!amount || isNaN(parseFloat(amount))) {
            console.error("❌ amount inválido!");
            return Response.json({ 
                success: false,
                error: 'amount é obrigatório e deve ser numérico' 
            }, { status: 400 });
        }

        if (!operation || !['add', 'subtract'].includes(operation)) {
            console.error("❌ operation inválida!");
            return Response.json({ 
                success: false,
                error: 'operation deve ser "add" ou "subtract"' 
            }, { status: 400 });
        }

        const amountValue = parseFloat(amount);
        console.log(`📊 Operação: ${operation} R$ ${amountValue.toFixed(2)} na conta ${account_id}`);

        // ✅ SEMPRE usar service role para garantir permissões totais
        const client = base44.asServiceRole;

        // ✅ CORRIGIDO: Buscar TODAS as contas e filtrar manualmente
        console.log("🔍 Buscando todas as contas...");
        const allAccounts = await client.entities.Account.list();
        console.log(`📊 Total de contas no sistema: ${allAccounts.length}`);
        
        // Filtrar manualmente pela conta específica
        const account = allAccounts.find(acc => acc.id === account_id);
        
        if (!account) {
            console.error(`❌ Conta ${account_id} não encontrada!`);
            console.log(`📋 IDs disponíveis:`, allAccounts.map(a => a.id));
            return Response.json({ 
                success: false,
                error: 'Conta não encontrada',
                available_ids: allAccounts.map(a => a.id)
            }, { status: 404 });
        }

        const currentBalance = account.balance || 0;
        
        console.log(`✅ Conta: ${account.name}`);
        console.log(`💰 Saldo ATUAL: R$ ${currentBalance.toFixed(2)}`);

        // Calcular NOVO saldo
        let newBalance;
        if (operation === 'add') {
            newBalance = currentBalance + amountValue;
            console.log(`➕ Somando: R$ ${currentBalance.toFixed(2)} + R$ ${amountValue.toFixed(2)} = R$ ${newBalance.toFixed(2)}`);
        } else {
            newBalance = currentBalance - amountValue;
            console.log(`➖ Subtraindo: R$ ${currentBalance.toFixed(2)} - R$ ${amountValue.toFixed(2)} = R$ ${newBalance.toFixed(2)}`);
        }

        const finalBalance = parseFloat(newBalance.toFixed(2));

        // ✅ Atualizar AGORA
        console.log("💾 Atualizando saldo no banco...");
        await client.entities.Account.update(account_id, {
            balance: finalBalance
        });

        console.log("✅ Update enviado!");

        // ✅ Aguardar 500ms
        await new Promise(resolve => setTimeout(resolve, 500));

        // ✅ Confirmar lendo novamente
        console.log("🔍 Confirmando atualização...");
        const updatedAccounts = await client.entities.Account.list();
        const updatedAccount = updatedAccounts.find(acc => acc.id === account_id);
        const confirmedBalance = updatedAccount?.balance || 0;

        console.log(`✅ Saldo CONFIRMADO: R$ ${confirmedBalance.toFixed(2)}`);

        if (Math.abs(confirmedBalance - finalBalance) > 0.01) {
            console.error(`⚠️ DIVERGÊNCIA: Esperado R$ ${finalBalance.toFixed(2)}, Confirmado R$ ${confirmedBalance.toFixed(2)}`);
        }

        return Response.json({
            success: true,
            account_id: account_id,
            account_name: account.name,
            old_balance: currentBalance,
            amount: amountValue,
            operation: operation,
            new_balance: finalBalance,
            confirmed_balance: confirmedBalance,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao atualizar saldo:', error);
        console.error('Stack completo:', error.stack);
        return Response.json({ 
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});