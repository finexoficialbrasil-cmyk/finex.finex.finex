import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verificar autenticação (apenas admin pode executar)
    const currentUser = await base44.auth.me();
    if (!currentUser || currentUser.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Usar asServiceRole para operações administrativas
    const users = await base44.asServiceRole.entities.User.list();
    
    // ✅ Obter URL do app dinamicamente
    const appUrl = new URL(req.url).origin;
    
    // ✅ NOVO: Verificar se Evolution API está configurada
    const hasEvolutionAPI = Deno.env.get('EVOLUTION_API_URL') && 
                           Deno.env.get('EVOLUTION_API_KEY') && 
                           Deno.env.get('EVOLUTION_INSTANCE_NAME');
    
    console.log(`📱 Evolution API configurada: ${hasEvolutionAPI ? 'SIM' : 'NÃO'}`);
    
    const notifications = [];
    const report = {
      total_users: users.length,
      notifications_sent: 0,
      emails_sent: 0,
      whatsapp_sent: 0,
      errors: 0,
      by_type: {
        '7_days_before': 0,
        '3_days_before': 0,
        '1_day_before': 0,
        'on_expiry': 0,
        '1_day_after': 0,
        '3_days_after': 0,
        '7_days_after': 0
      },
      details: []
    };

    for (const user of users) {
      // Pular admins
      if (user.role === 'admin') continue;

      // Pular usuários sem plano ou com plano vitalício
      if (!user.subscription_end_date || user.subscription_plan === 'lifetime') continue;

      const [year, month, day] = user.subscription_end_date.split('-').map(Number);
      const expiryDate = new Date(year, month - 1, day);
      expiryDate.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let notificationType = null;
      let subject = '';
      let emailMessage = '';
      let whatsappMessage = '';

      // Determinar tipo de notificação baseado em dias
      if (diffDays === 7) {
        notificationType = '7_days_before';
        subject = '🔔 Seu plano FINEX vence em 7 dias!';
        whatsappMessage = `🔔 *FINEX - Aviso de Vencimento*\n\nOlá, *${user.full_name}*! 👋\n\n⚠️ Seu plano *${user.subscription_plan === 'monthly' ? 'Mensal' : user.subscription_plan === 'semester' ? 'Semestral' : 'Anual'}* vence em *7 DIAS*!\n📅 Vencimento: *${expiryDate.toLocaleDateString('pt-BR')}*\n\n💡 Renove agora:\n👉 ${appUrl}/Plans\n\n✨ FINEX - Inteligência Financeira`;
        emailMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
            <div style="background: white; padding: 30px; border-radius: 8px;">
              <h1 style="color: #667eea; margin-bottom: 20px;">🔔 Aviso de Vencimento</h1>
              
              <p style="font-size: 16px; color: #333;">Olá, <strong>${user.full_name}</strong>!</p>
              
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fbbf24;">
                <p style="margin: 0; font-size: 18px; color: #333;">
                  ⚠️ Seu plano <strong>${user.subscription_plan === 'monthly' ? 'Mensal' : user.subscription_plan === 'semester' ? 'Semestral' : 'Anual'}</strong> vence em <strong>7 DIAS</strong>!
                </p>
                <p style="margin: 10px 0 0 0; color: #666;">
                  📅 Data de Vencimento: <strong>${expiryDate.toLocaleDateString('pt-BR')}</strong>
                </p>
              </div>

              <p style="color: #666; line-height: 1.6;">
                💡 Renove agora e continue aproveitando todas as funcionalidades do FINEX sem interrupções!
              </p>

              <div style="margin: 30px 0; text-align: center;">
                <a href="${appUrl}/Plans" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  🔄 RENOVAR AGORA
                </a>
              </div>

              <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #4c51bf;">✨ Benefícios do seu plano:</p>
                <ul style="margin: 0; padding-left: 20px; color: #4c51bf;">
                  <li>✅ Acesso completo ao sistema</li>
                  <li>✅ Relatórios avançados</li>
                  <li>✅ Consultor IA</li>
                  <li>✅ Suporte prioritário</li>
                </ul>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

              <p style="color: #999; font-size: 14px; text-align: center;">
                Dúvidas? Fale conosco pelo WhatsApp!<br>
                <strong>FINEX - Inteligência Financeira</strong>
              </p>
            </div>
          </div>
        `;
      } else if (diffDays === 3) {
        notificationType = '3_days_before';
        subject = '⚠️ Seu plano FINEX vence em 3 dias!';
        whatsappMessage = `⚠️ *FINEX - Atenção!*\n\nOlá, *${user.full_name}*! 👋\n\n🚨 Seu plano vence em apenas *3 DIAS*!\n📅 Vencimento: *${expiryDate.toLocaleDateString('pt-BR')}*\n\n🔒 Não perca o acesso!\nRenove agora:\n👉 ${appUrl}/Plans\n\n✨ FINEX - Inteligência Financeira`;
        emailMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border-radius: 10px;">
            <div style="background: white; padding: 30px; border-radius: 8px;">
              <h1 style="color: #ef4444; margin-bottom: 20px;">⚠️ Atenção: Vencimento Próximo!</h1>
              
              <p style="font-size: 16px; color: #333;">Olá, <strong>${user.full_name}</strong>!</p>
              
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <p style="margin: 0; font-size: 20px; color: #dc2626; font-weight: bold;">
                  ⏰ Seu plano vence em apenas <strong>3 DIAS</strong>!
                </p>
                <p style="margin: 10px 0 0 0; color: #666;">
                  📅 Vencimento: <strong>${expiryDate.toLocaleDateString('pt-BR')}</strong>
                </p>
              </div>

              <p style="color: #666; line-height: 1.6; font-size: 15px;">
                🚨 <strong>Não perca o acesso!</strong> Renove agora mesmo e mantenha seu controle financeiro em dia.
              </p>

              <div style="margin: 30px 0; text-align: center;">
                <a href="${appUrl}/Plans" 
                   style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
                  🔄 RENOVAR AGORA
                </a>
              </div>

              <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #991b1b;">
                  ⚠️ <strong>Após o vencimento:</strong><br>
                  • Acesso ao sistema será bloqueado<br>
                  • Suas transações ficarão inacessíveis<br>
                  • Relatórios e metas não estarão disponíveis
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

              <p style="color: #999; font-size: 14px; text-align: center;">
                FINEX - Inteligência Financeira
              </p>
            </div>
          </div>
        `;
      } else if (diffDays === 1) {
        notificationType = '1_day_before';
        subject = '🚨 URGENTE: Seu plano FINEX vence AMANHÃ!';
        whatsappMessage = `🚨 *FINEX - URGENTE!*\n\n*${user.full_name}*, SEU PLANO VENCE *AMANHÃ*! ⏰\n\n📅 Vencimento: *${expiryDate.toLocaleDateString('pt-BR')}*\n\n⚡ ÚLTIMA CHANCE!\nRenove agora para evitar bloqueio:\n👉 ${appUrl}/Plans\n\n✨ FINEX - Inteligência Financeira`;
        emailMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 10px;">
            <div style="background: white; padding: 30px; border-radius: 8px;">
              <h1 style="color: #dc2626; margin-bottom: 20px;">🚨 URGENTE: Vence AMANHÃ!</h1>
              
              <p style="font-size: 16px; color: #333;">Olá, <strong>${user.full_name}</strong>!</p>
              
              <div style="background: #fee2e2; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #dc2626;">
                <p style="margin: 0; font-size: 24px; color: #dc2626; font-weight: bold; text-align: center;">
                  ⏰ SEU PLANO VENCE AMANHÃ!
                </p>
                <p style="margin: 15px 0 0 0; color: #666; text-align: center; font-size: 16px;">
                  📅 Última Oportunidade: <strong>${expiryDate.toLocaleDateString('pt-BR')}</strong>
                </p>
              </div>

              <p style="color: #666; line-height: 1.6; font-size: 16px; text-align: center;">
                🚨 <strong>ÚLTIMA CHANCE!</strong> Renove AGORA para evitar bloqueio.
              </p>

              <div style="margin: 30px 0; text-align: center;">
                <a href="${appUrl}/Plans" 
                   style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px 60px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 20px; box-shadow: 0 6px 12px rgba(220, 38, 38, 0.4);">
                  ⚡ RENOVAR AGORA
                </a>
              </div>

              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  💡 <strong>Processo rápido:</strong><br>
                  1. Clique no botão acima<br>
                  2. Escolha seu plano<br>
                  3. Faça o pagamento via PIX<br>
                  4. Continue usando imediatamente!
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

              <p style="color: #999; font-size: 14px; text-align: center;">
                FINEX - Inteligência Financeira
              </p>
            </div>
          </div>
        `;
      } else if (diffDays === 0) {
        notificationType = 'on_expiry';
        subject = '🔴 URGENTE: Seu plano FINEX vence HOJE!';
        whatsappMessage = `🔴 *FINEX - VENCE HOJE!*\n\n*${user.full_name}*, seu acesso será bloqueado EM BREVE! ⏰\n\n📅 Vence HOJE: *${expiryDate.toLocaleDateString('pt-BR')}*\n\n⚡ RENOVE IMEDIATAMENTE:\n👉 ${appUrl}/Plans\n\n✨ FINEX - Inteligência Financeira`;
        emailMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #dc2626; border-radius: 10px;">
            <div style="background: white; padding: 30px; border-radius: 8px;">
              <h1 style="color: #dc2626; margin-bottom: 20px; text-align: center;">🔴 VENCE HOJE!</h1>
              
              <div style="background: #dc2626; color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 28px; font-weight: bold;">
                  ⏰ VENCE HOJE!
                </p>
                <p style="margin: 10px 0 0 0; font-size: 18px;">
                  ${user.full_name}, seu acesso será bloqueado em breve!
                </p>
              </div>

              <p style="color: #666; line-height: 1.6; font-size: 16px; text-align: center; margin: 20px 0;">
                🚨 <strong>RENOVE AGORA</strong> para não perder o acesso ao seu controle financeiro!
              </p>

              <div style="margin: 30px 0; text-align: center;">
                <a href="${appUrl}/Plans" 
                   style="display: inline-block; background: #dc2626; color: white; padding: 22px 70px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 22px; box-shadow: 0 8px 16px rgba(220, 38, 38, 0.5);">
                  ⚡ RENOVAR IMEDIATAMENTE
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

              <p style="color: #999; font-size: 14px; text-align: center;">
                FINEX - Inteligência Financeira
              </p>
            </div>
          </div>
        `;
      } else if (diffDays === -1) {
        notificationType = '1_day_after';
        subject = '🔒 Seu plano FINEX venceu ontem - Renove agora!';
        whatsappMessage = `🔒 *FINEX - Acesso Bloqueado*\n\nOlá, *${user.full_name}*\n\nSeu plano venceu ontem e seu acesso está *BLOQUEADO*.\n\n😢 Seus dados estão seguros, mas você não pode acessá-los.\n\n🔓 Renove e desbloqueie:\n👉 ${appUrl}/Plans\n\n✨ FINEX - Inteligência Financeira`;
        emailMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #374151; border-radius: 10px;">
            <div style="background: white; padding: 30px; border-radius: 8px;">
              <h1 style="color: #374151; margin-bottom: 20px;">🔒 Acesso Bloqueado</h1>
              
              <p style="font-size: 16px; color: #333;">Olá, <strong>${user.full_name}</strong>,</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9ca3af;">
                <p style="margin: 0; font-size: 18px; color: #374151;">
                  🔒 Seu plano venceu <strong>ONTEM</strong> e seu acesso está bloqueado.
                </p>
                <p style="margin: 10px 0 0 0; color: #666;">
                  📅 Venceu em: <strong>${expiryDate.toLocaleDateString('pt-BR')}</strong>
                </p>
              </div>

              <p style="color: #666; line-height: 1.6;">
                😢 Seus dados estão seguros, mas você não pode acessá-los no momento.
              </p>

              <div style="margin: 30px 0; text-align: center;">
                <a href="${appUrl}/Plans" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                  🔓 RENOVAR E DESBLOQUEAR
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

              <p style="color: #999; font-size: 14px; text-align: center;">
                FINEX - Inteligência Financeira
              </p>
            </div>
          </div>
        `;
      } else if (diffDays === -3) {
        notificationType = '3_days_after';
        subject = '🔒 Já faz 3 dias - Renove seu FINEX!';
        whatsappMessage = `💜 *FINEX - Sentimos sua falta!*\n\nOlá, *${user.full_name}*\n\nJá faz *3 dias* que seu acesso está bloqueado.\n\n💜 Volte a ter controle total das suas finanças!\n\nRenove agora:\n👉 ${appUrl}/Plans\n\n✨ FINEX - Inteligência Financeira`;
        emailMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1f2937; border-radius: 10px;">
            <div style="background: white; padding: 30px; border-radius: 8px;">
              <h1 style="color: #1f2937; margin-bottom: 20px;">🔒 Já faz 3 dias bloqueado</h1>
              
              <p style="font-size: 16px; color: #333;">Olá, <strong>${user.full_name}</strong>,</p>
              
              <p style="color: #666; line-height: 1.6;">
                Sentimos sua falta! Seu acesso ao FINEX está bloqueado há <strong>3 dias</strong>.
              </p>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #374151;">
                  💜 Volte a ter controle total das suas finanças!
                </p>
              </div>

              <div style="margin: 30px 0; text-align: center;">
                <a href="${appUrl}/Plans" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                  💜 RENOVAR AGORA
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

              <p style="color: #999; font-size: 14px; text-align: center;">
                FINEX - Inteligência Financeira
              </p>
            </div>
          </div>
        `;
      } else if (diffDays === -7) {
        notificationType = '7_days_after';
        subject = '🔒 Última chamada - Seu FINEX espera por você!';
        whatsappMessage = `💔 *FINEX - Última Chamada*\n\nOlá, *${user.full_name}*\n\nJá faz *1 semana* que você está sem acesso ao FINEX.\n\n💡 Seus dados estão seguros e esperando por você!\n\nRenove e volte:\n👉 ${appUrl}/Plans\n\n✨ FINEX - Inteligência Financeira`;
        emailMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #111827; border-radius: 10px;">
            <div style="background: white; padding: 30px; border-radius: 8px;">
              <h1 style="color: #111827; margin-bottom: 20px;">💔 Última Chamada</h1>
              
              <p style="font-size: 16px; color: #333;">Olá, <strong>${user.full_name}</strong>,</p>
              
              <p style="color: #666; line-height: 1.6;">
                Já faz <strong>1 semana</strong> que seu acesso ao FINEX está bloqueado.
              </p>

              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                  💡 Seus dados continuam seguros e esperando por você!<br>
                  Renove agora e volte a ter controle financeiro completo.
                </p>
              </div>

              <div style="margin: 30px 0; text-align: center;">
                <a href="${appUrl}/Plans" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                  💜 VOLTAR PARA O FINEX
                </a>
              </div>

              <p style="color: #999; font-size: 13px; text-align: center; margin-top: 30px;">
                Dúvidas? Entre em contato conosco!
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

              <p style="color: #999; font-size: 14px; text-align: center;">
                FINEX - Inteligência Financeira
              </p>
            </div>
          </div>
        `;
      }

      // Se encontrou uma data que precisa de notificação
      if (notificationType) {
        // Verificar se já enviou essa notificação hoje
        const existingNotifications = await base44.asServiceRole.entities.BillingNotification.filter({
          user_email: user.email,
          notification_type: notificationType,
        });

        const alreadySentToday = existingNotifications.some(n => {
          const sentDate = new Date(n.created_date);
          return sentDate.toDateString() === today.toDateString();
        });

        if (alreadySentToday) {
          report.details.push({
            email: user.email,
            type: notificationType,
            status: 'skipped',
            reason: 'Já enviado hoje'
          });
          continue;
        }

        let emailSuccess = false;
        let whatsappSuccess = false;
        let sentVia = 'none';

        // ✅ ENVIAR EMAIL (sempre)
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: subject,
            body: emailMessage
          });

          emailSuccess = true;
          report.emails_sent++;
          console.log(`✅ Email enviado para ${user.email}`);
        } catch (error) {
          console.error(`❌ Erro ao enviar email para ${user.email}:`, error);
        }

        // ✅ ENVIAR WHATSAPP (se configurado e usuário aceita)
        if (hasEvolutionAPI && user.phone && user.whatsapp_notifications) {
          try {
            const whatsappResponse = await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
              to: user.phone,
              message: whatsappMessage
            });

            if (whatsappResponse.data && whatsappResponse.data.success) {
              whatsappSuccess = true;
              report.whatsapp_sent++;
              console.log(`✅ WhatsApp enviado para ${user.phone}`);
            } else {
              console.error(`❌ Erro ao enviar WhatsApp para ${user.phone}:`, whatsappResponse.data?.error);
            }
          } catch (error) {
            console.error(`❌ Erro ao enviar WhatsApp para ${user.phone}:`, error);
          }
        }

        // Determinar canal usado
        if (emailSuccess && whatsappSuccess) {
          sentVia = 'both';
        } else if (emailSuccess) {
          sentVia = 'email';
        } else if (whatsappSuccess) {
          sentVia = 'whatsapp';
        }

        // Registrar envio
        if (emailSuccess || whatsappSuccess) {
          await base44.asServiceRole.entities.BillingNotification.create({
            user_email: user.email,
            notification_type: notificationType,
            subscription_plan: user.subscription_plan,
            expiry_date: user.subscription_end_date,
            sent_via: sentVia,
            status: 'sent'
          });

          report.notifications_sent++;
          report.by_type[notificationType]++;
          report.details.push({
            email: user.email,
            phone: user.phone,
            type: notificationType,
            status: 'sent',
            sent_via: sentVia,
            expiry_date: user.subscription_end_date
          });
        } else {
          // Ambos falharam
          await base44.asServiceRole.entities.BillingNotification.create({
            user_email: user.email,
            notification_type: notificationType,
            subscription_plan: user.subscription_plan,
            expiry_date: user.subscription_end_date,
            sent_via: 'none',
            status: 'failed',
            error_message: 'Falha ao enviar email e WhatsApp'
          });

          report.errors++;
          report.details.push({
            email: user.email,
            type: notificationType,
            status: 'error',
            error: 'Falha ao enviar'
          });
        }
      }
    }

    console.log('📊 Relatório Final:', report);

    return Response.json({
      success: true,
      report: report
    });

  } catch (error) {
    console.error('❌ Erro na verificação de vencimentos:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});