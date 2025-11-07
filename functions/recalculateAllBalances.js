import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        // ✅ Verificar admin
        console.log("1️⃣ Verificando usuário...");
        const user = await base44.auth.me();
        
        if (!user) {
            console.error("❌ Usuário não autenticado");
            return Response.json({ error: 'Não autenticado' }, { status: 401 });
        }
        
        if (user.role !== 'admin') {
            console.error("❌ Usuário não é admin:", user.email);
            return Response.json({ error: 'Acesso negado' }, { status: 403 });
        }

        console.log("✅ Admin verificado:", user.email);

        // ✅ Buscar contas
        console.log("2️⃣ Buscando contas...");
        const accounts = await base44.asServiceRole.entities.Account.list();
        console.log(`✅ ${accounts.length} contas encontradas`);

        if (accounts.length === 0) {
            return Response.json({
                success: true,
                message: "Nenhuma conta para processar",
                accountsProcessed: 0,
                accountsUpdated: 0
            });
        }

        let processadas = 0;
        let corrigidas = 0;

        // ✅ Processar contas UMA POR VEZ
        for (const conta of accounts) {
            try {
                console.log(`\n3️⃣ Processando conta: ${conta.name} (${conta.id})`);
                processadas++;
                
                // Buscar transações
                console.log("   📋 Buscando transações...");
                const transactions = await base44.asServiceRole.entities.Transaction.filter({
                    account_id: conta.id,
                    status: 'completed'
                });
                
                console.log(`   ✅ ${transactions.length} transações encontradas`);

                // Calcular saldo
                let saldoCorreto = 0;
                for (const tx of transactions) {
                    const valor = parseFloat(tx.amount);
                    if (isNaN(valor)) continue;
                    
                    if (tx.type === 'income') {
                        saldoCorreto += valor;
                    } else if (tx.type === 'expense') {
                        saldoCorreto -= valor;
                    }
                }

                const saldoAtual = parseFloat(conta.balance) || 0;
                console.log(`   💰 Saldo atual: R$ ${saldoAtual.toFixed(2)}`);
                console.log(`   💰 Saldo correto: R$ ${saldoCorreto.toFixed(2)}`);

                // Atualizar se diferente
                const diferenca = Math.abs(saldoAtual - saldoCorreto);
                if (diferenca > 0.01) {
                    console.log(`   ✏️ ATUALIZANDO (diferença: R$ ${diferenca.toFixed(2)})`);
                    
                    await base44.asServiceRole.entities.Account.update(conta.id, {
                        balance: parseFloat(saldoCorreto.toFixed(2))
                    });
                    
                    corrigidas++;
                    console.log(`   ✅ Conta atualizada!`);
                } else {
                    console.log(`   ✅ Saldo já está correto`);
                }

            } catch (erroConta) {
                console.error(`   ❌ Erro na conta ${conta.id}:`, erroConta.message);
                // Continuar para próxima conta
            }
        }

        console.log("\n🎉 CONCLUÍDO!");
        console.log(`📊 Processadas: ${processadas}`);
        console.log(`✅ Corrigidas: ${corrigidas}`);

        return Response.json({
            success: true,
            message: "Recálculo concluído com sucesso!",
            accountsProcessed: processadas,
            accountsUpdated: corrigidas
        });

    } catch (error) {
        console.error("💥 ERRO FATAL:");
        console.error("Mensagem:", error.message);
        console.error("Stack:", error.stack);
        
        return Response.json({ 
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});