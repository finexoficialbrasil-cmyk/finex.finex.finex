import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ✅ TEMPLATES COMPLETOS - DESIGN MODERNO E PROFISSIONAL
const EMAIL_TEMPLATES = {
  '3_days_before': {
    subject: '⏰ Seu plano FINEX vence em 3 dias - Renove agora!',
    body: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
              <tr><td style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 40px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 20px; border-radius: 50%; margin-bottom: 20px;">
                  <span style="font-size: 60px;">⏰</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900;">Seu plano vence em 3 dias!</h1>
                <p style="color: rgba(255,255,255,0.95); margin: 15px 0 0 0; font-size: 18px;">Não perca o acesso ao FINEX 💜</p>
              </td></tr>
              <tr><td style="padding: 40px;">
                <p style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0;">Olá, <strong style="color: #8b5cf6;">{{USER_NAME}}</strong>! 👋</p>
                <p style="color: #4b5563; font-size: 16px; margin: 0 0 30px 0;">Seu plano <strong style="color: #8b5cf6;">{{PLAN_NAME}}</strong> está chegando ao fim. É super rápido renovar!</p>
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 5px solid #f59e0b; padding: 25px; border-radius: 15px; margin: 30px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 14px; text-transform: uppercase;">📅 Data de Vencimento</p>
                  <p style="margin: 5px 0 15px 0; color: #92400e; font-size: 20px; font-weight: 900;">{{EXPIRY_DATE}}</p>
                  <p style="margin: 0; color: #92400e; font-size: 15px; font-weight: 600;">⏳ Restam apenas <strong>3 DIAS</strong>!</p>
                </div>
                <div style="text-align: center; margin: 50px 0 30px 0;">
                  <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 20px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: 900; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);">⚡ RENOVAR AGORA</a>
                </div>
              </td></tr>
              <tr><td style="background: #f9fafb; padding: 30px; text-align: center;">
                <p style="margin: 0; color: #8b5cf6; font-size: 14px; font-weight: 600;">💜 FINEX - Inteligência Financeira</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  },

  '2_days_before': {
    subject: '⚠️ URGENTE: Seu plano FINEX vence em 2 dias!',
    body: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
              <tr><td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 20px; border-radius: 50%; margin-bottom: 20px;">
                  <span style="font-size: 60px;">⚠️</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 900;">ATENÇÃO!</h1>
                <p style="color: white; margin: 15px 0 0 0; font-size: 22px;">Faltam apenas <span style="background: white; color: #ef4444; padding: 5px 15px; border-radius: 20px; font-weight: 900;">2 DIAS</span></p>
              </td></tr>
              <tr><td style="padding: 40px;">
                <p style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0;"><strong style="color: #ef4444;">{{USER_NAME}}</strong>, seu acesso está prestes a expirar! ⏳</p>
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 3px solid #ef4444; border-radius: 15px; padding: 25px; margin: 30px 0; text-align: center;">
                  <p style="margin: 0 0 10px 0; color: #991b1b; font-size: 18px; font-weight: 900;">🚨 SEU PLANO {{PLAN_NAME}}</p>
                  <p style="margin: 0; color: #991b1b; font-size: 20px; font-weight: 700;">Vence em <span style="font-size: 28px; color: #dc2626;">48 HORAS!</span></p>
                </div>
                <div style="text-align: center; margin: 50px 0 30px 0;">
                  <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 22px 55px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: 900; box-shadow: 0 10px 40px rgba(239, 68, 68, 0.5);">🚀 RENOVAR URGENTE</a>
                </div>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  },

  '1_day_before': {
    subject: '🔴 ÚLTIMO DIA! Seu plano vence AMANHÃ - Ação Urgente!',
    body: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 70px rgba(0,0,0,0.4);">
              <tr><td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 50px 40px; text-align: center;">
                <div style="background: rgba(255,255,255,0.3); display: inline-block; padding: 25px; border-radius: 50%; margin-bottom: 25px;">
                  <span style="font-size: 70px;">🔴</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 42px; font-weight: 900; letter-spacing: 2px;">ÚLTIMO DIA!</h1>
                <div style="background: white; display: inline-block; margin-top: 20px; padding: 15px 30px; border-radius: 30px;">
                  <p style="margin: 0; color: #dc2626; font-size: 24px; font-weight: 900;">⏰ MENOS DE 24 HORAS</p>
                </div>
              </td></tr>
              <tr><td style="padding: 40px;">
                <p style="color: #1f2937; font-size: 20px; margin: 0 0 30px 0; text-align: center; font-weight: 700;"><span style="color: #dc2626;">{{USER_NAME}}</span>, seu acesso vence AMANHÃ! 🚨</p>
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 4px solid #dc2626; border-radius: 20px; padding: 35px; margin: 30px 0; text-align: center;">
                  <p style="margin: 0 0 15px 0; color: #991b1b; font-size: 28px; font-weight: 900;">ATENÇÃO MÁXIMA!</p>
                  <p style="margin: 0; color: #7f1d1d; font-size: 18px; font-weight: 700;">Plano: <span style="color: #dc2626;">{{PLAN_NAME}}</span></p>
                </div>
                <div style="text-align: center; margin: 50px 0 30px 0;">
                  <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 25px 65px; text-decoration: none; border-radius: 50px; font-size: 26px; font-weight: 900; box-shadow: 0 20px 60px rgba(220, 38, 38, 0.7); border: 4px solid white;">⚡ RENOVAR URGENTE</a>
                </div>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  },

  'expired_today': {
    subject: '🚨 EMERGÊNCIA: Seu plano FINEX vence HOJE!',
    body: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1f2937;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #1f2937; padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,0.5); border: 5px solid #dc2626;">
              <tr><td style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 50px 40px; text-align: center;">
                <div style="background: #dc2626; display: inline-block; padding: 25px; border-radius: 50%; margin-bottom: 25px; box-shadow: 0 0 30px #dc2626;">
                  <span style="font-size: 70px;">🚨</span>
                </div>
                <h1 style="color: #dc2626; margin: 0; font-size: 44px; font-weight: 900; letter-spacing: 3px;">EMERGÊNCIA!</h1>
                <p style="color: white; margin: 20px 0 0 0; font-size: 22px; font-weight: 700;">Seu plano vence <span style="background: #dc2626; padding: 8px 20px; border-radius: 25px;">HOJE</span></p>
              </td></tr>
              <tr><td style="padding: 40px;">
                <p style="color: #1f2937; font-size: 20px; margin: 0 0 30px 0; text-align: center; font-weight: 700;"><strong style="color: #dc2626;">{{USER_NAME}}</strong>, seu acesso será bloqueado em breve! ⏰</p>
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 5px solid #dc2626; border-radius: 20px; padding: 40px; margin: 30px 0; text-align: center;">
                  <p style="margin: 0 0 15px 0; color: #991b1b; font-size: 32px; font-weight: 900;">SEU PLANO VENCE HOJE!</p>
                  <p style="margin: 0; color: #7f1d1d; font-size: 18px; font-weight: 700;">Renove AGORA!</p>
                </div>
                <div style="text-align: center; margin: 50px 0 30px 0;">
                  <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 25px 65px; text-decoration: none; border-radius: 50px; font-size: 26px; font-weight: 900; box-shadow: 0 20px 60px rgba(220, 38, 38, 0.7); border: 4px solid white;">⚡ RENOVAR IMEDIATAMENTE</a>
                </div>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  },

  '1_day_after': {
    subject: '❌ BLOQUEADO: Seu acesso ao FINEX foi suspenso - Reative agora!',
    body: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1f2937;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #1f2937; padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 70px rgba(0,0,0,0.4);">
              <tr><td style="background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%); padding: 50px 40px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 25px; border-radius: 50%; margin-bottom: 25px;">
                  <span style="font-size: 70px;">❌</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 40px; font-weight: 900;">ACESSO BLOQUEADO</h1>
                <p style="color: rgba(255,255,255,0.95); margin: 15px 0 0 0; font-size: 18px;">Mas ainda há tempo! 💜</p>
              </td></tr>
              <tr><td style="padding: 40px;">
                <p style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0;"><strong style="color: #991b1b;">{{USER_NAME}}</strong>, seu plano expirou ontem. 😔</p>
                <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 15px; padding: 30px; margin: 30px 0; text-align: center; border: 3px solid #10b981;">
                  <p style="margin: 0 0 15px 0; font-size: 36px;">✨</p>
                  <p style="margin: 0 0 15px 0; color: #065f46; font-size: 22px; font-weight: 900;">BOA NOTÍCIA!</p>
                  <p style="margin: 0; color: #047857; font-size: 16px; font-weight: 600;">Você ainda pode reativar e recuperar todo o seu histórico!</p>
                </div>
                <div style="text-align: center; margin: 50px 0 30px 0;">
                  <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 22px 55px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: 900; box-shadow: 0 10px 40px rgba(16, 185, 129, 0.5);">🔓 REATIVAR CONTA</a>
                </div>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  },

  '5_days_after': {
    subject: '💜 Sentimos sua falta! Seus dados estão seguros - Volte para o FINEX',
    body: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
              <tr><td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 50px 40px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 25px; border-radius: 50%; margin-bottom: 25px;">
                  <span style="font-size: 70px;">💜</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 38px; font-weight: 900;">Sentimos Sua Falta!</h1>
                <p style="color: rgba(255,255,255,0.95); margin: 15px 0 0 0; font-size: 18px;">Já faz 5 dias... Volte! 😊</p>
              </td></tr>
              <tr><td style="padding: 40px;">
                <p style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0;">Olá, <strong style="color: #8b5cf6;">{{USER_NAME}}</strong>!</p>
                <p style="color: #4b5563; font-size: 16px; margin: 0 0 30px 0;">Estamos com <strong>saudades</strong> de ter você usando o FINEX! 😊</p>
                <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 15px; padding: 30px; margin: 30px 0; border-left: 5px solid #8b5cf6;">
                  <p style="margin: 0 0 15px 0; color: #5b21b6; font-size: 22px; font-weight: 900;">✨ Seus dados estão 100% seguros!</p>
                  <p style="margin: 0; color: #6b21a8; font-size: 15px;">• Histórico preservado<br>• Relatórios intactos<br>• Acesso imediato ao renovar</p>
                </div>
                <div style="text-align: center; margin: 50px 0 30px 0;">
                  <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 22px 55px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: 900; box-shadow: 0 10px 40px rgba(139, 92, 246, 0.5);">💜 VOLTAR PARA O FINEX</a>
                </div>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  },

  '15_days_after': {
    subject: '🎯 Última chance! Recupere seu histórico financeiro agora',
    body: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #374151;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #374151; padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.4);">
              <tr><td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 50px 40px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 25px; border-radius: 50%; margin-bottom: 25px;">
                  <span style="font-size: 70px;">⚠️</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 38px; font-weight: 900;">15 Dias Sem Você</h1>
                <p style="color: rgba(255,255,255,0.95); margin: 15px 0 0 0; font-size: 18px;">Seus dados ainda estão seguros! 💾</p>
              </td></tr>
              <tr><td style="padding: 40px;">
                <p style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0;"><strong style="color: #f59e0b;">{{USER_NAME}}</strong>, seu plano expirou há 15 dias.</p>
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 20px; padding: 35px; margin: 30px 0; text-align: center;">
                  <p style="margin: 0 0 15px 0; font-size: 32px;">🔔</p>
                  <p style="margin: 0 0 10px 0; color: #92400e; font-size: 22px; font-weight: 900;">AVISO IMPORTANTE</p>
                  <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: 600;">Seus dados estão preservados,<br>mas não por muito tempo...</p>
                </div>
                <div style="text-align: center; margin: 50px 0 30px 0;">
                  <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 22px 55px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: 900; box-shadow: 0 10px 40px rgba(245, 158, 11, 0.5);">🔄 REATIVAR AGORA</a>
                </div>
              </td></tr>
            </table>
          </td></tr>
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
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1f2937;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #1f2937; padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,0.5);">
              <tr><td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 50px 40px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 25px; border-radius: 50%; margin-bottom: 25px;">
                  <span style="font-size: 70px;">🚨</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 40px; font-weight: 900;">ALERTA CRÍTICO</h1>
                <p style="color: white; margin: 15px 0 0 0; font-size: 20px; font-weight: 700;">30 dias desde o vencimento</p>
              </td></tr>
              <tr><td style="padding: 40px;">
                <p style="color: #1f2937; font-size: 18px; margin: 0 0 30px 0;"><strong style="color: #dc2626;">{{USER_NAME}}</strong>, são 30 dias desde o vencimento.</p>
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 4px solid #dc2626; border-radius: 20px; padding: 40px; margin: 30px 0; text-align: center;">
                  <p style="margin: 0 0 20px 0; font-size: 36px;">⚠️</p>
                  <p style="margin: 0 0 15px 0; color: #991b1b; font-size: 26px; font-weight: 900;">RISCO DE PERDA PERMANENTE</p>
                  <p style="margin: 0; color: #7f1d1d; font-size: 16px; font-weight: 600;">Seus dados podem ser removidos!</p>
                </div>
                <div style="text-align: center; margin: 50px 0 30px 0;">
                  <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 25px 60px; text-decoration: none; border-radius: 50px; font-size: 24px; font-weight: 900; box-shadow: 0 15px 50px rgba(220, 38, 38, 0.6); border: 3px solid white;">🆘 SALVAR DADOS</a>
                </div>
              </td></tr>
            </table>
          </td></tr>
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
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.4);">
              <tr><td style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); padding: 50px 40px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 25px; border-radius: 50%; margin-bottom: 25px;">
                  <span style="font-size: 70px;">💔</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 38px; font-weight: 900;">Sentimos Muito Sua Falta</h1>
                <p style="color: rgba(255,255,255,0.95); margin: 15px 0 0 0; font-size: 18px;">Volte quando estiver pronto 💜</p>
              </td></tr>
              <tr><td style="padding: 40px;">
                <p style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0;"><strong style="color: #7c3aed;">{{USER_NAME}}</strong>, já faz {{DAYS_EXPIRED}} dias...</p>
                <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-radius: 15px; padding: 30px; margin: 30px 0; border-left: 5px solid #7c3aed;">
                  <p style="margin: 0 0 15px 0; color: #6b21a8; font-size: 16px;">Sabemos que a vida anda corrida, mas não deixe seu futuro financeiro de lado! 💜</p>
                  <p style="margin: 0; color: #6b21a8; font-size: 16px; font-weight: 700;">Seus dados estão esperando você.</p>
                </div>
                <div style="text-align: center; margin: 50px 0 30px 0;">
                  <a href="{{RENEWAL_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: white; padding: 22px 55px; text-decoration: none; border-radius: 50px; font-size: 22px; font-weight: 900; box-shadow: 0 10px 40px rgba(124, 58, 237, 0.5);">💜 QUERO VOLTAR!</a>
                </div>
              </td></tr>
              <tr><td style="background: #f9fafb; padding: 30px; text-align: center;">
                <p style="margin: 0; color: #7c3aed; font-size: 14px; font-weight: 600;">Sempre haverá um lugar para você no FINEX 🚀</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  }
};

Deno.serve(async (req) => {
  try {
    console.log("════════════════════════════════════════");
    console.log("📧 ENVIO MANUAL DE EMAIL DE COBRANÇA");
    console.log("════════════════════════════════════════");
    
    const base44 = createClientFromRequest(req);
    
    const admin = await base44.auth.me();
    if (!admin || admin.role !== 'admin') {
      console.log("❌ Acesso negado - não é admin");
      return Response.json({ 
        success: false,
        error: 'Acesso negado. Apenas admin.' 
      }, { status: 403 });
    }
    
    console.log(`✅ Admin autenticado: ${admin.email}`);
    
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
    
    let diffDays = 0;
    if (user.subscription_end_date) {
      const [year, month, day] = user.subscription_end_date.split('-').map(Number);
      const expiryDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      console.log(`📅 Diferença de dias: ${diffDays}`);
    }
    
    console.log(`📝 Preparando email...`);
    let emailBody = template.body
      .replace(/{{USER_NAME}}/g, user.full_name || user.email.split('@')[0])
      .replace(/{{PLAN_NAME}}/g, formatPlanName(user.subscription_plan))
      .replace(/{{EXPIRY_DATE}}/g, formatDate(user.subscription_end_date))
      .replace(/{{RENEWAL_LINK}}/g, 'https://finex.base44.app')
      .replace(/{{DAYS_EXPIRED}}/g, Math.abs(diffDays));
    
    console.log(`📤 Enviando email...`);
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: template.subject,
      body: emailBody
    });
    
    console.log(`✅ Email enviado com sucesso!`);
    
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