import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    console.log("════════════════════════════════════════");
    console.log("🚀 FUNÇÃO INICIADA - adminGetAllSubscriptions");
    console.log("════════════════════════════════════════");
    
    // ✅ 1. Criar cliente Base44
    console.log("1️⃣ Criando cliente Base44...");
    const base44 = createClientFromRequest(req);
    console.log("✅ Cliente criado");
    
    // ✅ 2. Verificar se é admin
    console.log("2️⃣ Verificando autenticação...");
    const user = await base44.auth.me();
    
    if (!user) {
      console.log("❌ Usuário não autenticado");
      return Response.json({ 
        error: 'Não autenticado' 
      }, { status: 401 });
    }
    
    console.log(`✅ Usuário: ${user.email} | Role: ${user.role}`);
    
    if (user.role !== 'admin') {
      console.log("❌ Usuário NÃO é admin");
      return Response.json({ 
        error: 'Acesso negado. Apenas admins podem ver todas as subscriptions.' 
      }, { status: 403 });
    }
    
    console.log("✅ Usuário É ADMIN! Prosseguindo...");
    
    // ✅ 3. Buscar TODAS as subscriptions usando SERVICE ROLE (ignora RLS)
    console.log("3️⃣ Buscando subscriptions com SERVICE ROLE...");
    const subscriptions = await base44.asServiceRole.entities.Subscription.list('-created_date', 500);
    console.log(`✅ ${subscriptions.length} subscriptions encontradas`);
    
    // ✅ 4. Buscar TODOS os usuários
    console.log("4️⃣ Buscando usuários...");
    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
    console.log(`✅ ${users.length} usuários encontrados`);
    
    // ✅ 5. Retornar dados
    console.log("5️⃣ Retornando dados...");
    console.log("════════════════════════════════════════");
    console.log("✅ FUNÇÃO CONCLUÍDA COM SUCESSO");
    console.log("════════════════════════════════════════");
    
    return Response.json({
      success: true,
      subscriptions,
      users,
      total: subscriptions.length,
      pending: subscriptions.filter(s => s.status === 'pending').length,
      active: subscriptions.filter(s => s.status === 'active').length
    });
    
  } catch (error) {
    console.error("════════════════════════════════════════");
    console.error("❌ ERRO NA FUNÇÃO:");
    console.error("   Name:", error.name);
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack);
    console.error("════════════════════════════════════════");
    
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});