import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ✅ FUNÇÃO DE TESTE SUPER SIMPLES
Deno.serve(async (req) => {
    console.log("=" .repeat(60));
    console.log("🧪 TEST ADMIN APPROVE - INÍCIO");
    console.log("=" .repeat(60));
    
    try {
        // Passo 1: Criar cliente
        console.log("1️⃣ Criando cliente Base44...");
        const base44 = createClientFromRequest(req);
        console.log("✅ Cliente criado");
        
        // Passo 2: Verificar auth
        console.log("2️⃣ Verificando autenticação...");
        const user = await base44.auth.me();
        console.log(`✅ Usuário autenticado: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        
        // Passo 3: Verificar se é admin
        console.log("3️⃣ Verificando se é admin...");
        if (user.role !== 'admin') {
            console.log("❌ NÃO é admin!");
            return Response.json({ 
                success: false, 
                error: 'Not admin' 
            }, { status: 403 });
        }
        console.log("✅ É admin!");
        
        // Passo 4: Ler body
        console.log("4️⃣ Lendo body da requisição...");
        const body = await req.json();
        console.log(`✅ Body recebido:`, body);
        
        // Passo 5: Verificar asServiceRole
        console.log("5️⃣ Verificando asServiceRole...");
        console.log(`   base44.asServiceRole existe? ${!!base44.asServiceRole}`);
        
        if (!base44.asServiceRole) {
            console.log("❌ asServiceRole NÃO EXISTE!");
            return Response.json({ 
                success: false, 
                error: 'asServiceRole not available',
                debug: {
                    hasAsServiceRole: !!base44.asServiceRole,
                    base44Keys: Object.keys(base44)
                }
            }, { status: 500 });
        }
        console.log("✅ asServiceRole EXISTE!");
        
        // Passo 6: Listar entidades disponíveis
        console.log("6️⃣ Verificando entidades...");
        console.log(`   base44.asServiceRole.entities existe? ${!!base44.asServiceRole.entities}`);
        
        if (base44.asServiceRole.entities) {
            console.log("✅ Entities disponíveis");
            console.log(`   Keys:`, Object.keys(base44.asServiceRole.entities));
        }
        
        // Passo 7: Tentar buscar 1 usuário como teste
        console.log("7️⃣ TESTE: Buscando usuários...");
        try {
            const users = await base44.asServiceRole.entities.User.list();
            console.log(`✅ Consegui buscar usuários! Total: ${users.length}`);
        } catch (userError) {
            console.log(`❌ ERRO ao buscar usuários:`, userError.message);
            throw userError;
        }
        
        // Passo 8: Tentar atualizar subscription (SEM FAZER DE VERDADE)
        console.log("8️⃣ TESTE: Verificando Subscription...");
        console.log(`   Subscription.update existe? ${!!base44.asServiceRole.entities.Subscription?.update}`);
        
        console.log("=" .repeat(60));
        console.log("🎉 TODOS OS TESTES PASSARAM!");
        console.log("=" .repeat(60));
        
        return Response.json({
            success: true,
            message: 'All tests passed',
            debug: {
                user: user.email,
                role: user.role,
                hasAsServiceRole: true,
                canListUsers: true
            }
        });
        
    } catch (error) {
        console.log("=" .repeat(60));
        console.error("❌ ERRO NO TESTE:");
        console.error(`   Nome: ${error.name}`);
        console.error(`   Mensagem: ${error.message}`);
        console.error(`   Stack:`, error.stack);
        console.log("=" .repeat(60));
        
        return Response.json({ 
            success: false, 
            error: error.message,
            errorName: error.name,
            stack: error.stack
        }, { status: 500 });
    }
});