import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ✅ TEMPLATES DE EMAIL PROFISSIONAIS
const EMAIL_TEMPLATES = {
  // 🟢 ANTES DO VENCIMENTO
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
          
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
            <strong>🎯 Por que renovar agora?</strong>
          </p>
          
          <ul style="color: #555; font-size: 15px; line-height: 1.8; margin-bottom: 25px;">
            <li>✅ Mantenha acesso ilimitado a todas as funcionalidades</li>
            <li>✅ Continue organizando suas finanças sem interrupções</li>
            <li>✅ Preserve todos os seus dados e relatórios</li>
            <li>✅ Suporte prioritário sempre disponível</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold; box-shadow: 0 5px 15px rgba(139, 92, 246, 0.4);">
              ⚡ RENOVAR AGORA
            </a>
          </div>
          
          <p style="color: #666; font-size: 13px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            💜 FINEX - Inteligência Financeira<br>
            Estamos aqui para ajudar! Dúvidas? Entre em contato conosco.
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
            <p style="margin: 10px 0 0 0; color: #991b1b; font-size: 14px;">
              📅 Vencimento: {{EXPIRY_DATE}}
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>⚠️ O que acontece se não renovar:</strong>
          </p>
          
          <ul style="color: #ef4444; font-size: 15px; line-height: 1.8; margin-bottom: 25px;">
            <li>❌ Perda de acesso a todas as funcionalidades premium</li>
            <li>❌ Impossibilidade de criar novas transações</li>
            <li>❌ Bloqueio de relatórios e análises</li>
            <li>❌ Perda do histórico de controle financeiro</li>
          </ul>
          
          <div style="background: #dcfce7; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #065f46; font-size: 15px;">
              <strong>✨ Renovando HOJE você garante:</strong><br>
              • Continuidade sem interrupções<br>
              • Todos os seus dados preservados<br>
              • Suporte prioritário mantido
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold; box-shadow: 0 5px 20px rgba(239, 68, 68, 0.5);">
              🚀 RENOVAR URGENTE
            </a>
          </div>
          
          <p style="color: #666; font-size: 13px; text-align: center; margin-top: 30px;">
            Não perca o controle das suas finanças! Renove agora mesmo.
          </p>
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
            <p style="margin: 10px 0 0 0; color: #991b1b; font-size: 16px;">
              Plano: <strong>{{PLAN_NAME}}</strong><br>
              Vence: <strong>{{EXPIRY_DATE}}</strong>
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px; text-align: center;">
            <strong style="color: #dc2626; font-size: 18px;">Esta é sua ÚLTIMA CHANCE de renovar sem perder acesso!</strong>
          </p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #92400e; font-size: 15px;">
              <strong>💎 Renove AGORA e garanta:</strong><br>
              ✅ Acesso imediato sem interrupções<br>
              ✅ Todos os recursos premium mantidos<br>
              ✅ Seus dados 100% preservados<br>
              ✅ Suporte prioritário continuado
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 20px 60px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: bold; box-shadow: 0 8px 25px rgba(220, 38, 38, 0.6); text-transform: uppercase;">
              ⚡ RENOVAR AGORA!
            </a>
          </div>
          
          <p style="color: #dc2626; font-size: 14px; text-align: center; margin-top: 30px; font-weight: bold;">
            ⚠️ Não deixe para amanhã! Seu acesso será bloqueado automaticamente após o vencimento.
          </p>
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
          
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Seu plano <strong>{{PLAN_NAME}}</strong> está expirando HOJE. Renove agora para manter todos os seus benefícios!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 20px 60px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: bold; box-shadow: 0 8px 25px rgba(220, 38, 38, 0.6);">
              ⚡ RENOVAR IMEDIATAMENTE
            </a>
          </div>
          
          <p style="color: #dc2626; font-size: 13px; text-align: center; margin-top: 30px; font-weight: bold;">
            Não perca o controle das suas finanças! Renove agora!
          </p>
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
              <strong>⏱️ Há:</strong> 1 dia<br>
              <strong>🔒 Status:</strong> BLOQUEADO
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>💡 Boa notícia:</strong> Você ainda pode reativar sua conta e recuperar todo o seu histórico!
          </p>
          
          <ul style="color: #555; font-size: 15px; line-height: 1.8; margin-bottom: 25px;">
            <li>✅ Todos os seus dados estão seguros</li>
            <li>✅ Seu histórico será restaurado imediatamente</li>
            <li>✅ Reativação instantânea após renovação</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold; box-shadow: 0 5px 20px rgba(16, 185, 129, 0.5);">
              🔓 REATIVAR MINHA CONTA
            </a>
          </div>
          
          <p style="color: #666; font-size: 13px; text-align: center; margin-top: 30px;">
            💜 Estamos aguardando seu retorno! Não perca seus dados.
          </p>
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
              • Suas transações e relatórios estão intactos<br>
              • Basta renovar para ter acesso imediato
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>🎁 Oferta especial:</strong> Renove agora e volte a ter controle total das suas finanças!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold; box-shadow: 0 5px 20px rgba(139, 92, 246, 0.5);">
              💜 VOLTAR PARA O FINEX
            </a>
          </div>
          
          <p style="color: #666; font-size: 13px; text-align: center; margin-top: 30px;">
            Estamos esperando você de braços abertos! 🤗
          </p>
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
          
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>💡 Por que voltar agora?</strong>
          </p>
          
          <ul style="color: #555; font-size: 15px; line-height: 1.8; margin-bottom: 25px;">
            <li>📊 Retome o controle das suas finanças</li>
            <li>💰 Não perca seu histórico valioso</li>
            <li>✨ Volte a usar todos os recursos premium</li>
            <li>🎯 Continue organizando seu futuro financeiro</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold; box-shadow: 0 5px 20px rgba(245, 158, 11, 0.5);">
              🔄 REATIVAR AGORA
            </a>
          </div>
          
          <p style="color: #666; font-size: 13px; text-align: center; margin-top: 30px;">
            Não deixe seus dados se perderem! Renove hoje mesmo.
          </p>
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
          
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>⏳ Esta é sua ÚLTIMA CHANCE de recuperar:</strong>
          </p>
          
          <ul style="color: #dc2626; font-size: 15px; line-height: 1.8; margin-bottom: 25px; font-weight: bold;">
            <li>📊 Todo o seu histórico de transações</li>
            <li>💰 Seus relatórios financeiros completos</li>
            <li>📈 Análises e gráficos personalizados</li>
            <li>🎯 Metas e objetivos financeiros</li>
          </ul>
          
          <div style="background: #dcfce7; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #065f46; font-size: 15px;">
              <strong>✅ Renove AGORA e:</strong><br>
              • Recupere TUDO instantaneamente<br>
              • Mantenha seu histórico para sempre<br>
              • Continue de onde parou
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 22px 60px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: bold; box-shadow: 0 8px 25px rgba(220, 38, 38, 0.6); text-transform: uppercase;">
              🆘 SALVAR MEUS DADOS
            </a>
          </div>
          
          <p style="color: #dc2626; font-size: 14px; text-align: center; margin-top: 30px; font-weight: bold; line-height: 1.6;">
            ⚠️ ÚLTIMA OPORTUNIDADE!<br>
            Não perca anos de controle financeiro.<br>
            Renove AGORA antes que seja tarde demais!
          </p>
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
              <br><br>
              <strong>Seus dados ainda estão conosco, esperando você voltar.</strong>
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <strong>🌟 Lembre-se por que você começou:</strong>
          </p>
          
          <ul style="color: #555; font-size: 15px; line-height: 1.8; margin-bottom: 25px;">
            <li>💰 Ter controle total das suas finanças</li>
            <li>📊 Visualizar para onde vai seu dinheiro</li>
            <li>🎯 Alcançar suas metas financeiras</li>
            <li>✨ Construir um futuro mais próspero</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold; box-shadow: 0 5px 20px rgba(124, 58, 237, 0.5);">
              💜 QUERO VOLTAR!
            </a>
          </div>
          
          <p style="color: #666; font-size: 13px; text-align: center; margin-top: 30px; line-height: 1.6;">
            Estamos aqui, torcendo pelo seu sucesso financeiro! 🚀<br>
            Volte quando estiver pronto. Sempre haverá um lugar para você no FINEX.
          </p>
        </div>
      </div>
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
            .replace(/{{RENEWAL_LINK}}/g, 'https://finex.base44.app/pages/Plans')
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