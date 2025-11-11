import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ✅ TODOS OS TEMPLATES COMPLETOS
const EMAIL_TEMPLATES = {
  '3_days_before': {
    subject: '⏰ Seu plano FINEX vence em 3 dias!',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 20px;">
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #8b5cf6; text-align: center; font-size: 28px; margin-bottom: 20px;">
            ⏰ Seu plano vence em <span style="color: #ec4899;">3 DIAS</span>!
          </h1>
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Olá, <strong>{{USER_NAME}}</strong>! 👋
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Notamos que seu plano <strong style="color: #8b5cf6;">{{PLAN_NAME}}</strong> está prestes a vencer!
          </p>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>📅 Data de Vencimento:</strong> {{EXPIRY_DATE}}<br>
              <strong>⏳ Tempo Restante:</strong> 3 dias
            </p>
          </div>
          <ul style="color: #555; font-size: 15px; line-height: 1.8; margin-bottom: 25px;">
            <li>✅ Mantenha acesso ilimitado a todas as funcionalidades</li>
            <li>✅ Continue organizando suas finanças sem interrupções</li>
            <li>✅ Preserve todos os seus dados e relatórios</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold; box-shadow: 0 5px 15px rgba(139, 92, 246, 0.4);">
              ⚡ RENOVAR AGORA
            </a>
          </div>
          <p style="color: #666; font-size: 13px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            💜 FINEX - Inteligência Financeira
          </p>
        </div>
      </div>
    `
  },

  '2_days_before': {
    subject: '⚠️ URGENTE: Seu plano vence em 2 dias!',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px 20px; border-radius: 20px;">
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #ef4444; text-align: center; font-size: 28px; margin-bottom: 20px;">
            ⚠️ ATENÇÃO: Faltam apenas <span style="color: #dc2626;">2 DIAS</span>!
          </h1>
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>{{USER_NAME}}</strong>, seu acesso ao FINEX está prestes a expirar! ⏳
          </p>
          <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #991b1b; font-size: 15px; font-weight: bold;">
              🚨 SEU PLANO {{PLAN_NAME}} VENCE EM 48 HORAS!
            </p>
          </div>
          <ul style="color: #ef4444; font-size: 15px; line-height: 1.8; margin-bottom: 25px;">
            <li>❌ Perda de acesso a todas as funcionalidades premium</li>
            <li>❌ Bloqueio de relatórios e análises</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold; box-shadow: 0 5px 20px rgba(239, 68, 68, 0.5);">
              🚀 RENOVAR URGENTE
            </a>
          </div>
        </div>
      </div>
    `
  },

  '1_day_before': {
    subject: '🔴 ÚLTIMO DIA! Seu plano vence AMANHÃ!',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 20px; border-radius: 20px;">
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <h1 style="color: #dc2626; text-align: center; font-size: 32px; margin-bottom: 20px;">
            🔴 ÚLTIMO DIA!
          </h1>
          <p style="color: #333; font-size: 18px; line-height: 1.8; margin-bottom: 20px; font-weight: bold; text-align: center;">
            {{USER_NAME}}, seu acesso ao FINEX vence AMANHÃ! ⏰
          </p>
          <div style="background: #fee2e2; border: 3px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 12px; text-align: center;">
            <p style="margin: 0; color: #991b1b; font-size: 20px; font-weight: bold;">
              ⏳ MENOS DE 24 HORAS!
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 20px 60px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: bold; box-shadow: 0 8px 25px rgba(220, 38, 38, 0.6); text-transform: uppercase;">
              ⚡ RENOVAR AGORA!
            </a>
          </div>
        </div>
      </div>
    `
  },

  'expired_today': {
    subject: '🔴 VENCIDO: Seu plano FINEX expirou hoje!',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1f2937; padding: 40px 20px; border-radius: 20px;">
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
          <h1 style="color: #dc2626; text-align: center; font-size: 32px; margin-bottom: 20px;">
            🔴 VENCE HOJE!
          </h1>
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>{{USER_NAME}}</strong>, seu acesso será bloqueado em breve! ⚠️
          </p>
          <div style="background: #fee2e2; border: 3px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 12px;">
            <p style="margin: 0; color: #991b1b; font-size: 18px; font-weight: bold; text-align: center;">
              ⏰ SEU PLANO VENCE HOJE!<br>
              Renove AGORA para não perder acesso!
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 20px 60px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: bold; box-shadow: 0 8px 25px rgba(220, 38, 38, 0.6);">
              ⚡ RENOVAR IMEDIATAMENTE
            </a>
          </div>
        </div>
      </div>
    `
  },

  '1_day_after': {
    subject: '❌ BLOQUEADO: Seu acesso ao FINEX foi suspenso',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1f2937; padding: 40px 20px; border-radius: 20px;">
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
          <h1 style="color: #991b1b; text-align: center; font-size: 28px; margin-bottom: 20px;">
            ❌ ACESSO BLOQUEADO
          </h1>
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>{{USER_NAME}}</strong>, infelizmente seu plano expirou ontem. 😔
          </p>
          <div style="background: #fee2e2; border-left: 4px solid #991b1b; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #991b1b; font-size: 15px;">
              <strong>📅 Venceu em:</strong> {{EXPIRY_DATE}}<br>
              <strong>🔒 Status:</strong> BLOQUEADO
            </p>
          </div>
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>💡 Boa notícia:</strong> Você ainda pode reativar sua conta e recuperar todo o seu histórico!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold; box-shadow: 0 5px 20px rgba(16, 185, 129, 0.5);">
              🔓 REATIVAR MINHA CONTA
            </a>
          </div>
        </div>
      </div>
    `
  },

  '5_days_after': {
    subject: '⚠️ 5 dias sem acesso - Seus dados ainda estão seguros!',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; border-radius: 20px;">
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <h1 style="color: #8b5cf6; text-align: center; font-size: 28px; margin-bottom: 20px;">
            💜 Sentimos sua falta!
          </h1>
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Olá, <strong>{{USER_NAME}}</strong>!
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Já faz 5 dias desde que seu plano expirou, e estamos com saudades de ter você usando o FINEX! 😊
          </p>
          <div style="background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #5b21b6; font-size: 15px;">
              <strong>✨ Seus dados estão 100% seguros!</strong><br><br>
              • Todo o seu histórico financeiro está preservado<br>
              • Suas transações e relatórios estão intactos
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold; box-shadow: 0 5px 20px rgba(139, 92, 246, 0.5);">
              💜 VOLTAR PARA O FINEX
            </a>
          </div>
        </div>
      </div>
    `
  },

  '15_days_after': {
    subject: '🎯 Última chance de recuperar seu histórico financeiro',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #374151; padding: 40px 20px; border-radius: 20px;">
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
          <h1 style="color: #f59e0b; text-align: center; font-size: 28px; margin-bottom: 20px;">
            ⚠️ 15 Dias Sem Você
          </h1>
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>{{USER_NAME}}</strong>, seu plano expirou há 15 dias.
          </p>
          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 12px;">
            <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: bold; text-align: center;">
              🔔 AVISO IMPORTANTE<br><br>
              Seus dados ainda estão preservados,<br>
              mas não sabemos por quanto tempo mais...
            </p>
          </div>
          <ul style="color: #555; font-size: 15px; line-height: 1.8; margin-bottom: 25px;">
            <li>📊 Retome o controle das suas finanças</li>
            <li>💰 Não perca seu histórico valioso</li>
            <li>✨ Volte a usar todos os recursos premium</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold; box-shadow: 0 5px 20px rgba(245, 158, 11, 0.5);">
              🔄 REATIVAR AGORA
            </a>
          </div>
        </div>
      </div>
    `
  },

  '30_days_after': {
    subject: '🚨 URGENTE: 30 dias - Risco de perda permanente de dados',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1f2937; padding: 40px 20px; border-radius: 20px;">
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <h1 style="color: #dc2626; text-align: center; font-size: 32px; margin-bottom: 20px;">
            🚨 ALERTA CRÍTICO
          </h1>
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>{{USER_NAME}}</strong>, são 30 dias desde o vencimento do seu plano.
          </p>
          <div style="background: #fee2e2; border: 3px solid #dc2626; padding: 25px; margin: 25px 0; border-radius: 12px;">
            <p style="margin: 0; color: #991b1b; font-size: 18px; font-weight: bold; text-align: center;">
              ⚠️ RISCO DE PERDA PERMANENTE<br><br>
              Após este período, seus dados podem<br>
              ser removidos permanentemente do sistema!
            </p>
          </div>
          <ul style="color: #dc2626; font-size: 15px; line-height: 1.8; margin-bottom: 25px; font-weight: bold;">
            <li>📊 Todo o seu histórico de transações</li>
            <li>💰 Seus relatórios financeiros completos</li>
            <li>🎯 Metas e objetivos financeiros</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 22px 60px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: bold; box-shadow: 0 8px 25px rgba(220, 38, 38, 0.6); text-transform: uppercase;">
              🆘 SALVAR MEUS DADOS
            </a>
          </div>
        </div>
      </div>
    `
  },

  'monthly_after_30': {
    subject: '💔 Você realmente vai desistir do controle financeiro?',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px; border-radius: 20px;">
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
          <h1 style="color: #7c3aed; text-align: center; font-size: 28px; margin-bottom: 20px;">
            💔 Sentimos Muito Sua Falta
          </h1>
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>{{USER_NAME}}</strong>, já faz {{DAYS_EXPIRED}} dias que seu plano expirou...
          </p>
          <div style="background: #f3e8ff; border-left: 4px solid #7c3aed; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #6b21a8; font-size: 15px; line-height: 1.8;">
              Sabemos que a vida anda corrida, mas não deixe seu futuro financeiro de lado! 💜
            </p>
          </div>
          <ul style="color: #555; font-size: 15px; line-height: 1.8; margin-bottom: 25px;">
            <li>💰 Ter controle total das suas finanças</li>
            <li>📊 Visualizar para onde vai seu dinheiro</li>
            <li>🎯 Alcançar suas metas financeiras</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold; box-shadow: 0 5px 20px rgba(124, 58, 237, 0.5);">
              💜 QUERO VOLTAR!
            </a>
          </div>
        </div>
      </div>
    `
  }
};

Deno.serve(async (req) => {
  try {
    console.log("════════════════════════════════════════");
    console.log("📧 ENVIO MANUAL DE EMAIL DE COBRANÇA");
    console.log("════════════════════════════════════════");
    
    const base44 = createClientFromRequest(req);
    
    // Verificar se é admin
    const admin = await base44.auth.me();
    if (!admin || admin.role !== 'admin') {
      console.log("❌ Acesso negado - não é admin");
      return Response.json({ 
        success: false,
        error: 'Acesso negado. Apenas admin.' 
      }, { status: 403 });
    }
    
    console.log(`✅ Admin autenticado: ${admin.email}`);
    
    // Obter parâmetros
    const { user_email, email_type } = await req.json();
    
    console.log(`📧 Parâmetros recebidos:`);
    console.log(`   Email: ${user_email}`);
    console.log(`   Tipo: ${email_type}`);
    
    if (!user_email || !email_type) {
      return Response.json({ 
        success: false,
        error: 'user_email e email_type são obrigatórios' 
      }, { status: 400 });
    }
    
    // Buscar usuário
    console.log(`🔍 Buscando usuário: ${user_email}`);
    const users = await base44.asServiceRole.entities.User.list();
    const user = users.find(u => u.email === user_email);
    
    if (!user) {
      console.log(`❌ Usuário não encontrado: ${user_email}`);
      return Response.json({ 
        success: false,
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }
    
    console.log(`✅ Usuário encontrado: ${user.full_name}`);
    
    // Buscar template
    console.log(`📝 Buscando template: ${email_type}`);
    const template = EMAIL_TEMPLATES[email_type];
    
    if (!template) {
      console.log(`❌ Template não encontrado: ${email_type}`);
      console.log(`📋 Templates disponíveis:`, Object.keys(EMAIL_TEMPLATES));
      return Response.json({ 
        success: false,
        error: `Tipo de email inválido: ${email_type}. Tipos disponíveis: ${Object.keys(EMAIL_TEMPLATES).join(', ')}` 
      }, { status: 400 });
    }
    
    console.log(`✅ Template encontrado!`);
    
    // Calcular dias
    let diffDays = 0;
    if (user.subscription_end_date) {
      const [year, month, day] = user.subscription_end_date.split('-').map(Number);
      const expiryDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      console.log(`📅 Diferença de dias: ${diffDays}`);
    }
    
    // Preparar email
    console.log(`📝 Preparando email...`);
    let emailBody = template.body
      .replace(/{{USER_NAME}}/g, user.full_name || user.email.split('@')[0])
      .replace(/{{PLAN_NAME}}/g, formatPlanName(user.subscription_plan))
      .replace(/{{EXPIRY_DATE}}/g, formatDate(user.subscription_end_date))
      .replace(/{{RENEWAL_LINK}}/g, 'https://finex.base44.app')
      .replace(/{{DAYS_EXPIRED}}/g, Math.abs(diffDays));
    
    // Enviar email
    console.log(`📤 Enviando email...`);
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: template.subject,
      body: emailBody
    });
    
    console.log(`✅ Email enviado com sucesso!`);
    
    // Logar no banco
    console.log(`💾 Salvando log no banco...`);
    await base44.asServiceRole.entities.EmailLog.create({
      recipient_email: user.email,
      recipient_name: user.full_name || user.email.split('@')[0],
      email_type: email_type,
      subject: template.subject,
      status: 'sent',
      plan_type: user.subscription_plan,
      expiry_date: user.subscription_end_date,
      days_difference: diffDays,
      sent_by: 'manual'
    });
    
    console.log(`✅ Log salvo no banco!`);
    console.log("════════════════════════════════════════");
    console.log(`✅ PROCESSO CONCLUÍDO COM SUCESSO!`);
    console.log("════════════════════════════════════════");
    
    return Response.json({
      success: true,
      message: `Email enviado com sucesso para ${user.email}`,
      email_type,
      recipient: user.email,
      subject: template.subject
    });
    
  } catch (error) {
    console.error("════════════════════════════════════════");
    console.error("❌ ERRO CRÍTICO:");
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

function formatPlanName(plan) {
  const plans = {
    monthly: 'Mensal',
    semester: 'Semestral',
    annual: 'Anual',
    lifetime: 'Vitalício'
  };
  return plans[plan] || plan || 'Premium';
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}