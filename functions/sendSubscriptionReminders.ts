import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ✅ TEMPLATES DE EMAIL REDESENHADOS - ULTRA MODERNOS E PROFISSIONAIS
const EMAIL_TEMPLATES = {
  // ... (Manter todos os templates anteriores que já foram criados)
  // Vou adicionar apenas os que faltam
  
  '15_days_after': {
    subject: '🎯 Última chance! Recupere seu histórico financeiro agora',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #374151;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #374151; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.4);">
                <tr>
                  <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 50px 40px; text-align: center;">
                    <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 25px; border-radius: 50%; margin-bottom: 25px;">
                      <span style="font-size: 70px;">⚠️</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 38px; font-weight: 900; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
                      15 Dias Sem Você
                    </h1>
                    <p style="color: rgba(255,255,255,0.95); margin: 15px 0 0 0; font-size: 18px;">
                      Seus dados ainda estão seguros! 💾
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #1f2937; font-size: 18px; line-height: 1.8; margin: 0 0 20px 0;">
                      <strong style="color: #f59e0b;">{{USER_NAME}}</strong>, seu plano expirou há 15 dias.
                    </p>
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 20px; padding: 35px; margin: 30px 0; text-align: center;">
                      <p style="margin: 0 0 15px 0; font-size: 32px;">🔔</p>
                      <p style="margin: 0 0 10px 0; color: #92400e; font-size: 22px; font-weight: 900;">
                        AVISO IMPORTANTE
                      </p>
                      <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.8; font-weight: 600;">
                        Seus dados ainda estão preservados,<br>
                        mas não sabemos por quanto tempo mais...
                      </p>
                    </div>
                    <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 20px 0; font-weight: 700;">
                      💡 Por que voltar agora?
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 15px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px;">
                          <div style="display: flex; align-items: center;">
                            <span style="font-size: 24px; margin-right: 12px;">📊</span>
                            <p style="margin: 0; color: #92400e; font-size: 15px; font-weight: 600;">
                              Retome o controle das suas finanças
                            </p>
                          </div>
                        </td>
                      </tr>
                      <tr><td style="height: 10px;"></td></tr>
                      <tr>
                        <td style="padding: 15px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px;">
                          <div style="display: flex; align-items: center;">
                            <span style="font-size: 24px; margin-right: 12px;">💰</span>
                            <p style="margin: 0; color: #92400e; font-size: 15px; font-weight: 600;">
                              Não perca seu histórico valioso
                            </p>
                          </div>
                        </td>
                      </tr>
                      <tr><td style="height: 10px;"></td></tr>
                      <tr>
                        <td style="padding: 15px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px;">
                          <div style="display: flex; align-items: center;">
                            <span style="font-size: 24px; margin-right: 12px;">✨</span>
                            <p style="margin: 0; color: #92400e; font-size: 15px; font-weight: 600;">
                              Volte a usar todos os recursos premium
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>
                    <div style="text-align: center; margin: 50px 0 30px 0;">
                      <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 22px 55px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: 900; box-shadow: 0 10px 40px rgba(245, 158, 11, 0.5); text-transform: uppercase; letter-spacing: 1px;">
                        🔄 Reativar Agora
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #f59e0b; font-size: 14px; font-weight: 600;">
                      Não deixe seus dados se perderem! Renove hoje mesmo.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },

  '30_days_after': {
    subject: '🚨 URGENTE: 30 dias - Risco de perda permanente!',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1f2937;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #1f2937; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,0.5);">
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 50px 40px; text-align: center;">
                    <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 25px; border-radius: 50%; margin-bottom: 25px;">
                      <span style="font-size: 70px;">🚨</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 40px; font-weight: 900; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                      ALERTA CRÍTICO
                    </h1>
                    <p style="color: white; margin: 15px 0 0 0; font-size: 20px; font-weight: 700;">
                      30 dias desde o vencimento
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #1f2937; font-size: 18px; line-height: 1.8; margin: 0 0 30px 0;">
                      <strong style="color: #dc2626;">{{USER_NAME}}</strong>, são 30 dias desde o vencimento do seu plano.
                    </p>
                    <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 4px solid #dc2626; border-radius: 20px; padding: 40px; margin: 30px 0; text-align: center; box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3);">
                      <p style="margin: 0 0 20px 0; font-size: 36px;">⚠️</p>
                      <p style="margin: 0 0 15px 0; color: #991b1b; font-size: 26px; font-weight: 900;">
                        RISCO DE PERDA PERMANENTE
                      </p>
                      <p style="margin: 0; color: #7f1d1d; font-size: 16px; line-height: 1.8; font-weight: 600;">
                        Após este período, seus dados podem<br>
                        ser removidos permanentemente do sistema!
                      </p>
                    </div>
                    <p style="color: #1f2937; font-size: 18px; margin: 30px 0 20px 0; font-weight: 700;">
                      ⏳ Esta é sua ÚLTIMA CHANCE de recuperar:
                    </p>
                    <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #dc2626; font-size: 16px; line-height: 2; font-weight: 700;">
                      <li>📊 Todo o seu histórico de transações</li>
                      <li>💰 Seus relatórios financeiros completos</li>
                      <li>📈 Análises e gráficos personalizados</li>
                      <li>🎯 Metas e objetivos financeiros</li>
                    </ul>
                    <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 15px; padding: 25px; margin: 30px 0; border-left: 5px solid #10b981;">
                      <p style="margin: 0 0 15px 0; color: #065f46; font-size: 18px; font-weight: 900;">
                        ✅ Renove AGORA e:
                      </p>
                      <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.8;">
                        • Recupere TUDO instantaneamente<br>
                        • Mantenha seu histórico para sempre<br>
                        • Continue de onde parou
                      </p>
                    </div>
                    <div style="text-align: center; margin: 50px 0 30px 0;">
                      <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 25px 60px; text-decoration: none; border-radius: 50px; font-size: 24px; font-weight: 900; box-shadow: 0 15px 50px rgba(220, 38, 38, 0.6); text-transform: uppercase; letter-spacing: 2px; border: 3px solid white;">
                        🆘 Salvar Meus Dados
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background: #fee2e2; padding: 30px; text-align: center; border-top: 4px solid #dc2626;">
                    <p style="margin: 0 0 10px 0; color: #991b1b; font-size: 16px; font-weight: 900;">
                      ⚠️ ÚLTIMA OPORTUNIDADE!
                    </p>
                    <p style="margin: 0; color: #7f1d1d; font-size: 14px; font-weight: 600; line-height: 1.6;">
                      Não perca anos de controle financeiro.<br>
                      Renove AGORA antes que seja tarde demais!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },

  'monthly_after_30': {
    subject: '💔 Você realmente vai desistir do controle financeiro?',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.4);">
                <tr>
                  <td style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); padding: 50px 40px; text-align: center;">
                    <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 25px; border-radius: 50%; margin-bottom: 25px;">
                      <span style="font-size: 70px;">💔</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 38px; font-weight: 900; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
                      Sentimos Muito Sua Falta
                    </h1>
                    <p style="color: rgba(255,255,255,0.95); margin: 15px 0 0 0; font-size: 18px;">
                      Volte quando estiver pronto 💜
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #1f2937; font-size: 18px; line-height: 1.8; margin: 0 0 20px 0;">
                      <strong style="color: #7c3aed;">{{USER_NAME}}</strong>, já faz {{DAYS_EXPIRED}} dias que seu plano expirou...
                    </p>
                    <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-radius: 15px; padding: 30px; margin: 30px 0; border-left: 5px solid #7c3aed;">
                      <p style="margin: 0 0 15px 0; color: #6b21a8; font-size: 16px; line-height: 1.8;">
                        Sabemos que a vida anda corrida, mas não deixe seu futuro financeiro de lado! 💜
                      </p>
                      <p style="margin: 0; color: #6b21a8; font-size: 16px; font-weight: 700;">
                        Seus dados ainda estão conosco, esperando você voltar.
                      </p>
                    </div>
                    <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 20px 0; font-weight: 700;">
                      🌟 Lembre-se por que você começou:
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 15px; background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-radius: 12px;">
                          <div style="display: flex; align-items: center;">
                            <span style="font-size: 24px; margin-right: 12px;">💰</span>
                            <p style="margin: 0; color: #6b21a8; font-size: 15px; font-weight: 600;">
                              Ter controle total das suas finanças
                            </p>
                          </div>
                        </td>
                      </tr>
                      <tr><td style="height: 10px;"></td></tr>
                      <tr>
                        <td style="padding: 15px; background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-radius: 12px;">
                          <div style="display: flex; align-items: center;">
                            <span style="font-size: 24px; margin-right: 12px;">📊</span>
                            <p style="margin: 0; color: #6b21a8; font-size: 15px; font-weight: 600;">
                              Visualizar para onde vai seu dinheiro
                            </p>
                          </div>
                        </td>
                      </tr>
                      <tr><td style="height: 10px;"></td></tr>
                      <tr>
                        <td style="padding: 15px; background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-radius: 12px;">
                          <div style="display: flex; align-items: center;">
                            <span style="font-size: 24px; margin-right: 12px;">🎯</span>
                            <p style="margin: 0; color: #6b21a8; font-size: 15px; font-weight: 600;">
                              Alcançar suas metas financeiras
                            </p>
                          </div>
                        </td>
                      </tr>
                      <tr><td style="height: 10px;"></td></tr>
                      <tr>
                        <td style="padding: 15px; background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-radius: 12px;">
                          <div style="display: flex; align-items: center;">
                            <span style="font-size: 24px; margin-right: 12px;">✨</span>
                            <p style="margin: 0; color: #6b21a8; font-size: 15px; font-weight: 600;">
                              Construir um futuro mais próspero
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>
                    <div style="text-align: center; margin: 50px 0 30px 0;">
                      <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: white; padding: 22px 55px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: 900; box-shadow: 0 10px 40px rgba(124, 58, 237, 0.5); text-transform: uppercase; letter-spacing: 1px;">
                        💜 Quero Voltar!
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #7c3aed; font-size: 14px; font-weight: 600;">
                      Estamos aqui, torcendo pelo seu sucesso financeiro! 🚀
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Volte quando estiver pronto. Sempre haverá um lugar para você no FINEX.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }
};

// ✅ FUNÇÃO PARA LOGAR EMAIL
async function logEmail(base44, data) {
  try {
    await base44.asServiceRole.entities.EmailLog.create({
      recipient_email: data.recipient_email,
      recipient_name: data.recipient_name,
      email_type: data.email_type,
      subject: data.subject,
      status: data.status,
      error_message: data.error_message || null,
      plan_type: data.plan_type,
      expiry_date: data.expiry_date,
      days_difference: data.days_difference,
      sent_by: data.sent_by || 'automatic'
    });
    console.log(`   ✅ Email logado no banco de dados`);
  } catch (error) {
    console.error(`   ⚠️ Erro ao logar email:`, error.message);
  }
}

// ✅ FUNÇÃO PRINCIPAL
Deno.serve(async (req) => {
  try {
    console.log("════════════════════════════════════════");
    console.log("📧 SISTEMA DE COBRANÇAS AUTOMÁTICAS");
    console.log("════════════════════════════════════════");
    
    const base44 = createClientFromRequest(req);
    
    // ✅ Verificar se é admin ou cron job
    const user = await base44.auth.me();
    
    if (user && user.role !== 'admin') {
      return Response.json({ 
        error: 'Acesso negado. Apenas admin pode executar.' 
      }, { status: 403 });
    }
    
    console.log("✅ Autorizado. Iniciando processamento...");
    
    // ✅ Buscar todos os usuários com planos
    console.log("📊 Buscando usuários com planos ativos/expirados...");
    const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    
    const usersWithPlans = users.filter(u => 
      u.subscription_end_date && 
      u.role !== 'admin'
    );
    
    console.log(`✅ ${usersWithPlans.length} usuários com planos encontrados`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const results = {
      processed: 0,
      emails_sent: 0,
      errors: 0,
      by_stage: {}
    };
    
    // ✅ Processar cada usuário
    for (const user of usersWithPlans) {
      try {
        const [year, month, day] = user.subscription_end_date.split('-').map(Number);
        const expiryDate = new Date(year, month - 1, day);
        expiryDate.setHours(0, 0, 0, 0);
        
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`\n👤 Processando: ${user.email}`);
        console.log(`   Vencimento: ${user.subscription_end_date}`);
        console.log(`   Diferença: ${diffDays} dias`);
        
        let templateKey = null;
        let stageName = '';
        
        // ✅ Determinar qual template usar
        if (diffDays === 3) {
          templateKey = '3_days_before';
          stageName = '3 dias antes';
        } else if (diffDays === 2) {
          templateKey = '2_days_before';
          stageName = '2 dias antes';
        } else if (diffDays === 1) {
          templateKey = '1_day_before';
          stageName = '1 dia antes';
        } else if (diffDays === 0) {
          templateKey = 'expired_today';
          stageName = 'vence hoje';
        } else if (diffDays === -1) {
          templateKey = '1_day_after';
          stageName = '1 dia vencido';
        } else if (diffDays === -5) {
          templateKey = '5_days_after';
          stageName = '5 dias vencido';
        } else if (diffDays === -15) {
          templateKey = '15_days_after';
          stageName = '15 dias vencido';
        } else if (diffDays === -30) {
          templateKey = '30_days_after';
          stageName = '30 dias vencido';
        } else if (diffDays <= -60 && diffDays % 30 === 0) {
          templateKey = 'monthly_after_30';
          stageName = `${Math.abs(diffDays)} dias vencido (mensal)`;
        }
        
        // ✅ Se deve enviar email
        if (templateKey) {
          console.log(`   📧 Enviando email: ${stageName}`);
          
          const template = EMAIL_TEMPLATES[templateKey];
          
          // ✅ Substituir variáveis
          let emailBody = template.body
            .replace(/{{USER_NAME}}/g, user.full_name || user.email.split('@')[0])
            .replace(/{{PLAN_NAME}}/g, formatPlanName(user.subscription_plan))
            .replace(/{{EXPIRY_DATE}}/g, formatDate(user.subscription_end_date))
            .replace(/{{RENEWAL_LINK}}/g, 'https://finex.base44.app')
            .replace(/{{DAYS_EXPIRED}}/g, Math.abs(diffDays));
          
          try {
            // ✅ Enviar email
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: template.subject,
              body: emailBody
            });
            
            console.log(`   ✅ Email enviado com sucesso!`);
            
            // ✅ Logar email enviado
            await logEmail(base44, {
              recipient_email: user.email,
              recipient_name: user.full_name || user.email.split('@')[0],
              email_type: templateKey,
              subject: template.subject,
              status: 'sent',
              plan_type: user.subscription_plan,
              expiry_date: user.subscription_end_date,
              days_difference: diffDays,
              sent_by: 'automatic'
            });
            
            results.emails_sent++;
            results.by_stage[stageName] = (results.by_stage[stageName] || 0) + 1;
            
          } catch (emailError) {
            console.error(`   ❌ Erro ao enviar email:`, emailError.message);
            
            // ✅ Logar email com erro
            await logEmail(base44, {
              recipient_email: user.email,
              recipient_name: user.full_name || user.email.split('@')[0],
              email_type: templateKey,
              subject: template.subject,
              status: 'failed',
              error_message: emailError.message,
              plan_type: user.subscription_plan,
              expiry_date: user.subscription_end_date,
              days_difference: diffDays,
              sent_by: 'automatic'
            });
            
            results.errors++;
          }
        } else {
          console.log(`   ⏭️ Nenhum email programado para ${diffDays} dias`);
        }
        
        results.processed++;
        
      } catch (error) {
        console.error(`   ❌ Erro ao processar ${user.email}:`, error.message);
        results.errors++;
      }
    }
    
    console.log("\n════════════════════════════════════════");
    console.log("✅ PROCESSAMENTO CONCLUÍDO!");
    console.log("════════════════════════════════════════");
    console.log(`📊 Usuários processados: ${results.processed}`);
    console.log(`📧 Emails enviados: ${results.emails_sent}`);
    console.log(`❌ Erros: ${results.errors}`);
    console.log("\n📈 Por estágio:");
    for (const [stage, count] of Object.entries(results.by_stage)) {
      console.log(`   ${stage}: ${count}`);
    }
    console.log("════════════════════════════════════════");
    
    return Response.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("════════════════════════════════════════");
    console.error("❌ ERRO CRÍTICO:");
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack);
    console.error("════════════════════════════════════════");
    
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});

// ✅ FUNÇÕES AUXILIARES
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