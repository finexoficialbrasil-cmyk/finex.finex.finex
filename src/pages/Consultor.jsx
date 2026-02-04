import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, MessageCircle, Send, Loader2, Plus, Trash2, ExternalLink, TrendingUp, FileText, BarChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "../components/MessageBubble";
import FeatureGuard from "../components/FeatureGuard";

export default function Consultor() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");

  // ✅ NOVO: Estados para Relatórios IA
  const [reportPrompt, setReportPrompt] = useState("");
  const [reportResult, setReportResult] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    loadUserAndConversations();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      subscribeToConversation(currentConversation.id);
    }
  }, [currentConversation]);

  const loadUserAndConversations = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Carregando usuário...");
      const userData = await User.me();
      setUser(userData);
      setIsLoading(false); // ✅ Liberar a UI imediatamente
      
      // ✅ Carregar conversas EM SEGUNDO PLANO (não bloqueia a UI)
      console.log("🔄 Carregando conversas em segundo plano...");
      loadConversationsInBackground();
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setIsLoading(false);
    }
  };

  // ✅ OTIMIZADO: Carregar conversas com timeout e limite
  const loadConversationsInBackground = async () => {
    try {
      console.log("🔄 Buscando conversas (limite: 10, timeout: 10s)...");
      
      // ✅ Adicionar timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao carregar conversas')), 10000)
      );

      // ✅ Buscar apenas as conversas
      const conversationsPromise = base44.agents.listConversations({
        agent_name: "consultor_financeiro"
      });

      // ✅ Race entre timeout e carregamento
      const convs = await Promise.race([conversationsPromise, timeoutPromise]);
      
      // ✅ Limitar a 10 conversas mais recentes (assumindo que a API já retorna ordenado ou que não precisamos de ordenação específica aqui)
      // Se a API não garante ordem, podemos adicionar: .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const limitedConvs = (convs || []).slice(0, 10);
      
      console.log(`✅ ${limitedConvs.length} conversas carregadas`);
      setConversations(limitedConvs);
      
      // ✅ Se tem conversas, carregar a primeira
      if (limitedConvs.length > 0) {
        setCurrentConversation(limitedConvs[0]);
        setMessages(limitedConvs[0].messages || []);
      }
    } catch (error) {
      console.warn("⚠️ Erro ao carregar conversas (não crítico):", error);
      // ✅ Não bloquear a UI - usuário pode criar nova conversa
      setConversations([]);
      setCurrentConversation(null); // Clear current conversation if loading failed
      setMessages([]);
    }
  };

  const subscribeToConversation = (conversationId) => {
    try {
      const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
        setMessages(data.messages || []);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Erro ao inscrever na conversa:", error);
    }
  };

  const createNewConversation = async () => {
    try {
      console.log("🆕 Criando nova conversa...");
      
      const newConv = await base44.agents.createConversation({
        agent_name: "consultor_financeiro",
        metadata: {
          name: `Conversa ${conversations.length + 1}`,
          description: "Nova conversa com o consultor"
        }
      });
      
      console.log("✅ Conversa criada:", newConv.id);
      
      // ✅ Adicionar no início da lista (mais recente primeiro)
      setConversations([newConv, ...conversations]);
      setCurrentConversation(newConv);
      setMessages([]);
    } catch (error) {
      console.error("Erro ao criar conversa:", error);
      alert("Erro ao criar nova conversa. Tente novamente.");
    }
  };

  const deleteConversation = async (convId) => {
    if (!confirm("Tem certeza que deseja excluir esta conversa?")) return;
    
    try {
      console.log("🗑️ Excluindo conversa:", convId);
      
      // ✅ Trocar para outra conversa antes de deletar
      if (currentConversation?.id === convId) {
        const otherConv = conversations.find(c => c.id !== convId);
        if (otherConv) {
          setCurrentConversation(otherConv);
          setMessages(otherConv.messages || []);
        } else {
          setCurrentConversation(null);
          setMessages([]);
        }
      }
      
      // ✅ Remover da lista localmente (imediato)
      setConversations(conversations.filter(c => c.id !== convId));

      // Asynchronous deletion from backend
      base44.agents.deleteConversation(convId).then(() => {
        console.log("✅ Conversa excluída no backend:", convId);
      }).catch(err => {
        console.error("Erro ao excluir conversa no backend:", err);
        alert("Erro ao excluir conversa no backend. Por favor, recarregue a página.");
        // Re-add conversation to list if backend deletion fails, or refresh to reflect true state
        loadConversationsInBackground();
      });
      
    } catch (error) {
      console.error("Erro ao excluir conversa:", error);
      alert("Erro ao excluir conversa. Tente novamente.");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !currentConversation) return;
    
    setIsSending(true);
    try {
      console.log("📤 Enviando mensagem...");
      
      await base44.agents.addMessage(currentConversation, {
        role: "user",
        content: inputMessage
      });
      
      setInputMessage("");
      console.log("✅ Mensagem enviada");
      
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  };

  // ✅ Gerar relatório com IA usando dados reais
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    
    if (!reportPrompt.trim()) {
      alert("Por favor, descreva o relatório que deseja gerar");
      return;
    }

    setIsGeneratingReport(true);
    setReportResult(null);

    try {
      console.log("🤖 Gerando relatório com IA...");
      
      // ✅ BUSCAR DADOS REAIS DO USUÁRIO
      console.log("📊 Buscando dados financeiros...");
      const { Transaction } = await import("@/entities/Transaction");
      const { Account } = await import("@/entities/Account");
      const { Category } = await import("@/entities/Category");
      const { Goal } = await import("@/entities/Goal");
      
      const [transactions, accounts, categories, goals] = await Promise.all([
        Transaction.list("-date", 100),
        Account.list(),
        Category.list(),
        Goal.list()
      ]);

      console.log(`✅ Dados carregados: ${transactions.length} transações, ${accounts.length} contas`);

      // ✅ CALCULAR RESUMO FINANCEIRO
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthTransactions = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === currentMonth && 
               txDate.getFullYear() === currentYear &&
               t.status === "completed";
      });

      const totalIncome = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

      // ✅ AGRUPAR GASTOS POR CATEGORIA
      const expensesByCategory = {};
      monthTransactions
        .filter(t => t.type === "expense")
        .forEach(t => {
          const cat = categories.find(c => c.id === t.category_id);
          const catName = cat?.name || "Sem categoria";
          expensesByCategory[catName] = (expensesByCategory[catName] || 0) + t.amount;
        });

      // ✅ TOP 5 CATEGORIAS DE GASTOS
      const topExpenses = Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, val]) => `  - ${cat}: R$ ${val.toFixed(2)}`);

      // ✅ PROGRESSO DAS METAS
      const activeGoals = goals.filter(g => g.status === "active");
      const goalsProgress = activeGoals.map(g => {
        const progress = ((g.current_amount / g.target_amount) * 100).toFixed(1);
        return `  - ${g.title}: ${progress}% (R$ ${g.current_amount.toFixed(2)} de R$ ${g.target_amount.toFixed(2)})`;
      });

      // ✅ MONTAR CONTEXTO FINANCEIRO
      const financialContext = `
📊 DADOS FINANCEIROS DO USUÁRIO (Mês Atual):

💰 RESUMO GERAL:
- Saldo Total nas Contas: R$ ${totalBalance.toFixed(2)}
- Receitas do Mês: R$ ${totalIncome.toFixed(2)}
- Despesas do Mês: R$ ${totalExpense.toFixed(2)}
- Saldo do Mês: R$ ${(totalIncome - totalExpense).toFixed(2)}

📈 CONTAS CADASTRADAS (${accounts.length}):
${accounts.map(a => `  - ${a.name}: R$ ${a.balance.toFixed(2)}`).join('\n')}

💸 TOP 5 CATEGORIAS DE GASTOS:
${topExpenses.length > 0 ? topExpenses.join('\n') : '  - Nenhum gasto registrado'}

🎯 METAS FINANCEIRAS (${activeGoals.length} ativas):
${goalsProgress.length > 0 ? goalsProgress.join('\n') : '  - Nenhuma meta ativa'}

📝 ÚLTIMAS TRANSAÇÕES (${Math.min(10, monthTransactions.length)}):
${monthTransactions.slice(0, 10).map(t => 
  `  - ${t.description}: ${t.type === 'income' ? '+' : '-'}R$ ${t.amount.toFixed(2)} (${new Date(t.date).toLocaleDateString('pt-BR')})`
).join('\n')}
`;

      console.log("📋 Contexto financeiro preparado");

      // ✅ CHAMAR IA COM DADOS REAIS E FORMATAÇÃO LIMPA
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um consultor financeiro especializado. Analise os dados financeiros reais do usuário abaixo e gere um relatório profissional sobre: ${reportPrompt}

${financialContext}

📊 INSTRUÇÕES DE FORMATAÇÃO:
1. Use APENAS os dados reais fornecidos acima. NÃO invente informações.
2. NÃO use markdown (**, ###, __, etc). Use apenas texto simples.
3. Para títulos de seção, comece com um emoji relevante, seguido do título (ex: "💰 Resumo Financeiro" ou "💸 Análise de Gastos").
4. Para subtítulos ou itens de lista, use apenas números + texto (ex: "1. Análise Geral" ou "  - Recomendações").
5. Mantenha uma estrutura limpa, direta e profissional.
6. Use emojis estrategicamente para destacar e tornar as seções mais visuais, mas sem exageros.
7. O relatório deve ser objetivo e focado em insights acionáveis e recomendações práticas.

📝 ESTRUTURA SUGERIDA:
- Inicie com um título principal usando emoji (ex: "⭐ Relatório Financeiro Personalizado")
- Apresente uma breve análise geral dos dados.
- Use subtítulos com emojis para as seções principais (ex: "📈 Visão Detalhada das Contas", "💸 Padrões de Gasto").
- Dentro das seções, liste insights específicos de forma numerada ou com marcadores simples.
- Forneça recomendações práticas e personalizadas, também de forma listada (ex: "💡 Recomendações para Economia").
- Finalize com uma conclusão motivadora ou um resumo conciso.

Por favor, gere um relatório detalhado, profissional e bem formatado, seguindo estritamente as instruções de formatação.`,
        add_context_from_internet: false
      });

      console.log("✅ Relatório gerado com dados reais");
      
      setReportResult({
        content: response,
        generatedAt: new Date().toLocaleString('pt-BR')
      });

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const whatsappUrl = base44.agents.getWhatsAppConnectURL('consultor_financeiro');

  // ✅ Mostrar loading apenas enquanto carrega o usuário (rápido)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          <p className="text-purple-300">Carregando Consultor IA...</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard pageName="Consultor">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-2xl px-6 py-4 mb-4">
              <Sparkles className="w-10 h-10 text-yellow-400" />
              <div className="text-left">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Consultor IA
                </h1>
                <p className="text-purple-300">Seu assistente financeiro inteligente</p>
              </div>
            </div>
          </div>

          {/* ✅ Tabs para Chat e Relatórios */}
          <Card className="glass-card border-0 neon-glow">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-purple-900/20 w-full grid grid-cols-2 gap-2 p-2">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat com Consultor
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Relatórios IA
                </TabsTrigger>
              </TabsList>

              {/* ✅ ABA CHAT */}
              <TabsContent value="chat" className="mt-0">
                <div className="grid md:grid-cols-4 gap-4 p-4">
                  {/* Sidebar - Conversas */}
                  <div className="md:col-span-1 space-y-3">
                    <Button
                      onClick={createNewConversation}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Conversa
                    </Button>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        💬 WhatsApp
                      </Button>
                    </a>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {conversations.length === 0 ? (
                        <div className="text-center py-8 text-purple-400 text-sm">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          Nenhuma conversa ainda
                        </div>
                      ) : (
                        conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className={`p-3 rounded-lg glass-card cursor-pointer transition-all ${
                              currentConversation?.id === conv.id
                                ? 'border-2 border-purple-500'
                                : 'hover:border border-purple-700/50'
                            }`}
                            onClick={() => {
                              setCurrentConversation(conv);
                              setMessages(conv.messages || []);
                            }}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {conv.metadata?.name || `Conversa ${conversations.indexOf(conv) + 1}`}
                                </p>
                                <p className="text-purple-400 text-xs">
                                  {conv.messages?.length || 0} mensagens
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversation(conv.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="md:col-span-3 flex flex-col h-[600px] glass-card rounded-xl">
                    {!currentConversation ? (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <Sparkles className="w-16 h-16 text-purple-400 mx-auto" />
                          <p className="text-purple-300">Selecione ou crie uma conversa para começar</p>
                          <Button
                            onClick={createNewConversation}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 mt-4"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Iniciar Nova Conversa
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          <AnimatePresence>
                            {messages.map((msg, idx) => (
                              <MessageBubble key={idx} message={msg} />
                            ))}
                          </AnimatePresence>
                        </div>

                        {/* Input */}
                        <form onSubmit={sendMessage} className="p-4 border-t border-purple-900/30">
                          <div className="flex gap-2">
                            <Input
                              value={inputMessage}
                              onChange={(e) => setInputMessage(e.target.value)}
                              placeholder="Digite sua pergunta..."
                              className="flex-1 bg-purple-900/20 border-purple-700/50 text-white"
                              disabled={isSending}
                            />
                            <Button
                              type="submit"
                              disabled={isSending || !inputMessage.trim()}
                              className="bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                              {isSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ✅ NOVA ABA: RELATÓRIOS IA */}
              <TabsContent value="reports" className="mt-0">
                <div className="p-6 space-y-8">
                  {/* Header com Visual Melhorado */}
                  <div className="text-center space-y-4">
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 border border-purple-500/30">
                      <BarChart className="w-16 h-16 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Relatórios Inteligentes
                      </h2>
                      <p className="text-purple-300 text-lg mt-2">
                        Gere análises financeiras detalhadas com IA
                      </p>
                    </div>
                  </div>

                  {/* Sugestões de Relatórios com Visual Melhorado */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-xl font-bold text-white">Modelos Prontos</h3>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { 
                          title: "Análise de Gastos", 
                          prompt: "Analise meus gastos do último mês e sugira onde posso economizar",
                          icon: "💸",
                          gradient: "from-red-500 to-orange-500",
                          bgGradient: "from-red-600/10 to-orange-600/10"
                        },
                        { 
                          title: "Projeção de Economia", 
                          prompt: "Faça uma projeção de quanto posso economizar nos próximos 6 meses",
                          icon: "📈",
                          gradient: "from-green-500 to-emerald-500",
                          bgGradient: "from-green-600/10 to-emerald-600/10"
                        },
                        { 
                          title: "Análise de Receitas", 
                          prompt: "Analise minhas fontes de receita e sugira otimizações",
                          icon: "💰",
                          gradient: "from-blue-500 to-cyan-500",
                          bgGradient: "from-blue-600/10 to-cyan-600/10"
                        },
                        { 
                          title: "Saúde Financeira", 
                          prompt: "Avalie minha saúde financeira geral e dê recomendações",
                          icon: "❤️",
                          gradient: "from-pink-500 to-rose-500",
                          bgGradient: "from-pink-600/10 to-rose-600/10"
                        },
                        { 
                          title: "Comparativo Mensal", 
                          prompt: "Compare meus gastos dos últimos 3 meses e identifique tendências",
                          icon: "📊",
                          gradient: "from-purple-500 to-indigo-500",
                          bgGradient: "from-purple-600/10 to-indigo-600/10"
                        },
                        { 
                          title: "Metas Financeiras", 
                          prompt: "Analise meu progresso nas metas financeiras e dê conselhos",
                          icon: "🎯",
                          gradient: "from-yellow-500 to-amber-500",
                          bgGradient: "from-yellow-600/10 to-amber-600/10"
                        }
                      ].map((suggestion, index) => (
                        <motion.div
                          key={suggestion.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <button
                            onClick={() => setReportPrompt(suggestion.prompt)}
                            className={`w-full h-full p-6 rounded-xl bg-gradient-to-br ${suggestion.bgGradient} border border-purple-700/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 text-left group`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`text-4xl p-3 rounded-xl bg-gradient-to-br ${suggestion.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                {suggestion.icon}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-white text-lg mb-2 group-hover:text-purple-300 transition-colors">
                                  {suggestion.title}
                                </h4>
                                <p className="text-sm text-purple-400 leading-relaxed">
                                  {suggestion.prompt}
                                </p>
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Formulário Personalizado */}
                  <div className="glass-card rounded-xl p-6 border border-purple-700/30">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-xl font-bold text-white">Ou crie seu próprio relatório</h3>
                    </div>
                    
                    <form onSubmit={handleGenerateReport} className="space-y-4">
                      <div>
                        <label className="text-purple-200 text-sm font-medium mb-2 block">
                          Descreva o relatório que deseja gerar
                        </label>
                        <textarea
                          value={reportPrompt}
                          onChange={(e) => setReportPrompt(e.target.value)}
                          placeholder="Ex: Analise meus gastos com alimentação nos últimos 3 meses e sugira formas de economizar..."
                          className="w-full h-32 bg-purple-900/30 border-2 border-purple-700/50 rounded-xl p-4 text-white placeholder-purple-400/50 resize-none focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                          disabled={isGeneratingReport}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isGeneratingReport || !reportPrompt.trim()}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                      >
                        {isGeneratingReport ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Gerando seu relatório...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Gerar Relatório Personalizado
                          </>
                        )}
                      </Button>
                    </form>
                  </div>

                  {/* Resultado do Relatório com Visual Melhorado */}
                  {reportResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card rounded-xl p-6 md:p-8 space-y-6 border-2 border-green-500/30 shadow-2xl shadow-green-500/20"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">Relatório Gerado</h3>
                            <p className="text-sm text-green-400 mt-1">✅ {reportResult.generatedAt}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-700/30">
                        <div className="prose prose-invert max-w-none">
                          <div className="text-purple-100 whitespace-pre-wrap leading-relaxed text-base">
                            {reportResult.content}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 h-12 border-2 border-purple-700 text-purple-300 hover:bg-purple-900/30 hover:border-purple-500 transition-all"
                          onClick={() => {
                            const text = `Relatório Gerado em ${reportResult.generatedAt}\n\n${reportResult.content}`;
                            navigator.clipboard.writeText(text);
                            alert("📋 Relatório copiado para área de transferência!");
                          }}
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copiar Relatório
                        </Button>
                        <Button
                          className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => {
                            setReportResult(null);
                            setReportPrompt("");
                          }}
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Gerar Novo Relatório
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </FeatureGuard>
  );
}