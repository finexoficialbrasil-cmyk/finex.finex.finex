import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    console.log("════════════════════════════════════════");
    console.log("🚀 ADMIN GET ALL SUBSCRIPTIONS - INICIADO");
    console.log("════════════════════════════════════════");
    
    const base44 = createClientFromRequest(req);
    
    // ✅ 1. Verificar autenticação
    console.log("1️⃣ Verificando autenticação...");
    const user = await base44.auth.me();
    
    if (!user) {
      console.log("❌ Não autenticado");
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    console.log(`✅ Autenticado: ${user.email} | Role: ${user.role}`);
    
    if (user.role !== 'admin') {
      console.log("❌ Não é admin");
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    console.log("✅ É ADMIN! Continuando...");
    
    // ✅ 2. BUSCAR COM SERVICE ROLE (ignora RLS completamente)
    console.log("2️⃣ Buscando subscriptions com SERVICE ROLE...");
    console.log("   Isto DEVE ignorar TODAS as regras de RLS");
    
    let subscriptions = [];
    let users = [];
    
    try {
      // ✅ CRÍTICO: Service role DEVE retornar TODAS as subscriptions
      subscriptions = await base44.asServiceRole.entities.Subscription.list('-created_date', 1000);
      console.log(`✅ Service Role retornou: ${subscriptions.length} subscriptions`);
      
      // ✅ Mostrar primeiras 3 para debug
      if (subscriptions.length > 0) {
        console.log("📋 Primeiras 3 subscriptions:");
        subscriptions.slice(0, 3).forEach((sub, idx) => {
          console.log(`   ${idx + 1}. ID: ${sub.id} | User: ${sub.user_email} | Status: ${sub.status}`);
        });
      } else {
        console.log("⚠️ Service Role retornou 0 subscriptions!");
        console.log("💡 Isto é ANORMAL - Service role deveria ignorar RLS");
      }
      
      // ✅ Buscar usuários
      console.log("3️⃣ Buscando usuários...");
      users = await base44.asServiceRole.entities.User.list('-created_date', 1000);
      console.log(`✅ Service Role retornou: ${users.length} usuários`);
      
    } catch (error) {
      console.error("❌ Erro ao buscar com Service Role:");
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
      throw error;
    }
    
    // ✅ 3. Calcular stats
    const stats = {
      total: subscriptions.length,
      pending: subscriptions.filter(s => s.status === 'pending').length,
      active: subscriptions.filter(s => s.status === 'active').length,
      expired: subscriptions.filter(s => s.status === 'expired').length,
      cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
      revenue: subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.amount_paid || 0), 0)
    };
    
    console.log("4️⃣ Stats calculadas:");
    console.log("   Total:", stats.total);
    console.log("   Pendentes:", stats.pending);
    console.log("   Ativas:", stats.active);
    console.log("   Receita: R$", stats.revenue.toFixed(2));
    
    console.log("════════════════════════════════════════");
    console.log("✅ FUNÇÃO CONCLUÍDA COM SUCESSO!");
    console.log(`   Retornando: ${subscriptions.length} subs, ${users.length} users`);
    console.log("════════════════════════════════════════");
    
    return Response.json({
      success: true,
      subscriptions,
      users,
      stats,
      debug: {
        admin_email: user.email,
        admin_role: user.role,
        timestamp: new Date().toISOString(),
        subscriptions_count: subscriptions.length,
        users_count: users.length,
        method: 'asServiceRole'
      }
    });
    
  } catch (error) {
    console.error("════════════════════════════════════════");
    console.error("❌ ERRO CRÍTICO NA FUNÇÃO:");
    console.error("   Name:", error.name);
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack);
    console.error("════════════════════════════════════════");
    
    return Response.json({ 
      success: false,
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});