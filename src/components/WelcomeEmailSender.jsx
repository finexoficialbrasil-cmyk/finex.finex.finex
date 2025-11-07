import React, { useEffect, useState } from "react";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";

export default function WelcomeEmailSender() {
  const [checked, setChecked] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    console.log("🎯 WelcomeEmailSender montado! Iniciando verificação...");
    
    // Aguardar 3 segundos antes de verificar
    const timer = setTimeout(() => {
      console.log("⏰ Timer acionado, verificando email de boas-vindas...");
      checkAndSendWelcomeEmail();
    }, 3000);

    return () => {
      console.log("🧹 WelcomeEmailSender desmontado");
      clearTimeout(timer);
    };
  }, []);

  const checkAndSendWelcomeEmail = async () => {
    console.log("🔍 checkAndSendWelcomeEmail() iniciada");
    console.log("🔍 checked:", checked, "sending:", sending);
    
    if (checked || sending) {
      console.log("⏭️ Pulando verificação (já checado ou enviando)");
      return;
    }
    
    setSending(true);
    console.log("✅ setSending(true)");
    
    try {
      console.log("📡 Chamando User.me()...");
      const user = await User.me();
      console.log("✅ User.me() retornou:", user);
      
      console.log("👤 Email do usuário:", user.email);
      console.log("📧 welcome_email_sent:", user.welcome_email_sent);
      console.log("📧 Tipo de welcome_email_sent:", typeof user.welcome_email_sent);
      
      // Verificar se já enviou email de boas-vindas
      if (user.welcome_email_sent === true) {
        console.log("✅ Email de boas-vindas JÁ FOI ENVIADO anteriormente");
        setChecked(true);
        setSending(false);
        return;
      }

      console.log("📤 ENVIANDO EMAIL DE BOAS-VINDAS para:", user.email);
      console.log("📤 Nome do usuário:", user.full_name);

      try {
        const emailResult = await base44.integrations.Core.SendEmail({
          from_name: "FINEX - Inteligência Financeira",
          to: user.email,
          subject: "🎉 Bem-vindo ao FINEX - Sua Jornada Financeira Começa Aqui!",
          body: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo ao FINEX!</h1>
                <p style="color: white; margin: 10px 0 0 0;">Sua Inteligência Financeira Pessoal</p>
              </div>

              <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Olá <strong>${user.full_name || 'amigo(a)'}</strong>! 👋</p>
                
                <p>É com grande satisfação que damos as boas-vindas ao <strong>FINEX</strong> - a plataforma mais completa para gerenciar suas finanças pessoais!</p>

                <h3 style="color: #667eea; margin-top: 30px;">✨ O que você pode fazer no FINEX:</h3>
                
                <ul style="line-height: 2;">
                  <li>💰 <strong>Controle Total</strong> - Gerencie receitas, despesas e saldos</li>
                  <li>🤖 <strong>Consultor IA</strong> - Assistente inteligente para suas finanças</li>
                  <li>📊 <strong>Relatórios</strong> - Visualize seus gastos e tendências</li>
                  <li>🎯 <strong>Metas</strong> - Defina objetivos e acompanhe progresso</li>
                  <li>🎙️ <strong>Comandos de Voz</strong> - Registre transações rapidamente</li>
                </ul>

                <h3 style="color: #667eea; margin-top: 30px;">🚀 Primeiros Passos:</h3>
                
                <ol style="line-height: 2;">
                  <li>Complete seu perfil</li>
                  <li>Crie suas contas bancárias</li>
                  <li>Configure suas categorias</li>
                  <li>Registre suas primeiras transações</li>
                  <li>Explore o Consultor IA</li>
                </ol>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${window.location.origin}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                    Começar Agora 🚀
                  </a>
                </div>

                <p style="text-align: center; color: #666; margin-top: 30px;">
                  Precisa de ajuda? Entre em contato pelo WhatsApp!<br>
                  <a href="https://wa.me/5565981297511?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20FINEX." style="color: #667eea;">💬 Suporte WhatsApp</a>
                </p>
              </div>

              <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                <p>© ${new Date().getFullYear()} FINEX - Inteligência Financeira<br>
                Todos os direitos reservados</p>
              </div>
            </body>
            </html>
          `
        });

        console.log("✅ EMAIL ENVIADO COM SUCESSO!");
        console.log("📧 Resultado do envio:", emailResult);

        // Marcar que o email foi enviado
        console.log("💾 Atualizando campo welcome_email_sent...");
        await User.update(user.id, {
          welcome_email_sent: true
        });
        console.log("✅ Campo welcome_email_sent ATUALIZADO!");
        
        setChecked(true);
        console.log("✅ Processo completo!");
        
      } catch (emailError) {
        console.error("❌ ERRO AO ENVIAR EMAIL:", emailError);
        console.error("❌ Detalhes do erro:", emailError.message);
        console.error("❌ Stack:", emailError.stack);
      }
      
    } catch (error) {
      console.error("❌ ERRO GERAL ao verificar/enviar email:", error);
      console.error("❌ Detalhes do erro:", error.message);
      console.error("❌ Stack:", error.stack);
    } finally {
      setSending(false);
      console.log("🏁 setSending(false) - Processo finalizado");
    }
  };

  // Componente invisível
  console.log("🔵 WelcomeEmailSender renderizando (invisível)");
  return null;
}