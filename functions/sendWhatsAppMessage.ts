import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Envia mensagem via WhatsApp usando Evolution API
 * 
 * Evolution API: https://github.com/EvolutionAPI/evolution-api
 * 
 * SETUP:
 * 1. Deploy Evolution API (Railway/Render)
 * 2. Configurar secrets:
 *    - EVOLUTION_API_URL
 *    - EVOLUTION_API_KEY
 *    - EVOLUTION_INSTANCE_NAME
 * 3. Conectar WhatsApp via QR Code no painel
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verificar autenticação
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Pegar parâmetros
    const { to, message } = await req.json();

    if (!to || !message) {
      return Response.json({ 
        success: false, 
        error: 'Parâmetros obrigatórios: to, message' 
      }, { status: 400 });
    }

    // Pegar configurações da Evolution API
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');

    if (!apiUrl || !apiKey || !instanceName) {
      return Response.json({ 
        success: false, 
        error: 'Evolution API não configurada. Configure os secrets primeiro.' 
      }, { status: 500 });
    }

    // Formatar número (remover caracteres especiais e adicionar DDI)
    let formattedPhone = to.replace(/\D/g, '');
    
    // Se não tem DDI (código do país), adicionar 55 (Brasil)
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    // Adicionar @s.whatsapp.net
    const whatsappId = formattedPhone + '@s.whatsapp.net';

    console.log(`📱 Enviando WhatsApp para: ${whatsappId}`);

    // Enviar mensagem via Evolution API
    const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: whatsappId,
        text: message,
        delay: 1000 // Delay de 1 segundo para parecer mais humano
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Erro Evolution API:', responseData);
      return Response.json({ 
        success: false, 
        error: responseData.message || 'Erro ao enviar WhatsApp',
        details: responseData
      }, { status: response.status });
    }

    console.log('✅ WhatsApp enviado com sucesso:', responseData);

    return Response.json({
      success: true,
      messageId: responseData.key?.id,
      timestamp: responseData.messageTimestamp,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});