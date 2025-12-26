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
import { Download, FileText, Loader2 } from "lucide-react";
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
      let y = 20;

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

      // Header
      doc.setFillColor(168, 85, 247);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('FINEX', pageWidth / 2, 18, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(type === "payable" ? 'Relatório de Contas a Pagar' : 'Relatório de Contas a Receber', pageWidth / 2, 30, { align: 'center' });

      y = 50;

      // Info do relatório
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, y);
      y += 6;
      doc.text(`Total de registros: ${filteredBills.length}`, 14, y);
      y += 6;

      // Filtros aplicados
      if (filters.status !== "all" || filters.category !== "all" || filters.account !== "all" || filters.startDate || filters.endDate) {
        doc.text('Filtros aplicados:', 14, y);
        y += 5;
        
        if (filters.status !== "all") {
          doc.text(`  • Status: ${filters.status}`, 14, y);
          y += 4;
        }
        if (filters.category !== "all") {
          const cat = categories.find(c => c.id === filters.category);
          doc.text(`  • Categoria: ${cat?.name || 'N/A'}`, 14, y);
          y += 4;
        }
        if (filters.account !== "all") {
          const acc = accounts.find(a => a.id === filters.account);
          doc.text(`  • Conta: ${acc?.name || 'N/A'}`, 14, y);
          y += 4;
        }
        if (filters.startDate) {
          doc.text(`  • Data inicial: ${new Date(filters.startDate).toLocaleDateString('pt-BR')}`, 14, y);
          y += 4;
        }
        if (filters.endDate) {
          doc.text(`  • Data final: ${new Date(filters.endDate).toLocaleDateString('pt-BR')}`, 14, y);
          y += 4;
        }
      }

      y += 10;

      // Totais
      const totalAmount = filteredBills.reduce((sum, b) => sum + b.amount, 0);
      const pendingAmount = filteredBills.filter(b => b.status === "pending").reduce((sum, b) => sum + b.amount, 0);
      const paidAmount = filteredBills.filter(b => b.status === "paid").reduce((sum, b) => sum + b.amount, 0);

      doc.setFillColor(240, 240, 255);
      doc.rect(14, y, pageWidth - 28, 25, 'F');
      
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('RESUMO FINANCEIRO:', 18, y + 6);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text(`Total Geral: R$ ${totalAmount.toFixed(2)}`, 18, y + 12);
      doc.text(`Pendente: R$ ${pendingAmount.toFixed(2)}`, 18, y + 18);
      doc.text(`Pago: R$ ${paidAmount.toFixed(2)}`, 18, y + 24);

      y += 35;

      // Tabela
      if (filteredBills.length === 0) {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('Nenhum registro encontrado com os filtros aplicados.', pageWidth / 2, y, { align: 'center' });
      } else {
        // Headers da tabela
        doc.setFillColor(100, 50, 150);
        doc.rect(14, y, pageWidth - 28, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Descrição', 16, y + 6);
        doc.text('Vencimento', 100, y + 6);
        doc.text('Valor', 140, y + 6);
        doc.text('Status', 170, y + 6);

        y += 12;

        // Dados
        doc.setFont(undefined, 'normal');
        filteredBills.forEach((bill, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            
            // Repetir header na nova página
            doc.setFillColor(100, 50, 150);
            doc.rect(14, y, pageWidth - 28, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Descrição', 16, y + 6);
            doc.text('Vencimento', 100, y + 6);
            doc.text('Valor', 140, y + 6);
            doc.text('Status', 170, y + 6);
            y += 12;
            doc.setFont(undefined, 'normal');
          }

          // Linha alternada
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 252);
            doc.rect(14, y - 4, pageWidth - 28, 8, 'F');
          }

          doc.setTextColor(50, 50, 50);
          doc.setFontSize(8);
          
          const description = bill.description.substring(0, 30);
          doc.text(description, 16, y);
          
          const dueDate = new Date(bill.due_date).toLocaleDateString('pt-BR');
          doc.text(dueDate, 100, y);
          
          doc.text(`R$ ${bill.amount.toFixed(2)}`, 140, y);
          
          // Status com cor
          const statusText = {
            pending: 'Pendente',
            paid: 'Pago',
            overdue: 'Vencido',
            cancelled: 'Cancelado'
          }[bill.status] || bill.status;
          
          const statusColor = {
            pending: [255, 193, 7],
            paid: [76, 175, 80],
            overdue: [244, 67, 54],
            cancelled: [158, 158, 158]
          }[bill.status] || [100, 100, 100];
          
          doc.setTextColor(...statusColor);
          doc.setFont(undefined, 'bold');
          doc.text(statusText, 170, y);
          doc.setFont(undefined, 'normal');

          y += 8;

          // Detalhes extras (categoria, conta)
          doc.setTextColor(120, 120, 120);
          doc.setFontSize(7);
          
          const category = categories.find(c => c.id === bill.category_id);
          const account = accounts.find(a => a.id === bill.account_id);
          
          if (category || account) {
            const details = [];
            if (category) details.push(`Cat: ${category.name}`);
            if (account) details.push(`Conta: ${account.name}`);
            if (bill.contact_name) details.push(`Fornecedor: ${bill.contact_name}`);
            
            doc.text(details.join(' • '), 16, y);
            y += 6;
          } else {
            y += 2;
          }
        });
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text(
          `FINEX - Inteligência Financeira | Página ${i} de ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

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