import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        // ✅ Verificar usuário autenticado
        console.log("1️⃣ Verificando autenticação...");
        const user = await base44.auth.me();
        
        if (!user) {
            console.error("❌ Usuário não autenticado");
            return Response.json({ error: 'Não autenticado' }, { status: 401 });
        }

        console.log(`✅ Usuário autenticado: ${user.email}`);

        let processadas = 0;
        let corrigidas = 0;

        // ✅ Buscar apenas MINHAS contas
        console.log("2️⃣ Buscando suas contas...");
        const accounts = await base44.entities.Account.list();
        console.log(`✅ ${accounts.length} contas encontradas`);

        if (accounts.length === 0) {
            return Response.json({
                success: true,
                message: "Você não tem contas cadastradas",
                accountsProcessed: 0,
                accountsUpdated: 0
            });
        }

        // ✅ Processar cada conta
        for (const conta of accounts) {
            try {
                console.log(`\n3️⃣ Processando: ${conta.name}`);
                processadas++;
                
                // Buscar transações completadas
                console.log("   📋 Buscando transações...");
                const transactions = await base44.entities.Transaction.filter({
                    account_id: conta.id,
                    status: 'completed'
                });
                
                console.log(`   ✅ ${transactions.length} transações`);

                // Calcular saldo correto
                let saldoCorreto = 0;
                for (const tx of transactions) {
                    const valor = parseFloat(tx.amount);
                    if (isNaN(valor)) {
                        console.warn(`   ⚠️ Valor inválido: ${tx.amount}`);
                        continue;
                    }
                    
                    if (tx.type === 'income') {
                        saldoCorreto += valor;
                    } else if (tx.type === 'expense') {
                        saldoCorreto -= valor;
                    }
                }

                const saldoAtual = parseFloat(conta.balance) || 0;
                console.log(`   💰 Atual: R$ ${saldoAtual.toFixed(2)}`);
                console.log(`   💰 Correto: R$ ${saldoCorreto.toFixed(2)}`);

                // Atualizar se diferente
                const diferenca = Math.abs(saldoAtual - saldoCorreto);
                if (diferenca > 0.01) {
                    console.log(`   ✏️ CORRIGINDO...`);
                    
                    await base44.entities.Account.update(conta.id, {
                        balance: parseFloat(saldoCorreto.toFixed(2))
                    });
                    
                    corrigidas++;
                    console.log(`   ✅ Corrigido!`);
                } else {
                    console.log(`   ✅ Já está correto`);
                }

            } catch (erroConta) {
                console.error(`   ❌ Erro: ${erroConta.message}`);
            }
        }

        console.log("\n✅ CONCLUÍDO!");
        console.log(`📊 Processadas: ${processadas}`);
        console.log(`✅ Corrigidas: ${corrigidas}`);

        return Response.json({
            success: true,
            message: "Recálculo concluído!",
            accountsProcessed: processadas,
            accountsUpdated: corrigidas
        });

    } catch (error) {
        console.error("💥 ERRO:");
        console.error("Mensagem:", error.message);
        console.error("Stack:", error.stack);
        
        return Response.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});