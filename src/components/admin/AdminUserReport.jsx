import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Subscription } from "@/entities/Subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, FileText, Users, DollarSign, Calendar, Filter } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminUserReport() {
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest"); // ✅ NOVO: ordenação
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [jsPDFLoaded, setJsPDFLoaded] = useState(false);

  useEffect(() => {
    loadData();
    loadJsPDF();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filterStatus, filterPlan, sortOrder]); // ✅ Adicionar sortOrder

  const loadJsPDF = () => {
    // Verificar se já está carregado
    if (window.jspdf && window.jspdf.jsPDF) {
      setJsPDFLoaded(true);
      return;
    }

    // Carregar script dinamicamente
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.async = true;
    script.onload = () => {
      console.log("✅ jsPDF carregado com sucesso!");
      setJsPDFLoaded(true);
    };
    script.onerror = () => {
      console.error("❌ Erro ao carregar jsPDF");
      alert("Erro ao carregar biblioteca de PDF. Recarregue a página.");
    };
    document.body.appendChild(script);
  };

  const loadData = async () => {
    try {
      const [usersData, subsData] = await Promise.all([
        User.list(),
        Subscription.list("-created_date")
      ]);
      setUsers(usersData);
      setSubscriptions(subsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(u => {
        if (filterStatus === "active") {
          return u.subscription_status === "active" && 
                 u.subscription_end_date && 
                 new Date(u.subscription_end_date) > new Date();
        } else if (filterStatus === "free") {
          return !u.subscription_status || u.subscription_status === "pending";
        } else if (filterStatus === "expired") {
          return u.subscription_status === "expired" || 
                 (u.subscription_end_date && new Date(u.subscription_end_date) < new Date());
        }
        return u.subscription_status === filterStatus;
      });
    }

    if (filterPlan !== "all") {
      if (filterPlan === "none") {
        filtered = filtered.filter(u => !u.subscription_plan);
      } else {
        filtered = filtered.filter(u => u.subscription_plan === filterPlan);
      }
    }

    // ✅ NOVO: Aplicar ordenação
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_date);
      const dateB = new Date(b.created_date);
      
      if (sortOrder === "newest") {
        return dateB.getTime() - dateA.getTime(); // Mais novos primeiro
      } else {
        return dateA.getTime() - dateB.getTime(); // Mais antigos primeiro
      }
    });

    setFilteredUsers(filtered);
  };

  const getUserSubscription = (userEmail) => {
    return subscriptions
      .filter(s => s.user_email === userEmail)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
  };

  const calculateStats = () => {
    const activeUsers = users.filter(u => 
      u.subscription_status === "active" && 
      u.subscription_end_date && 
      new Date(u.subscription_end_date) > new Date()
    );

    const freeUsers = users.filter(u => 
      !u.subscription_status || u.subscription_status === "pending"
    );

    const expiredUsers = users.filter(u => 
      u.subscription_status === "expired" || 
      (u.subscription_end_date && new Date(u.subscription_end_date) < new Date())
    );

    const totalRevenue = subscriptions
      .filter(s => s.status === "active")
      .reduce((sum, s) => sum + (s.amount_paid || 0), 0);

    const monthlyPlans = users.filter(u => u.subscription_plan === "monthly").length;
    const semesterPlans = users.filter(u => u.subscription_plan === "semester").length;
    const annualPlans = users.filter(u => u.subscription_plan === "annual").length;
    const lifetimePlans = users.filter(u => u.subscription_plan === "lifetime").length;

    return {
      total: users.length,
      active: activeUsers.length,
      free: freeUsers.length,
      expired: expiredUsers.length,
      totalRevenue,
      monthlyPlans,
      semesterPlans,
      annualPlans,
      lifetimePlans
    };
  };

  const exportToPDF = async () => {
    if (!jsPDFLoaded) {
      alert("⏳ Aguarde... A biblioteca de PDF ainda está carregando. Tente novamente em alguns segundos.");
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("❌ Erro ao carregar jsPDF. Recarregue a página e tente novamente.");
      return;
    }

    setIsExporting(true);
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const stats = calculateStats();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // ============================================
      // PÁGINA 1: CAPA PROFISSIONAL
      // ============================================
      
      // Fundo gradiente (simulado com retângulos)
      doc.setFillColor(10, 10, 15); // Cor de fundo escura
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Retângulo decorativo superior
      doc.setFillColor(139, 92, 246); // Roxo
      doc.rect(0, 0, pageWidth, 60, 'F');
      
      // Logo/Ícone (simulado com círculo)
      doc.setFillColor(255, 255, 255);
      doc.circle(pageWidth / 2, 35, 12, 'F');
      doc.setFillColor(139, 92, 246);
      doc.circle(pageWidth / 2, 35, 8, 'F');
      
      // Título principal
      doc.setFontSize(32);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('FINEX', pageWidth / 2, 90, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setTextColor(200, 200, 200);
      doc.text('Relatório Gerencial de Usuários', pageWidth / 2, 105, { align: 'center' });
      
      // Linha decorativa
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(1);
      doc.line(40, 115, pageWidth - 40, 115);
      
      // Informações do relatório
      doc.setFontSize(11);
      doc.setTextColor(180, 180, 180);
      doc.setFont(undefined, 'normal');
      const reportDate = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Data de Geração: ${reportDate}`, pageWidth / 2, 135, { align: 'center' });
      doc.text(`Total de Registros: ${filteredUsers.length} usuários`, pageWidth / 2, 145, { align: 'center' });
      
      // Box com destaques
      doc.setFillColor(26, 26, 46);
      doc.roundedRect(30, 160, pageWidth - 60, 80, 5, 5, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(139, 92, 246);
      doc.setFont(undefined, 'bold');
      doc.text('📊 Resumo Executivo', 40, 175);
      
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'normal');
      doc.text(`✅ Usuários Ativos: ${stats.active} (${((stats.total > 0 ? stats.active/stats.total : 0)*100).toFixed(1)}%)`, 40, 190);
      doc.text(`🆓 Usuários Free: ${stats.free} (${((stats.total > 0 ? stats.free/stats.total : 0)*100).toFixed(1)}%)`, 40, 200);
      doc.text(`💰 Receita Total: R$ ${stats.totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 40, 210);
      doc.text(`📈 Taxa de Conversão: ${((stats.active + stats.free > 0 ? stats.active/(stats.active+stats.free) : 0)*100).toFixed(1)}%`, 40, 220);
      
      // Rodapé da capa
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('DOCUMENTO CONFIDENCIAL - USO ADMINISTRATIVO', pageWidth / 2, pageHeight - 20, { align: 'center' });
      
      // ============================================
      // PÁGINA 2: ESTATÍSTICAS DETALHADAS
      // ============================================
      doc.addPage();
      
      // Cabeçalho
      addHeader(doc, pageWidth);
      
      let y = 45;
      
      // Seção: Visão Geral
      doc.setFillColor(139, 92, 246);
      doc.rect(20, y, pageWidth - 40, 8, 'F');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('📊 VISÃO GERAL DO SISTEMA', 25, y + 6);
      
      y += 15;
      
      // Grid de estatísticas
      const colWidth = (pageWidth - 50) / 2;
      
      // Coluna 1
      doc.setFillColor(26, 26, 46);
      doc.roundedRect(20, y, colWidth - 5, 50, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(139, 92, 246);
      doc.setFont(undefined, 'bold');
      doc.text('Total de Usuários', 25, y + 8);
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text(stats.total.toString(), 25, y + 25);
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.setFont(undefined, 'normal');
      doc.text('Registrados no sistema', 25, y + 35);
      
      // Coluna 2
      doc.setFillColor(26, 26, 46);
      doc.roundedRect(20 + colWidth, y, colWidth - 5, 50, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.setFont(undefined, 'bold');
      doc.text('Usuários Ativos', 25 + colWidth, y + 8);
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text(stats.active.toString(), 25 + colWidth, y + 25);
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.setFont(undefined, 'normal');
      doc.text(`${((stats.total > 0 ? stats.active/stats.total : 0)*100).toFixed(1)}% do total`, 25 + colWidth, y + 35);
      
      y += 58;
      
      // Coluna 3
      doc.setFillColor(26, 26, 46);
      doc.roundedRect(20, y, colWidth - 5, 50, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(245, 158, 11);
      doc.setFont(undefined, 'bold');
      doc.text('Usuários Free', 25, y + 8);
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text(stats.free.toString(), 25, y + 25);
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.setFont(undefined, 'normal');
      doc.text(`${((stats.total > 0 ? stats.free/stats.total : 0)*100).toFixed(1)}% do total`, 25, y + 35);
      
      // Coluna 4
      doc.setFillColor(26, 26, 46);
      doc.roundedRect(20 + colWidth, y, colWidth - 5, 50, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(6, 182, 212);
      doc.setFont(undefined, 'bold');
      doc.text('Receita Total', 25 + colWidth, y + 8);
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text(`R$ ${stats.totalRevenue.toFixed(2)}`, 25 + colWidth, y + 25);
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.setFont(undefined, 'normal');
      doc.text('Arrecadado em assinaturas', 25 + colWidth, y + 35);
      
      y += 58;
      
      // Seção: Distribuição de Planos
      doc.setFillColor(139, 92, 246);
      doc.rect(20, y, pageWidth - 40, 8, 'F');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('💎 DISTRIBUIÇÃO DE PLANOS', 25, y + 6);
      
      y += 15;
      
      // Gráfico de barras simulado
      const plans = [
        { name: 'Mensal', count: stats.monthlyPlans, color: [59, 130, 246] },
        { name: 'Semestral', count: stats.semesterPlans, color: [139, 92, 246] },
        { name: 'Anual', count: stats.annualPlans, color: [236, 72, 153] },
        { name: 'Vitalício', count: stats.lifetimePlans, color: [245, 158, 11] }
      ];
      
      const maxCount = Math.max(...plans.map(p => p.count), 1);
      const barMaxWidth = 120;
      const barHeight = 12;
      
      plans.forEach((plan, index) => {
        const barY = y + (index * 20);
        const barWidth = (plan.count / maxCount) * barMaxWidth;
        
        // Fundo da barra
        doc.setFillColor(40, 40, 50);
        doc.roundedRect(70, barY, barMaxWidth, barHeight, 2, 2, 'F');
        
        // Barra preenchida
        if (plan.count > 0) {
          doc.setFillColor(...plan.color);
          doc.roundedRect(70, barY, barWidth, barHeight, 2, 2, 'F');
        }
        
        // Label
        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.setFont(undefined, 'normal');
        doc.text(plan.name, 25, barY + 8);
        
        // Valor
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${plan.count}`, 195, barY + 8, { align: 'right' });
      });
      
      // Rodapé
      addFooter(doc, pageWidth, pageHeight, 2);
      
      // ============================================
      // PÁGINA 3+: DETALHAMENTO DOS USUÁRIOS
      // ============================================
      doc.addPage();
      addHeader(doc, pageWidth);
      
      y = 45;
      
      // Cabeçalho da seção
      doc.setFillColor(139, 92, 246);
      doc.rect(20, y, pageWidth - 40, 8, 'F');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('👥 DETALHAMENTO DOS USUÁRIOS', 25, y + 6);
      
      y += 18;
      
      // Tabela de usuários
      filteredUsers.forEach((user, index) => {
        if (y > 260) {
          addFooter(doc, pageWidth, pageHeight, doc.internal.getCurrentPageInfo().pageNumber);
          doc.addPage();
          addHeader(doc, pageWidth);
          y = 45;
        }
        
        const subscription = getUserSubscription(user.email);
        const isActive = user.subscription_status === "active" && 
                        user.subscription_end_date && 
                        new Date(user.subscription_end_date) > new Date();
        const isFree = !user.subscription_status || user.subscription_status === "pending";
        
        // Box do usuário
        doc.setFillColor(26, 26, 46);
        doc.roundedRect(20, y, pageWidth - 40, 38, 3, 3, 'F');
        
        // Avatar (círculo)
        const avatarColor = isActive ? [16, 185, 129] : isFree ? [245, 158, 11] : [239, 68, 68];
        doc.setFillColor(...avatarColor);
        doc.circle(30, y + 12, 6, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text((user.full_name?.charAt(0) || "U").toUpperCase(), 30, y + 14, { align: 'center' });
        
        // Nome e Email
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text(user.full_name || 'Sem nome', 42, y + 10);
        
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.setFont(undefined, 'normal');
        doc.text(user.email, 42, y + 16);
        
        // Status Badge
        const statusX = 42;
        const statusY = y + 22;
        if (isActive) {
          doc.setFillColor(16, 185, 129, 0.3); // RGBA for transparency
          doc.roundedRect(statusX, statusY, 28, 6, 2, 2, 'F');
          doc.setFontSize(7);
          doc.setTextColor(16, 185, 129);
          doc.setFont(undefined, 'bold');
          doc.text('✓ ATIVO', statusX + 2, statusY + 4.5); // Adjust for vertical alignment
        } else if (isFree) {
          doc.setFillColor(245, 158, 11, 0.3);
          doc.roundedRect(statusX, statusY, 20, 6, 2, 2, 'F');
          doc.setFontSize(7);
          doc.setTextColor(245, 158, 11);
          doc.setFont(undefined, 'bold');
          doc.text('FREE', statusX + 2, statusY + 4.5);
        } else { // Expired
          doc.setFillColor(239, 68, 68, 0.3);
          doc.roundedRect(statusX, statusY, 30, 6, 2, 2, 'F');
          doc.setFontSize(7);
          doc.setTextColor(239, 68, 68);
          doc.setFont(undefined, 'bold');
          doc.text('EXPIRADO', statusX + 2, statusY + 4.5);
        }
        
        // Plano
        if (user.subscription_plan) {
          const planTextWidth = doc.getTextWidth(
            user.subscription_plan === "monthly" ? "MENSAL" :
            user.subscription_plan === "semester" ? "SEMESTRAL" :
            user.subscription_plan === "annual" ? "ANUAL" : "VITALÍCIO"
          );
          const planX = statusX + (isActive || isFree ? (isActive ? 28 + 4 : 20 + 4) : 30 + 4); // Position after status badge + some padding
          doc.setFillColor(139, 92, 246, 0.3);
          doc.roundedRect(planX, statusY, planTextWidth + 4, 6, 2, 2, 'F'); // Add padding to width
          doc.setFontSize(7);
          doc.setTextColor(139, 92, 246);
          doc.setFont(undefined, 'bold');
          const planText = user.subscription_plan === "monthly" ? "MENSAL" :
                          user.subscription_plan === "semester" ? "SEMESTRAL" :
                          user.subscription_plan === "annual" ? "ANUAL" : "VITALÍCIO";
          doc.text(planText, planX + 2, statusY + 4.5);
        }
        
        // Coluna direita - Valores
        const rightCol = pageWidth - 65;
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text('Valor Pago:', rightCol, y + 10);
        doc.setFontSize(11);
        doc.setTextColor(6, 182, 212);
        doc.setFont(undefined, 'bold');
        doc.text(subscription && subscription.amount_paid ? `R$ ${subscription.amount_paid.toFixed(2)}` : 'R$ 0,00', rightCol, y + 17);
        
        if (user.subscription_end_date) {
          doc.setFontSize(7);
          doc.setTextColor(180, 180, 180);
          doc.setFont(undefined, 'normal');
          doc.text(`Vence: ${new Date(user.subscription_end_date).toLocaleDateString('pt-BR')}`, rightCol, y + 23);
        }
        
        // Linha separadora
        y += 40;
        doc.setDrawColor(60, 60, 80);
        doc.setLineWidth(0.1);
        doc.line(20, y, pageWidth - 20, y);
        y += 2;
      });
      
      // Última página - rodapé
      addFooter(doc, pageWidth, pageHeight, doc.internal.getCurrentPageInfo().pageNumber);
      
      // Salvar
      const filename = `FINEX_Relatorio_Usuarios_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      alert(`✅ RELATÓRIO PROFISSIONAL GERADO!\n\n📊 Documento inclui:\n• Capa executiva\n• Estatísticas detalhadas\n• Gráficos visuais\n• ${filteredUsers.length} usuários detalhados\n• ${doc.internal.getNumberOfPages()} páginas\n\n💾 Arquivo: ${filename}`);
      
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("❌ Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  // Função auxiliar: Cabeçalho
  const addHeader = (doc, pageWidth) => {
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setFillColor(139, 92, 246);
    doc.circle(25, 17, 8, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(25, 17, 5, 'F');
    
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('FINEX', 40, 20);
    
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.setFont(undefined, 'normal');
    doc.text('Relatório Gerencial', 40, 26);
    
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(0, 35, pageWidth, 35);
  };

  // Função auxiliar: Rodapé
  const addFooter = (doc, pageWidth, pageHeight, pageNum) => {
    const footerY = pageHeight - 15;
    
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(0, footerY - 5, pageWidth, footerY - 5);
    
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont(undefined, 'normal');
    doc.text('FINEX - Inteligência Financeira | Documento Confidencial', 20, footerY);
    
    doc.text(`Página ${pageNum}`, pageWidth - 20, footerY, { align: 'right' });
    
    doc.setFontSize(6);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, footerY + 5, { align: 'center' }); // Adjusted Y for date
  };

  const stats = calculateStats();

  if (isLoading) {
    return <div className="text-purple-300 text-center py-12">Carregando relatório...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-300 text-sm">Total</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-300 text-sm">Ativos (Pagos)</p>
                <p className="text-3xl font-bold text-white">{stats.active}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-yellow-300 text-sm">Free/Pendentes</p>
                <p className="text-3xl font-bold text-white">{stats.free}</p>
              </div>
              <Users className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-cyan-300 text-sm">Receita Total</p>
                <p className="text-2xl font-bold text-white">R$ {stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-purple-900/20 border-purple-700/50 text-white"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 bg-purple-900/20 border-purple-700/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">✅ Ativos (Pagos)</SelectItem>
                <SelectItem value="free">🆓 Free/Pendentes</SelectItem>
                <SelectItem value="expired">⏰ Expirados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-full md:w-48 bg-purple-900/20 border-purple-700/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="semester">Semestral</SelectItem>
                <SelectItem value="annual">Anual</SelectItem>
                <SelectItem value="lifetime">Vitalício</SelectItem>
                <SelectItem value="none">Sem Plano</SelectItem>
              </SelectContent>
            </Select>

            {/* ✅ NOVO: Select de Ordenação */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full md:w-48 bg-purple-900/20 border-purple-700/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais Novos Primeiro</SelectItem>
                <SelectItem value="oldest">Mais Antigos Primeiro</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={exportToPDF}
              disabled={isExporting || !jsPDFLoaded}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              {isExporting ? (
                <>
                  <FileText className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : !jsPDFLoaded ? (
                <>
                  <FileText className="w-4 h-4 mr-2 animate-pulse" />
                  Carregando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white">
            Usuários Filtrados ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {filteredUsers.map((user, index) => {
              const subscription = getUserSubscription(user.email);
              const isActive = user.subscription_status === "active" && 
                              user.subscription_end_date && 
                              new Date(user.subscription_end_date) > new Date();
              const isFree = !user.subscription_status || user.subscription_status === "pending";
              const isExpired = user.subscription_status === "expired" || 
                               (user.subscription_end_date && new Date(user.subscription_end_date) < new Date());

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-start justify-between p-4 rounded-xl glass-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-bold">{user.full_name?.charAt(0) || "U"}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">{user.full_name || "Sem nome"}</p>
                        <p className="text-purple-300 text-sm">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 ml-13">
                      {isActive && (
                        <Badge className="bg-green-600 text-white">
                          ✅ ATIVO (PAGO)
                        </Badge>
                      )}
                      {isFree && (
                        <Badge className="bg-yellow-600 text-white">
                          🆓 FREE
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge className="bg-red-600 text-white">
                          ⏰ EXPIRADO
                        </Badge>
                      )}

                      {user.subscription_plan && (
                        <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/40">
                          {user.subscription_plan === "monthly" && "📅 Mensal"}
                          {user.subscription_plan === "semester" && "📅 Semestral"}
                          {user.subscription_plan === "annual" && "📅 Anual"}
                          {user.subscription_plan === "lifetime" && "♾️ Vitalício"}
                        </Badge>
                      )}

                      {user.subscription_end_date && (
                        <Badge variant="outline" className="border-cyan-600/40 text-cyan-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          Vence: {new Date(user.subscription_end_date).toLocaleDateString('pt-BR')}
                        </Badge>
                      )}

                      {subscription && (
                        <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-600/40">
                          <DollarSign className="w-3 h-3 mr-1" />
                          R$ {subscription.amount_paid.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}