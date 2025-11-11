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
    
    // ✅ 3. TENTAR DIFERENTES MÉTODOS PARA BUSCAR
    console.log("3️⃣ Testando diferentes métodos de busca...");
    
    let subscriptions = [];
    let method = "";
    
    // ✅ MÉTODO 1: Service Role com limite
    try {
      console.log("📊 Método 1: asServiceRole.entities.Subscription.list()");
      subscriptions = await base44.asServiceRole.entities.Subscription.list('-created_date', 500);
      method = "service_role";
      console.log(`✅ Método 1 funcionou! ${subscriptions.length} subscriptions`);
    } catch (error1) {
      console.error("❌ Método 1 falhou:", error1.message);
      
      // ✅ MÉTODO 2: Service Role sem ordenação
      try {
        console.log("📊 Método 2: asServiceRole.entities.Subscription.list() sem sort");
        subscriptions = await base44.asServiceRole.entities.Subscription.list();
        method = "service_role_no_sort";
        console.log(`✅ Método 2 funcionou! ${subscriptions.length} subscriptions`);
      } catch (error2) {
        console.error("❌ Método 2 falhou:", error2.message);
        
        // ✅ MÉTODO 3: Direto sem service role
        try {
          console.log("📊 Método 3: entities.Subscription.list() direto");
          subscriptions = await base44.entities.Subscription.list('-created_date', 500);
          method = "direct";
          console.log(`✅ Método 3 funcionou! ${subscriptions.length} subscriptions`);
        } catch (error3) {
          console.error("❌ Método 3 falhou:", error3.message);
          console.error("❌ TODOS OS MÉTODOS FALHARAM!");
        }
      }
    }
    
    console.log(`📊 Total encontrado: ${subscriptions.length} subscriptions`);
    console.log(`📊 Método usado: ${method}`);
    
    // ✅ 4. Se encontrou subscriptions, mostrar algumas
    if (subscriptions.length > 0) {
      console.log("📋 Primeiras 3 subscriptions:");
      subscriptions.slice(0, 3).forEach((sub, idx) => {
        console.log(`   ${idx + 1}. ${sub.user_email} | ${sub.plan_type} | ${sub.status} | R$ ${sub.amount_paid}`);
      });
    } else {
      console.log("⚠️ NENHUMA SUBSCRIPTION ENCONTRADA NO BANCO!");
      console.log("💡 Verifique se as subscriptions estão sendo criadas corretamente.");
    }
    
    // ✅ 5. Buscar usuários
    console.log("4️⃣ Buscando usuários...");
    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
    console.log(`✅ ${users.length} usuários encontrados`);
    
    // ✅ 6. Retornar dados
    console.log("5️⃣ Retornando dados...");
    console.log("════════════════════════════════════════");
    console.log(`✅ FUNÇÃO CONCLUÍDA: ${subscriptions.length} subs, ${users.length} users`);
    console.log("════════════════════════════════════════");
    
    return Response.json({
      success: true,
      subscriptions,
      users,
      method_used: method,
      total: subscriptions.length,
      pending: subscriptions.filter(s => s.status === 'pending').length,
      active: subscriptions.filter(s => s.status === 'active').length,
      debug: {
        timestamp: new Date().toISOString(),
        admin_email: user.email,
        subscriptions_count: subscriptions.length,
        users_count: users.length
      }
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