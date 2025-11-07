import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function WelcomeEmailSender() {
  const [checked, setChecked] = useState(false);
  const [sending, setSending] = useState(false);

  console.log("🔵 WelcomeEmailSender renderizando (invisível)");

  useEffect(() => {
    console.log("🎯 WelcomeEmailSender montado! Iniciando verificação...");
    
    const timer = setTimeout(() => {
      console.log("⏰ Timer acionado, verificando trial e email...");
      checkAndActivateTrial();
    }, 3000);

    return () => {
      console.log("🧹 WelcomeEmailSender desmontado, limpando timer");
      clearTimeout(timer);
    };
  }, []);

  const checkAndActivateTrial = async () => {
    console.log("🔍 checkAndActivateTrial() iniciada");
    console.log(`🔍 checked: ${checked} sending: ${sending}`);

    if (checked || sending) {
      console.log("⚠️ Já verificado ou enviando, abortando");
      return;
    }

    console.log("✅ setSending(true)");
    setSending(true);

    try {
      console.log("📡 Chamando User.me()...");
      const user = await base44.auth.me();
      console.log("✅ User.me() retornou:", user);

      if (!user) {
        console.log("❌ Nenhum usuário encontrado");
        return;
      }

      console.log("👤 Email do usuário:", user.email);

      // ✅ ATIVAR TRIAL SE FOR NOVO USUÁRIO
      if (!user.trial_started_at && !user.subscription_plan) {
        console.log("🆕 NOVO USUÁRIO DETECTADO! Ativando trial de 3 dias...");
        
        const now = new Date();
        const trialStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const trialEnd = new Date(trialStart);
        trialEnd.setDate(trialEnd.getDate() + 3); // 3 dias
        
        const trialStartStr = `${trialStart.getFullYear()}-${String(trialStart.getMonth() + 1).padStart(2, '0')}-${String(trialStart.getDate()).padStart(2, '0')}`;
        const trialEndStr = `${trialEnd.getFullYear()}-${String(trialEnd.getMonth() + 1).padStart(2, '0')}-${String(trialEnd.getDate()).padStart(2, '0')}`;
        
        console.log(`📅 Trial: ${trialStartStr} até ${trialEndStr}`);
        
        await base44.auth.updateMe({
          trial_started_at: trialStartStr,
          trial_ends_at: trialEndStr,
          subscription_status: 'trial'
        });
        
        console.log("✅ TRIAL ATIVADO! Usuário tem 3 dias de acesso total!");
      } else if (user.trial_started_at) {
        console.log(`✅ Usuário já tem trial ativo até: ${user.trial_ends_at}`);
      } else if (user.subscription_plan) {
        console.log(`✅ Usuário já tem plano ativo: ${user.subscription_plan}`);
      }

      // ✅ ENVIAR EMAIL DE BOAS-VINDAS
      console.log(`📧 welcome_email_sent: ${user.welcome_email_sent}`);
      console.log(`📧 Tipo de welcome_email_sent: ${typeof user.welcome_email_sent}`);

      if (user.welcome_email_sent === true) {
        console.log("✅ Email de boas-vindas JÁ FOI ENVIADO anteriormente");
        return;
      }

      console.log("📧 Email de boas-vindas NÃO foi enviado ainda");
      console.log("📤 Enviando email de boas-vindas...");

      await base44.integrations.Core.SendEmail({
        from_name: "FINEX - Equipe",
        to: user.email,
        subject: "🎉 Bem-vindo ao FINEX! Seus 3 dias grátis começaram!",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h1 style="color: #667eea; text-align: center; margin-bottom: 20px;">
                🎉 Bem-vindo ao FINEX!
              </h1>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Olá, <strong>${user.full_name || user.email}</strong>! 👋
              </p>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h2 style="color: white; margin: 0 0 10px 0;">✨ TRIAL GRÁTIS ATIVADO!</h2>
                <p style="color: white; font-size: 18px; margin: 0;">
                  Você tem <strong>3 DIAS</strong> para testar TODAS as funcionalidades!
                </p>
              </div>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Durante o período de teste, você terá acesso completo a:
              </p>
              
              <ul style="color: #333; font-size: 15px; line-height: 1.8;">
                <li>✅ Gerenciamento de Transações</li>
                <li>✅ Contas a Pagar e Receber</li>
                <li>✅ Múltiplas Carteiras</li>
                <li>✅ Metas Financeiras</li>
                <li>✅ Relatórios e Gráficos</li>
                <li>✅ Consultor IA</li>
                <li>✅ E muito mais!</li>
              </ul>
              
              <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  ⏰ <strong>Atenção:</strong> Após os 3 dias, você precisará escolher um plano para continuar usando o FINEX.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                  🚀 Começar a Usar Agora
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
                Precisa de ajuda? Entre em contato conosco!<br>
                <strong>FINEX - Sistema de Inteligência Financeira</strong>
              </p>
            </div>
          </div>
        `
      });

      console.log("✅ Email de boas-vindas enviado com sucesso!");

      console.log("💾 Marcando welcome_email_sent como true...");
      await base44.auth.updateMe({
        welcome_email_sent: true
      });

      console.log("✅ Campo welcome_email_sent atualizado com sucesso!");

    } catch (error) {
      console.error("❌ Erro ao ativar trial ou enviar email:", error);
      console.error("Stack:", error.stack);
    } finally {
      console.log("🏁 setSending(false) - Processo finalizado");
      setSending(false);
      setChecked(true);
    }
  };

  return null;
}