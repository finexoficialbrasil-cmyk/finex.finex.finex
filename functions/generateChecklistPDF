import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        let y = 20;
        const lineHeight = 7;
        const pageHeight = 280;
        const margin = 20;

        const addText = (text, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
            if (y > pageHeight) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFontSize(fontSize);
            doc.setTextColor(color[0], color[1], color[2]);
            doc.setFont(undefined, isBold ? 'bold' : 'normal');
            
            const lines = doc.splitTextToSize(text, 170);
            lines.forEach(line => {
                if (y > pageHeight) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, margin, y);
                y += lineHeight;
            });
        };

        const addCheckbox = (text) => {
            if (y > pageHeight) {
                doc.addPage();
                y = 20;
            }
            
            doc.setDrawColor(100, 100, 100);
            doc.rect(margin, y - 4, 4, 4);
            doc.setFontSize(9);
            doc.setTextColor(50, 50, 50);
            
            const lines = doc.splitTextToSize(text, 160);
            lines.forEach((line, index) => {
                if (y > pageHeight) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, margin + 7, y);
                y += index < lines.length - 1 ? 5 : 6;
            });
        };

        const addSection = (title, color = [138, 43, 226]) => {
            y += 3;
            if (y > pageHeight - 10) {
                doc.addPage();
                y = 20;
            }
            doc.setFillColor(color[0], color[1], color[2]);
            doc.rect(margin, y - 5, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(title, margin + 2, y);
            y += 10;
        };

        // Header
        doc.setFillColor(138, 43, 226);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('FINEX', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text('CHECKLIST COMPLETO DO SISTEMA', 105, 28, { align: 'center' });
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 35, { align: 'center' });

        y = 50;

        // 1. DESIGN E INTERFACE
        addSection('1. DESIGN E INTERFACE', [138, 43, 226]);
        addText('Layout e Navegação', 11, true);
        addCheckbox('Sidebar responsiva com menu lateral');
        addCheckbox('Logo e nome do app personalizáveis (FINEX)');
        addCheckbox('Tema escuro por padrão (Dark, Light, Purple, Blue, Green)');
        addCheckbox('Efeitos visuais personalizáveis');
        addCheckbox('Design responsivo (mobile/tablet/desktop)');
        addCheckbox('Ícones Lucide React integrados');
        addCheckbox('Componentes shadcn/ui');
        addCheckbox('Gradientes glamurosos em cards e botões');
        y += 2;

        addText('Comprovantes', 11, true);
        addCheckbox('Comprovante de Pagamento com design glamuroso');
        addCheckbox('Comprovante de Recebimento com design glamuroso');
        addCheckbox('Header com nome FINEX');
        addCheckbox('Cores suaves e elegantes');
        addCheckbox('Botão de impressão otimizado');
        addCheckbox('Botão de compartilhamento');
        addCheckbox('Estilos específicos para impressão');

        // 2. AUTENTICAÇÃO E USUÁRIOS
        addSection('2. AUTENTICAÇÃO E USUÁRIOS', [46, 125, 50]);
        addText('Sistema de Login', 11, true);
        addCheckbox('Login automático via Base44');
        addCheckbox('Logout com redirecionamento');
        addCheckbox('Perfil de usuário editável');
        addCheckbox('Avatar/foto do perfil');
        addCheckbox('Telefone e preferências de tema');
        y += 2;

        addText('Entidade User', 11, true);
        addCheckbox('Campos built-in: id, email, full_name, role');
        addCheckbox('Campos customizados: avatar_url, phone, theme');
        addCheckbox('Configurações de tema personalizáveis');
        addCheckbox('subscription_status, subscription_plan, subscription_end_date');

        // 3. DASHBOARD
        addSection('3. DASHBOARD', [59, 130, 246]);
        addText('Visão Geral', 11, true);
        addCheckbox('Mensagem de boas-vindas com nome do usuário');
        addCheckbox('Data atual formatada');
        addCheckbox('Botão Nova Transação');
        y += 2;

        addText('Cards de Estatísticas', 11, true);
        addCheckbox('Saldo Total (todas as contas)');
        addCheckbox('Entradas do Mês (receitas completadas)');
        addCheckbox('Saídas do Mês (despesas completadas)');
        addCheckbox('Economia (diferença receitas - despesas)');
        addCheckbox('Ícones e gradientes personalizados');
        y += 2;

        addText('Notificações no Dashboard', 11, true);
        addCheckbox('Notificações de Sistema configuráveis');
        addCheckbox('Contas a Receber vencendo (próximos 7 dias)');
        addCheckbox('Alertas de contas vencidas');
        addCheckbox('Alertas de metas sem progresso');
        y += 2;

        addText('Componentes do Dashboard', 11, true);
        addCheckbox('Seção Minhas Contas com saldos');
        addCheckbox('Ações Rápidas (Nova Entrada/Saída/Conta/Meta)');
        addCheckbox('Gráfico de Fluxo de Caixa (6 meses)');
        addCheckbox('Progresso de Metas (top 3 ativas)');
        addCheckbox('Transações Recentes (5 mais recentes)');

        // 4. TRANSAÇÕES
        addSection('4. TRANSAÇÕES', [236, 72, 153]);
        addText('Funcionalidades', 11, true);
        addCheckbox('Criar Transação com formulário completo');
        addCheckbox('Listar Transações com filtros e ordenação');
        addCheckbox('Editar Transação');
        addCheckbox('Excluir Transação');
        addCheckbox('Atualização automática de saldo nas contas');
        addCheckbox('Filtros: tipo, categoria, conta, status, período');
        addCheckbox('Ordenação customizável');

        // 5. CONTAS E CARTEIRAS
        addSection('5. CONTAS E CARTEIRAS', [168, 85, 247]);
        addText('Tipos de Conta', 11, true);
        addCheckbox('Conta Corrente');
        addCheckbox('Poupança');
        addCheckbox('Cartão de Crédito');
        addCheckbox('Investimentos');
        addCheckbox('Criptomoedas');
        y += 2;

        addText('Funcionalidades', 11, true);
        addCheckbox('Criar Conta com saldo inicial');
        addCheckbox('Listar Contas em grid responsivo');
        addCheckbox('Editar Conta');
        addCheckbox('Transferências entre Contas');
        addCheckbox('Cor e ícone personalizados');

        // 6. CATEGORIAS
        addSection('6. CATEGORIAS', [245, 158, 11]);
        addText('Categorias do Sistema', 11, true);
        addCheckbox('Salário, Freelance, Investimentos');
        addCheckbox('Alimentação, Transporte, Moradia');
        addCheckbox('Saúde, Educação, Lazer');
        addCheckbox('Não editáveis por usuários comuns');
        y += 2;

        addText('Categorias Personalizadas', 11, true);
        addCheckbox('Criar Categoria com nome, tipo, cor, ícone');
        addCheckbox('Limite de orçamento opcional');
        addCheckbox('Editar apenas categorias do usuário');
        addCheckbox('Excluir com validação');

        // 7. METAS FINANCEIRAS
        addSection('7. METAS FINANCEIRAS', [16, 185, 129]);
        addCheckbox('Criar Meta com título, valor alvo, prazo');
        addCheckbox('Progress bar animado');
        addCheckbox('Adicionar valor à meta');
        addCheckbox('Notificação ao atingir 100%');
        addCheckbox('Visualização no Dashboard (top 3)');
        addCheckbox('Status: ativa/completa/pausada');

        // 8. CONTAS A PAGAR
        addSection('8. CONTAS A PAGAR', [239, 68, 68]);
        addCheckbox('Criar Conta a Pagar com fornecedor');
        addCheckbox('Listar com filtros por status, período');
        addCheckbox('Pagar Conta gerando transação automática');
        addCheckbox('Comprovante de Pagamento glamuroso');
        addCheckbox('Notificações de vencimento');
        addCheckbox('Recorrência opcional');
        addCheckbox('Cores por urgência (hoje/amanhã/dias)');

        // 9. CONTAS A RECEBER
        addSection('9. CONTAS A RECEBER', [34, 197, 94]);
        addCheckbox('Criar Conta a Receber com cliente');
        addCheckbox('Listar com filtros por status, período');
        addCheckbox('Receber Conta gerando transação automática');
        addCheckbox('Comprovante de Recebimento glamuroso');
        addCheckbox('Notificação especial no Dashboard');
        addCheckbox('Botão Ver leva para página Receivables');
        addCheckbox('Recorrência opcional');

        // 10. RELATÓRIOS E EXTRATOS
        addSection('10. RELATÓRIOS E EXTRATOS', [236, 72, 153]);
        addText('Relatórios IA', 11, true);
        addCheckbox('Análise Mensal Completa');
        addCheckbox('Gráfico Pizza por categorias');
        addCheckbox('Gráfico de Fluxo de Caixa');
        addCheckbox('Insights gerados por IA');
        addCheckbox('Tendências e previsões');
        y += 2;

        addText('Extrato Financeiro', 11, true);
        addCheckbox('Filtros avançados por período');
        addCheckbox('Lista cronológica com totalizadores');
        addCheckbox('Exportação PDF, Excel/CSV');
        addCheckbox('Impressão otimizada');

        // 11. SISTEMA DE ASSINATURAS
        addSection('11. SISTEMA DE ASSINATURAS', [234, 179, 8]);
        addText('Planos Disponíveis', 11, true);
        addCheckbox('Mensal (R$ 19,90)');
        addCheckbox('Semestral (R$ 89,90 - 25% desconto)');
        addCheckbox('Anual (R$ 149,90 - 37% desconto)');
        addCheckbox('Vitalício (R$ 297,00 - acesso permanente)');
        y += 2;

        addText('Integração Asaas', 11, true);
        addCheckbox('Gerar pagamento PIX com QR Code');
        addCheckbox('Webhook de confirmação automática');
        addCheckbox('Ativar assinatura automaticamente');
        addCheckbox('Enviar email de confirmação');
        addCheckbox('Registrar logs de transações');
        y += 2;

        addText('SubscriptionGuard', 11, true);
        addCheckbox('Bloquear acesso sem assinatura');
        addCheckbox('Aviso de expiração (7 dias antes)');
        addCheckbox('Tela de upgrade glamurosa');
        addCheckbox('Notificação de pagamento aprovado');

        // 12. CONSULTOR IA
        addSection('12. CONSULTOR IA', [251, 191, 36]);
        addCheckbox('Agent com acesso a todas entidades');
        addCheckbox('Criar transações por chat');
        addCheckbox('Consultar saldo e analisar gastos');
        addCheckbox('Sugerir economia');
        addCheckbox('Interface de conversação em tempo real');
        addCheckbox('Histórico de conversas');
        addCheckbox('Upload de arquivos');
        addCheckbox('Streaming de respostas');
        addCheckbox('WhatsApp (opcional)');

        // 13. ASSISTENTE DE VOZ
        addSection('13. ASSISTENTE DE VOZ', [168, 85, 247]);
        addCheckbox('Reconhecimento de voz em português');
        addCheckbox('Botão flutuante (canto inferior direito)');
        addCheckbox('Transcrição em tempo real');
        addCheckbox('Detecção automática de tipo, valor, descrição');
        addCheckbox('Criar transação por voz');
        addCheckbox('Criar conta a pagar/receber por voz');
        addCheckbox('Feedback visual com modal');
        addCheckbox('Atualiza Dashboard automaticamente');

        // 14. PAINEL ADMINISTRATIVO
        addSection('14. PAINEL ADMINISTRATIVO', [220, 38, 38]);
        addCheckbox('Acesso exclusivo para role: admin');
        addCheckbox('Dashboard Admin com estatísticas');
        addCheckbox('Gerenciamento de Usuários');
        addCheckbox('Gerenciamento de Assinaturas');
        addCheckbox('Gerenciamento de Planos');
        addCheckbox('Categorias do Sistema');
        addCheckbox('Tutoriais do Sistema');
        addCheckbox('Notificações Globais');
        addCheckbox('Configurações do Sistema (Branding)');
        addCheckbox('Logs de Webhook');
        addCheckbox('Backup do Sistema');
        addCheckbox('Limpeza de Banco de Dados');

        // 15. APLICATIVO MOBILE
        addSection('15. APLICATIVO MOBILE', [6, 182, 212]);
        addCheckbox('Página Baixar App com informações');
        addCheckbox('Links para iOS (App Store)');
        addCheckbox('Links para Android (Google Play)');
        addCheckbox('QR Codes para download');
        addCheckbox('Configurável pelo admin');

        // 16. TUTORIAIS
        addSection('16. TUTORIAIS', [139, 92, 246]);
        addCheckbox('Grid de vídeos');
        addCheckbox('Filtro por categoria');
        addCheckbox('Player de vídeo integrado');
        addCheckbox('Contador de visualizações');
        addCheckbox('Categorias: Finanças, Investimentos, Configurações, etc');

        // 17. E-MAILS E NOTIFICAÇÕES
        addSection('17. E-MAILS E NOTIFICAÇÕES', [236, 72, 153]);
        addCheckbox('E-mail de boas-vindas automático');
        addCheckbox('E-mail de pagamento aprovado');
        addCheckbox('Notificações in-app');
        addCheckbox('Alertas de vencimento');
        addCheckbox('Notificação de metas atingidas');

        // 18. SEGURANÇA E PERMISSÕES
        addSection('18. SEGURANÇA E PERMISSÕES', [220, 38, 38]);
        addCheckbox('RLS (Row Level Security) em todas entidades');
        addCheckbox('Permissões de Admin');
        addCheckbox('Service Role para webhooks');
        addCheckbox('Validação de tokens');

        // 19. INTEGRAÇÕES
        addSection('19. INTEGRAÇÕES', [16, 185, 129]);
        addText('Asaas (Pagamentos)', 11, true);
        addCheckbox('Criar cobrança PIX');
        addCheckbox('Gerar QR Code');
        addCheckbox('Webhook de confirmação');
        y += 2;

        addText('Core Integrations (Base44)', 11, true);
        addCheckbox('InvokeLLM (IA)');
        addCheckbox('SendEmail');
        addCheckbox('UploadFile');
        addCheckbox('GenerateImage');
        addCheckbox('ExtractDataFromUploadedFile');

        // 20. FUNCIONALIDADES ESPECIAIS
        addSection('20. FUNCIONALIDADES ESPECIAIS', [236, 72, 153]);
        addCheckbox('Suporte WhatsApp com botão flutuante');
        addCheckbox('Modo de impressão otimizado');
        addCheckbox('Compartilhamento via Web Share API');
        addCheckbox('Design responsivo mobile-first');
        addCheckbox('Breakpoints: sm, md, lg, xl');

        // 21. PERFORMANCE E UX
        addSection('21. PERFORMANCE E UX', [59, 130, 246]);
        addCheckbox('Loading states em todas chamadas');
        addCheckbox('Skeleton loaders');
        addCheckbox('Debounce em buscas');
        addCheckbox('Cache de queries (@tanstack/react-query)');
        addCheckbox('Animações Framer Motion');
        addCheckbox('Transições suaves');
        addCheckbox('Tratamento de erros amigável');

        // 22. ENTIDADES COMPLETAS
        addSection('22. ENTIDADES COMPLETAS', [138, 43, 226]);
        addCheckbox('User (sistema + custom)');
        addCheckbox('Transaction');
        addCheckbox('Account');
        addCheckbox('Category (usuário) + SystemCategory (sistema)');
        addCheckbox('Goal');
        addCheckbox('Bill (payables + receivables)');
        addCheckbox('Transfer');
        addCheckbox('Subscription');
        addCheckbox('SystemPlan');
        addCheckbox('SystemTutorial');
        addCheckbox('SystemNotification');
        addCheckbox('SystemSettings');
        addCheckbox('WebhookLog');

        // 23. BACKEND FUNCTIONS
        addSection('23. BACKEND FUNCTIONS', [245, 158, 11]);
        addCheckbox('asaasCreatePayment (cria cobrança PIX)');
        addCheckbox('asaasWebhook (processa confirmações)');
        addCheckbox('generateChecklistPDF (este documento!)');

        // Footer
        doc.addPage();
        y = 100;
        doc.setFillColor(138, 43, 226);
        doc.rect(0, y - 10, 210, 60, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('SISTEMA FINEX COMPLETO', 105, y + 10, { align: 'center' });
        doc.setFontSize(12);
        doc.text('Inteligência Financeira', 105, y + 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text('✅ Todos os módulos implementados e testados', 105, y + 30, { align: 'center' });
        doc.text('🚀 Pronto para produção', 105, y + 38, { align: 'center' });

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="FINEX_Checklist_${new Date().toISOString().split('T')[0]}.pdf"`
            }
        });
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});