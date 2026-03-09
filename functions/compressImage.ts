import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log("🖼️ Iniciando compressão de imagem...");

        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return Response.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 });
        }

        // Ler arquivo
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        console.log(`📊 Tamanho original: ${(uint8Array.length / 1024).toFixed(2)} KB`);

        // Detectar tipo de imagem
        const mimeType = file.type;
        let isImage = mimeType.startsWith('image/');
        
        if (!isImage) {
            console.log("⚠️ Não é imagem, retornando arquivo original");
            // Se não for imagem, fazer upload direto sem comprimir
            const uploadResult = await base44.integrations.Core.UploadFile({ file: file });
            return Response.json({
                success: true,
                file_url: uploadResult.file_url,
                original_size: uint8Array.length,
                compressed_size: uint8Array.length,
                compression_ratio: 0,
                message: "Arquivo não é imagem, upload sem compressão"
            });
        }

        // Verificar se é muito pequeno (< 100KB)
        if (uint8Array.length < 100 * 1024) {
            console.log("✅ Imagem já é pequena (< 100KB), upload sem compressão");
            const uploadResult = await base44.integrations.Core.UploadFile({ file: file });
            return Response.json({
                success: true,
                file_url: uploadResult.file_url,
                original_size: uint8Array.length,
                compressed_size: uint8Array.length,
                compression_ratio: 0,
                message: "Imagem já otimizada"
            });
        }

        // Carregar imagem no canvas (usando Deno canvas ou ImageMagick)
        // Como não temos biblioteca de imagem no Deno, vamos usar uma abordagem diferente:
        // Criar um blob menor usando qualidade reduzida
        
        let quality = 0.7; // 70% de qualidade
        let maxWidth = 1920;
        let maxHeight = 1920;

        // Para imagens muito grandes, usar qualidade ainda menor
        if (uint8Array.length > 5 * 1024 * 1024) { // > 5MB
            quality = 0.5;
            maxWidth = 1280;
            maxHeight = 1280;
            console.log("🔽 Imagem muito grande, reduzindo mais agressivamente");
        }

        // Como não temos processamento de imagem nativo, vamos simular
        // uma compressão básica reduzindo o tamanho do buffer
        // Em produção real, usaríamos uma biblioteca como sharp ou ImageMagick
        
        console.log("⚠️ Compressão de imagem requer biblioteca externa");
        console.log("💡 Fazendo upload da imagem original por enquanto");
        
        // Upload do arquivo original
        const uploadResult = await base44.integrations.Core.UploadFile({ file: file });

        console.log(`✅ Upload concluído: ${uploadResult.file_url}`);

        return Response.json({
            success: true,
            file_url: uploadResult.file_url,
            original_size: uint8Array.length,
            compressed_size: uint8Array.length,
            compression_ratio: 0,
            message: "Upload realizado (compressão requer biblioteca adicional)"
        });

    } catch (error) {
        console.error('❌ Erro ao comprimir imagem:', error);
        return Response.json({ 
            error: 'Erro ao processar imagem',
            details: error.message 
        }, { status: 500 });
    }
});