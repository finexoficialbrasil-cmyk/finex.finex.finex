import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        // ✅ Verificar usuário autenticado PRIMEIRO
        console.log("1️⃣ Verificando autenticação...");
        const user = await base44.auth.me();
        
        if (!user) {
            console.error("❌ Usuário não autenticado");
            return Response.json({ error: 'Não autenticado' }, { status: 401 });
        }

        console.log(`✅ Usuário autenticado: ${user.email}`);

        let processadas = 0;
        let corrigidas = 0;

        // ✅ CORRIGIDO: Buscar contas do usuário com permissões normais
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
                console.log(`\n3️⃣ Processando: ${conta.name} (${conta.id})`);
                processadas++;
                
                // ✅ Buscar transações completadas (permissões normais)
                console.log("   📋 Buscando transações...");
                const transactions = await base44.entities.Transaction.filter({
                    account_id: conta.id,
                    status: 'completed'
                });
                
                console.log(`   ✅ ${transactions.length} transações encontradas`);

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
                    console.log(`   ✏️ CORRIGINDO com service role...`);
                    
                    // ✅ CORRIGIDO: Usar asServiceRole para atualizar
                    await base44.asServiceRole.entities.Account.update(conta.id, {
                        balance: parseFloat(saldoCorreto.toFixed(2))
                    });
                    
                    corrigidas++;
                    console.log(`   ✅ Conta atualizada com sucesso!`);
                } else {
                    console.log(`   ✅ Saldo já está correto`);
                }

            } catch (erroConta) {
                console.error(`   ❌ Erro na conta ${conta.id}:`, erroConta.message);
                console.error(`   Stack:`, erroConta.stack);
                // Continuar para próxima conta mesmo com erro
            }
        }

        console.log("\n✅ CONCLUÍDO!");
        console.log(`📊 Processadas: ${processadas}`);
        console.log(`✅ Corrigidas: ${corrigidas}`);

        return Response.json({
            success: true,
            message: corrigidas > 0 
                ? `${corrigidas} conta(s) corrigida(s) com sucesso!` 
                : "Todas as contas já estavam corretas",
            accountsProcessed: processadas,
            accountsUpdated: corrigidas
        });

    } catch (error) {
        console.error("💥 ERRO FATAL:");
        console.error("Mensagem:", error.message);
        console.error("Stack:", error.stack);
        
        return Response.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});