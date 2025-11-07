import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Esta função é chamada em segundo plano para cada usuário
Deno.serve(async (req) => {
    try {
        const { user_email } = await req.json();
        if (!user_email) {
            return Response.json({ error: "Email do usuário é obrigatório." }, { status: 400 });
        }

        // Usamos createClientFromRequest para autenticação de serviço a serviço
        const base44 = createClientFromRequest(req);
        
        console.log(`⚙️ Processando recálculo para o usuário: ${user_email}`);

        // Busca contas e transações para este usuário específico
        const userAccounts = await base44.asServiceRole.entities.Account.filter({ created_by: user_email }, null, 5000);
        const userTransactions = await base44.asServiceRole.entities.Transaction.filter({ created_by: user_email, status: 'completed' }, null, 50000);

        let accountsUpdated = 0;

        for (const account of userAccounts) {
            const accountTransactions = userTransactions.filter(tx => tx.account_id === account.id);
            
            const correctBalance = accountTransactions.reduce((balance, tx) => {
                const amount = Number(tx.amount);
                if (isNaN(amount)) return balance;
                return tx.type === 'income' ? balance + amount : balance - amount;
            }, 0);

            const currentBalance = Number(account.balance) || 0;

            if (currentBalance.toFixed(2) !== correctBalance.toFixed(2)) {
                await base44.asServiceRole.entities.Account.update(account.id, {
                    balance: parseFloat(correctBalance.toFixed(2))
                });
                accountsUpdated++;
            }
        }
        
        console.log(`✅ Concluído para ${user_email}. Contas atualizadas: ${accountsUpdated}`);
        
        return Response.json({ success: true, message: `Processado ${user_email}. ${accountsUpdated} contas atualizadas.` });

    } catch (error) {
        const errorBody = await req.json().catch(() => ({}));
        console.error(`❌ Erro fatal ao processar usuário ${errorBody.user_email || 'desconhecido'}:`, error.message);
        // Retorna sucesso para não interromper a fila de tarefas, mas loga o erro.
        return Response.json({ success: false, error: error.message });
    }
});