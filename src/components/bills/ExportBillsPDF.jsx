import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, FileText, Loader2, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { jsPDF } from "jspdf";

export default function ExportBillsPDF({ bills, categories, accounts, type = "payable" }) {
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    account: "all",
    startDate: "",
    endDate: ""
  });

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 20;
      let pageNumber = 1;

      // ============================================
      // FUNÇÕES AUXILIARES
      // ============================================
      const addPageNumber = () => {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${pageNumber}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        doc.text('FINEX - Inteligência Financeira', 14, pageHeight - 10);
        pageNumber++;
      };

      const addHeader = (includePageNumber = true) => {
        // Gradiente superior
        doc.setFillColor(139, 92, 246);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        // Linha de destaque
        doc.setFillColor(236, 72, 153);
        doc.rect(0, 32, pageWidth, 3, 'F');
        
        // Logo/Título
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont(undefined, 'bold');
        doc.text('FINEX', 14, 22);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Inteligência Financeira Empresarial', 14, 28);
        
        if (includePageNumber) {
          addPageNumber();
        }
      };

      const addNewPage = () => {
        doc.addPage();
        addHeader();
        return 45;
      };

      const checkPageSpace = (currentY, spaceNeeded) => {
        if (currentY + spaceNeeded > pageHeight - 25) {
          return addNewPage();
        }
        return currentY;
      };

      const drawProgressBar = (x, y, width, height, percentage, color = [139, 92, 246]) => {
        // Barra de fundo
        doc.setFillColor(240, 240, 245);
        doc.roundedRect(x, y, width, height, 2, 2, 'F');
        
        // Barra de progresso
        const fillWidth = (width * percentage) / 100;
        doc.setFillColor(...color);
        doc.roundedRect(x, y, fillWidth, height, 2, 2, 'F');
        
        // Porcentagem
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(8);
        doc.text(`${percentage.toFixed(1)}%`, x + width + 3, y + height - 1);
      };

      // Filtrar contas
      let filteredBills = bills.filter(b => {
        const matchesStatus = filters.status === "all" || b.status === filters.status;
        const matchesCategory = filters.category === "all" || b.category_id === filters.category;
        const matchesAccount = filters.account === "all" || b.account_id === filters.account;
        
        let matchesDate = true;
        if (filters.startDate && b.due_date < filters.startDate) matchesDate = false;
        if (filters.endDate && b.due_date > filters.endDate) matchesDate = false;
        
        return matchesStatus && matchesCategory && matchesAccount && matchesDate;
      });

      // ============================================
      // PÁGINA DE CAPA
      // ============================================
      doc.setFillColor(139, 92, 246);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Padrão decorativo
      doc.setFillColor(168, 85, 247);
      doc.circle(pageWidth + 20, -20, 80, 'F');
      doc.setFillColor(236, 72, 153);
      doc.circle(-20, pageHeight + 20, 60, 'F');
      
      // Logo grande
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(60);
      doc.setFont(undefined, 'bold');
      doc.text('FINEX', pageWidth / 2, 90, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text('Inteligência Financeira Empresarial', pageWidth / 2, 102, { align: 'center' });
      
      // Linha divisória
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(40, 110, pageWidth - 40, 110);
      
      // Título do relatório
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text(
        type === "payable" ? 'RELATÓRIO DE CONTAS A PAGAR' : 'RELATÓRIO DE CONTAS A RECEBER',
        pageWidth / 2,
        135,
        { align: 'center' }
      );
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      const currentDate = new Date();
      doc.text(`Período: ${currentDate.toLocaleDateString('pt-BR')}`, pageWidth / 2, 145, { align: 'center' });
      
      // Box de informações
      const boxY = 160;
      doc.setFillColor(255, 255, 255, 0.1);
      doc.roundedRect(30, boxY, pageWidth - 60, 60, 5, 5, 'F');
      
      doc.setFontSize(11);
      doc.text(`📊 Total de Registros: ${filteredBills.length}`, pageWidth / 2, boxY + 15, { align: 'center' });
      doc.text(`💰 Valor Total: R$ ${filteredBills.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}`, pageWidth / 2, boxY + 28, { align: 'center' });
      doc.text(`📅 Gerado em: ${currentDate.toLocaleString('pt-BR')}`, pageWidth / 2, boxY + 41, { align: 'center' });
      
      // Footer capa
      doc.setFontSize(9);
      doc.text('Documento confidencial - Uso interno', pageWidth / 2, pageHeight - 20, { align: 'center' });
      doc.text('© FINEX - Todos os direitos reservados', pageWidth / 2, pageHeight - 12, { align: 'center' });

      // ============================================
      // PÁGINA 2: SUMÁRIO EXECUTIVO
      // ============================================
      y = addNewPage();

      // Título da seção
      doc.setFillColor(139, 92, 246);
      doc.roundedRect(14, y, pageWidth - 28, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('📋 SUMÁRIO EXECUTIVO', 18, y + 8);
      y += 20;

      doc.setFont(undefined, 'normal');
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.text(`Este relatório apresenta uma análise detalhada das ${type === 'payable' ? 'contas a pagar' : 'contas a receber'}`, 14, y);
      y += 6;
      doc.text(`da empresa, incluindo indicadores de performance, análise de tendências e projeções.`, 14, y);
      y += 15;

      // KPIs em cards
      const cardWidth = (pageWidth - 38) / 2;
      const cardHeight = 35;
      
      // Card 1: Total Geral
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, y, cardWidth, cardHeight, 4, 4, 'F');
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(0.5);
      doc.roundedRect(14, y, cardWidth, cardHeight, 4, 4, 'S');
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text('VALOR TOTAL', 18, y + 8);
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(`R$ ${filteredBills.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}`, 18, y + 22);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`${filteredBills.length} registro(s)`, 18, y + 30);
      
      // Card 2: Pendente
      const pendingAmount = filteredBills.filter(b => b.status === "pending").reduce((sum, b) => sum + b.amount, 0);
      doc.setFillColor(254, 252, 232);
      doc.roundedRect(14 + cardWidth + 10, y, cardWidth, cardHeight, 4, 4, 'F');
      doc.setDrawColor(234, 179, 8);
      doc.roundedRect(14 + cardWidth + 10, y, cardWidth, cardHeight, 4, 4, 'S');
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text('PENDENTE', 18 + cardWidth + 10, y + 8);
      doc.setTextColor(234, 179, 8);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(`R$ ${pendingAmount.toFixed(2)}`, 18 + cardWidth + 10, y + 22);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`${filteredBills.filter(b => b.status === "pending").length} conta(s)`, 18 + cardWidth + 10, y + 30);
      
      y += cardHeight + 10;
      
      // Card 3: Pago
      const paidAmount = filteredBills.filter(b => b.status === "paid").reduce((sum, b) => sum + b.amount, 0);
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(14, y, cardWidth, cardHeight, 4, 4, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.roundedRect(14, y, cardWidth, cardHeight, 4, 4, 'S');
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text(type === 'payable' ? 'PAGO' : 'RECEBIDO', 18, y + 8);
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(`R$ ${paidAmount.toFixed(2)}`, 18, y + 22);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`${filteredBills.filter(b => b.status === "paid").length} conta(s)`, 18, y + 30);
      
      // Card 4: Vencido
      const overdueAmount = filteredBills.filter(b => b.status === "overdue").reduce((sum, b) => sum + b.amount, 0);
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(14 + cardWidth + 10, y, cardWidth, cardHeight, 4, 4, 'F');
      doc.setDrawColor(239, 68, 68);
      doc.roundedRect(14 + cardWidth + 10, y, cardWidth, cardHeight, 4, 4, 'S');
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text('VENCIDO', 18 + cardWidth + 10, y + 8);
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(`R$ ${overdueAmount.toFixed(2)}`, 18 + cardWidth + 10, y + 22);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`${filteredBills.filter(b => b.status === "overdue").length} conta(s)`, 18 + cardWidth + 10, y + 30);
      
      y += cardHeight + 20;

      // Gráfico de status (barra de progresso visual)
      y = checkPageSpace(y, 50);
      
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('📊 DISTRIBUIÇÃO POR STATUS', 14, y);
      y += 10;
      
      const totalAmount = filteredBills.reduce((sum, b) => sum + b.amount, 0);
      const statuses = [
        { label: 'Pago', amount: paidAmount, color: [34, 197, 94], count: filteredBills.filter(b => b.status === "paid").length },
        { label: 'Pendente', amount: pendingAmount, color: [234, 179, 8], count: filteredBills.filter(b => b.status === "pending").length },
        { label: 'Vencido', amount: overdueAmount, color: [239, 68, 68], count: filteredBills.filter(b => b.status === "overdue").length }
      ];
      
      statuses.forEach(status => {
        const percentage = totalAmount > 0 ? (status.amount / totalAmount) * 100 : 0;
        
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(`${status.label}: R$ ${status.amount.toFixed(2)} (${status.count})`, 14, y + 3);
        drawProgressBar(14, y + 5, 120, 6, percentage, status.color);
        y += 15;
      });
      
      y += 10;

      // Análise por categoria
      y = checkPageSpace(y, 60);
      
      doc.setFillColor(139, 92, 246);
      doc.roundedRect(14, y, pageWidth - 28, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('📈 ANÁLISE POR CATEGORIA', 18, y + 8);
      y += 20;
      
      const categoryStats = {};
      filteredBills.forEach(bill => {
        const cat = categories.find(c => c.id === bill.category_id);
        const catName = cat?.name || 'Sem categoria';
        if (!categoryStats[catName]) {
          categoryStats[catName] = { total: 0, count: 0 };
        }
        categoryStats[catName].total += bill.amount;
        categoryStats[catName].count += 1;
      });
      
      const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5);
      
      if (sortedCategories.length > 0) {
        sortedCategories.forEach(([name, data]) => {
          y = checkPageSpace(y, 15);
          const percentage = totalAmount > 0 ? (data.total / totalAmount) * 100 : 0;
          
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          doc.setFont(undefined, 'normal');
          doc.text(`${name}: R$ ${data.total.toFixed(2)} (${data.count} registros)`, 14, y + 3);
          drawProgressBar(14, y + 5, 120, 6, percentage, [139, 92, 246]);
          y += 15;
        });
      } else {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Nenhuma categoria para exibir', 14, y);
        y += 10;
      }
      
      y += 15;

      // ============================================
      // PÁGINA 3: DETALHAMENTO
      // ============================================
      y = addNewPage();
      
      doc.setFillColor(139, 92, 246);
      doc.roundedRect(14, y, pageWidth - 28, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('📋 DETALHAMENTO DE CONTAS', 18, y + 8);
      y += 20;

      // Filtros aplicados
      if (filters.status !== "all" || filters.category !== "all" || filters.account !== "all" || filters.startDate || filters.endDate) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, y, pageWidth - 28, 8 + (
          (filters.status !== "all" ? 4 : 0) +
          (filters.category !== "all" ? 4 : 0) +
          (filters.account !== "all" ? 4 : 0) +
          (filters.startDate ? 4 : 0) +
          (filters.endDate ? 4 : 0)
        ), 3, 3, 'F');
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('🔍 Filtros aplicados:', 18, y + 5);
        y += 8;
        
        doc.setFont(undefined, 'normal');
        if (filters.status !== "all") {
          doc.text(`  • Status: ${filters.status}`, 18, y);
          y += 4;
        }
        if (filters.category !== "all") {
          const cat = categories.find(c => c.id === filters.category);
          doc.text(`  • Categoria: ${cat?.name || 'N/A'}`, 18, y);
          y += 4;
        }
        if (filters.account !== "all") {
          const acc = accounts.find(a => a.id === filters.account);
          doc.text(`  • Conta: ${acc?.name || 'N/A'}`, 18, y);
          y += 4;
        }
        if (filters.startDate) {
          doc.text(`  • De: ${new Date(filters.startDate).toLocaleDateString('pt-BR')}`, 18, y);
          y += 4;
        }
        if (filters.endDate) {
          doc.text(`  • Até: ${new Date(filters.endDate).toLocaleDateString('pt-BR')}`, 18, y);
          y += 4;
        }
        
        y += 10;
      }

      // Tabela
      if (filteredBills.length === 0) {
        y = checkPageSpace(y, 30);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, y, pageWidth - 28, 25, 3, 3, 'F');
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('📭 Nenhum registro encontrado com os filtros aplicados.', pageWidth / 2, y + 15, { align: 'center' });
      } else {
        y = checkPageSpace(y, 20);
        
        // Headers da tabela modernos
        doc.setFillColor(139, 92, 246);
        doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text('DESCRIÇÃO', 17, y + 7);
        doc.text('CATEGORIA', 85, y + 7);
        doc.text('VENCIMENTO', 125, y + 7);
        doc.text('VALOR', 160, y + 7);
        doc.text('STATUS', 180, y + 7);

        y += 14;

        // Dados com design moderno
        doc.setFont(undefined, 'normal');
        filteredBills.forEach((bill, index) => {
          y = checkPageSpace(y, 18);
          
          if (y === 45) {
            // Repetir header na nova página
            doc.setFillColor(139, 92, 246);
            doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.text('DESCRIÇÃO', 17, y + 7);
            doc.text('CATEGORIA', 85, y + 7);
            doc.text('VENCIMENTO', 125, y + 7);
            doc.text('VALOR', 160, y + 7);
            doc.text('STATUS', 180, y + 7);
            y += 14;
            doc.setFont(undefined, 'normal');
          }

          // Linha alternada com bordas arredondadas
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, y - 3, pageWidth - 28, 14, 2, 2, 'F');
          }

          doc.setTextColor(40, 40, 40);
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          
          const description = bill.description.length > 25 ? bill.description.substring(0, 25) + '...' : bill.description;
          doc.text(description, 17, y + 4);
          
          const category = categories.find(c => c.id === bill.category_id);
          const catName = category?.name || 'N/A';
          doc.text(catName.substring(0, 12), 85, y + 4);
          
          const dueDate = new Date(bill.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          doc.text(dueDate, 125, y + 4);
          
          doc.setFont(undefined, 'bold');
          const amountColor = type === 'payable' ? [239, 68, 68] : [34, 197, 94];
          doc.setTextColor(...amountColor);
          doc.text(`R$ ${bill.amount.toFixed(2)}`, 160, y + 4);
          
          // Status badge
          const statusConfig = {
            pending: { text: 'Pendente', color: [234, 179, 8], bg: [254, 252, 232] },
            paid: { text: 'Pago', color: [34, 197, 94], bg: [240, 253, 244] },
            overdue: { text: 'Vencido', color: [239, 68, 68], bg: [254, 242, 242] },
            cancelled: { text: 'Cancel.', color: [158, 158, 158], bg: [248, 250, 252] }
          };
          
          const config = statusConfig[bill.status] || statusConfig.cancelled;
          doc.setFillColor(...config.bg);
          doc.roundedRect(178, y, 22, 7, 1, 1, 'F');
          doc.setTextColor(...config.color);
          doc.setFontSize(7);
          doc.text(config.text, 179, y + 5);

          y += 11;

          // Linha de detalhes
          doc.setTextColor(120, 120, 120);
          doc.setFontSize(6);
          doc.setFont(undefined, 'normal');
          
          const account = accounts.find(a => a.id === bill.account_id);
          const details = [];
          if (account) details.push(`💳 ${account.name}`);
          if (bill.contact_name) details.push(`👤 ${bill.contact_name}`);
          if (bill.notes) details.push(`📝 ${bill.notes.substring(0, 30)}`);
          
          if (details.length > 0) {
            doc.text(details.join(' • '), 17, y);
            y += 5;
          }
          
          y += 3;
        });
        
        y += 15;
      }

      // ============================================
      // PÁGINA FINAL: INSIGHTS E RECOMENDAÇÕES
      // ============================================
      y = addNewPage();
      
      doc.setFillColor(139, 92, 246);
      doc.roundedRect(14, y, pageWidth - 28, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('💡 INSIGHTS E RECOMENDAÇÕES', 18, y + 8);
      y += 20;
      
      // Análise de tendências
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('📊 Análise de Performance', 14, y);
      y += 8;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      const insights = [];
      
      if (filteredBills.filter(b => b.status === "overdue").length > 0) {
        insights.push('⚠️ Atenção: Existem contas vencidas que requerem ação imediata.');
      }
      
      const avgAmount = totalAmount / filteredBills.length;
      insights.push(`💰 Valor médio por conta: R$ ${avgAmount.toFixed(2)}`);
      
      const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
      if (paidPercentage >= 80) {
        insights.push(`✅ Excelente taxa de ${type === 'payable' ? 'pagamento' : 'recebimento'}: ${paidPercentage.toFixed(1)}%`);
      } else if (paidPercentage >= 50) {
        insights.push(`⚡ Taxa de ${type === 'payable' ? 'pagamento' : 'recebimento'} moderada: ${paidPercentage.toFixed(1)}%`);
      } else {
        insights.push(`⚠️ Taxa de ${type === 'payable' ? 'pagamento' : 'recebimento'} baixa: ${paidPercentage.toFixed(1)}% - Requer atenção`);
      }
      
      insights.forEach(insight => {
        y = checkPageSpace(y, 8);
        doc.text(insight, 14, y);
        y += 7;
      });
      
      y += 10;
      
      // Recomendações
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('🎯 Recomendações Estratégicas', 14, y);
      y += 8;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      const recommendations = [
        '• Implemente lembretes automáticos para contas próximas do vencimento',
        '• Negocie prazos melhores com fornecedores de maior volume',
        '• Considere descontos para pagamentos antecipados',
        '• Monitore tendências mensais para melhor planejamento',
        '• Automatize processos de cobrança para maior eficiência'
      ];
      
      recommendations.forEach(rec => {
        y = checkPageSpace(y, 7);
        doc.text(rec, 14, y);
        y += 7;
      });
      
      y += 15;
      
      // Box de conclusão
      y = checkPageSpace(y, 35);
      
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(14, y, pageWidth - 28, 30, 4, 4, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.roundedRect(14, y, pageWidth - 28, 30, 4, 4, 'S');
      
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('✨ FINEX - Inteligência Financeira ao Seu Alcance', pageWidth / 2, y + 12, { align: 'center' });
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text('Este relatório foi gerado automaticamente pelo sistema FINEX.', pageWidth / 2, y + 20, { align: 'center' });
      doc.text('Para mais informações, acesse o painel completo.', pageWidth / 2, y + 26, { align: 'center' });

      // Não precisa adicionar footers manualmente, já feito em addPageNumber()

      const fileName = `${type === "payable" ? 'contas_pagar' : 'contas_receber'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      alert(`✅ PDF gerado com sucesso!\n\n📊 ${filteredBills.length} registro(s) exportado(s)\n💰 Total: R$ ${totalAmount.toFixed(2)}`);
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("❌ Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      category: "all",
      account: "all",
      startDate: "",
      endDate: ""
    });
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="outline"
        className="border-purple-700 text-purple-300 hover:bg-purple-900/30"
      >
        <Download className="w-4 h-4 mr-2" />
        Exportar PDF
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              <FileText className="w-5 h-5 inline mr-2 text-purple-400" />
              Exportar PDF
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700/30">
              <p className="text-purple-200 text-sm mb-3">
                <strong>📊 Filtros de Exportação</strong>
              </p>
              <p className="text-purple-300 text-xs">
                Selecione os filtros desejados para personalizar seu relatório em PDF.
              </p>
            </div>

            <div>
              <Label className="text-purple-200 text-sm mb-2 block">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-purple-200 text-sm mb-2 block">Categoria</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-purple-200 text-sm mb-2 block">Conta</Label>
              <Select value={filters.account} onValueChange={(value) => setFilters({...filters, account: value})}>
                <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-purple-200 text-sm mb-2 block">Data Inicial</Label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  className="w-full px-3 py-2 bg-purple-900/20 border border-purple-700/50 rounded-md text-white text-sm"
                />
              </div>

              <div>
                <Label className="text-purple-200 text-sm mb-2 block">Data Final</Label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  className="w-full px-3 py-2 bg-purple-900/20 border border-purple-700/50 rounded-md text-white text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-purple-700/30">
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="flex-1 border-purple-700 text-purple-300"
                disabled={isGenerating}
              >
                Limpar Filtros
              </Button>
              <Button
                onClick={generatePDF}
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Gerar PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}