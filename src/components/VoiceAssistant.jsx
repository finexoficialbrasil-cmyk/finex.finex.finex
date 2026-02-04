import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Transaction } from "@/entities/Transaction";
import { Bill } from "@/entities/Bill";
import { Account } from "@/entities/Account";
import { Category } from "@/entities/Category";
import { SystemCategory } from "@/entities/SystemCategory";
import { Mic, MicOff, Sparkles, Loader2, Check, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from 'date-fns';

// ✅ NOVA FUNÇÃO: Obter data atual no timezone do Brasil
const getBrazilDate = () => {
  const now = new Date();
  // Converter para timezone de Brasília (UTC-3)
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  const formattedDate = `${year}-${month}-${day}`;
  
  console.log(`📅 getBrazilDate():`, {
    input: now.toString(),
    brazilTime: brazilTime.toString(),
    formatted: formattedDate
  });
  
  return formattedDate;
};

export default function VoiceAssistant({ onSuccess }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [voiceSupported, setVoiceSupported] = useState(true);
  
  // ✅ Cache de dados para evitar múltiplas chamadas
  const [cachedAccounts, setCachedAccounts] = useState([]);
  const [cachedCategories, setCachedCategories] = useState([]);
  const [isPreloading, setIsPreloading] = useState(false); // New state for preloading status

  useEffect(() => {
    initializeVoiceRecognition();
    preloadData(); // ✅ Carregar dados antecipadamente
  }, []);

  // ✅ OTIMIZADO: Pré-carregar dados COM LIMITE e retry
  const preloadData = async () => {
    if (isPreloading) return; // Evitar múltiplas chamadas
    
    setIsPreloading(true);
    try {
      console.log("🔄 Pré-carregando dados para comando de voz...");
      
      // ✅ Carregar com LIMITE e timeout menor
      const [accounts, userCategories] = await Promise.all([
        Account.list("-created_date", 50), // ✅ LIMITE de 50
        Category.list("-created_date", 100) // ✅ LIMITE de 100
      ]);

      // ✅ Tentar carregar SystemCategory com timeout
      let systemCategories = [];
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: SystemCategory list took too long')), 5000)
        );
        const sysCatResult = await Promise.race([
          SystemCategory.list("-created_date", 50),
          timeoutPromise
        ]);
        if (sysCatResult instanceof Array) {
          systemCategories = sysCatResult;
        } else {
           console.warn("⚠️ SystemCategory list returned unexpected type, treating as empty.");
        }
      } catch (err) {
        console.warn("⚠️ SystemCategory não carregou (ou timeout), usando apenas categorias do usuário:", err.message);
      }

      setCachedAccounts(accounts);
      setCachedCategories([...systemCategories, ...userCategories]);
      console.log(`✅ Cache pronto: ${accounts.length} contas, ${systemCategories.length + userCategories.length} categorias`);
    } catch (error) {
      console.error("⚠️ Erro ao pré-carregar dados:", error);
      // Não bloquear o app, apenas não terá cache
    } finally {
      setIsPreloading(false);
    }
  };

  const initializeVoiceRecognition = () => {
    console.log("🎤 Inicializando reconhecimento de voz...");

    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        try {
          const recognitionInstance = new SpeechRecognition();
          
          recognitionInstance.continuous = false;
          recognitionInstance.interimResults = true;
          recognitionInstance.lang = 'pt-BR';
          recognitionInstance.maxAlternatives = 1;

          recognitionInstance.onstart = () => {
            console.log("✅ Reconhecimento iniciado");
            setIsListening(true);
            setError(null);
          };

          recognitionInstance.onresult = (event) => {
            const current = event.resultIndex;
            const transcriptText = event.results[current][0].transcript;
            setTranscript(transcriptText);

            if (event.results[current].isFinal) {
              console.log("✅ Transcrição final:", transcriptText);
              processVoiceCommand(transcriptText);
            }
          };

          recognitionInstance.onerror = (event) => {
            console.error('❌ Erro no reconhecimento:', event.error);
            
            let errorMessage = "Erro ao reconhecer voz. ";
            
            switch(event.error) {
              case 'no-speech':
                errorMessage = "Nenhuma fala detectada. Tente novamente.";
                break;
              case 'audio-capture':
                errorMessage = "Microfone não encontrado. Verifique suas permissões.";
                break;
              case 'not-allowed':
                errorMessage = "Permissão negada. Permita o acesso ao microfone.";
                break;
              case 'network':
                errorMessage = "Erro de conexão. Verifique sua internet.";
                break;
              case 'aborted':
                errorMessage = "Reconhecimento cancelado.";
                break;
              default:
                errorMessage = `Erro: ${event.error}. Tente novamente.`;
            }
            
            setError(errorMessage);
            setIsListening(false);
          };

          recognitionInstance.onend = () => {
            console.log("⏹️ Reconhecimento finalizado");
            setIsListening(false);
          };

          setRecognition(recognitionInstance);
          setVoiceSupported(true);
          console.log("✅ Reconhecimento de voz configurado com sucesso!");
        } catch (err) {
          console.error("❌ Erro ao criar instância:", err);
          setVoiceSupported(false);
          setError("Não foi possível inicializar o reconhecimento de voz.");
        }
      } else {
        console.warn("⚠️ Reconhecimento de voz não suportado neste navegador");
        setVoiceSupported(false);
        setError("Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Opera.");
      }
    }
  };

  const startListening = () => {
    console.log("🎙️ Tentando iniciar escuta...");
    
    if (!recognition) {
      console.log("⚠️ Recognition não existe, tentando reinicializar...");
      initializeVoiceRecognition();
      
      setTimeout(() => {
        if (recognition) {
          startListening();
        } else {
          setError("Reconhecimento de voz não disponível. Recarregue a página.");
        }
      }, 1000);
      return;
    }

    setTranscript("");
    setResult(null);
    setError(null);
    
    try {
      recognition.start();
      console.log("✅ recognition.start() chamado");
      setIsListening(true);
    } catch (err) {
      console.error("❌ Erro ao iniciar reconhecimento:", err);
      
      if (err.message && err.message.includes('already started')) {
        setError("Reconhecimento já está ativo. Aguarde...");
      } else {
        setError("Erro ao iniciar. Verifique permissões do microfone.");
      }
      
      setIsListening(false);
    }
  };

  const stopListening = () => {
    console.log("🛑 Parando reconhecimento...");
    if (recognition) {
      try {
        recognition.stop();
        setIsListening(false);
      } catch (err) {
        console.error("❌ Erro ao parar reconhecimento:", err);
      }
    }
  };

  const processVoiceCommand = async (text) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log("🎤 Processando comando de voz:", text);
      
      // ✅ Usar dados em cache
      let accounts = cachedAccounts;
      let allCategories = cachedCategories;

      // ✅ Se cache vazio, recarregar COM LIMITES
      if (accounts.length === 0 || allCategories.length === 0) {
        console.log("⚠️ Cache vazio, recarregando com limites...");
        try {
          const [accountsData, userCats] = await Promise.all([
            Account.list("-created_date", 50),
            Category.list("-created_date", 100)
          ]);
          
          let sysCats = [];
          try {
            sysCats = await SystemCategory.list("-created_date", 50);
          } catch (err) {
            console.warn("⚠️ SystemCategory não disponível, usando apenas categorias do usuário durante reload.");
          }
          
          accounts = accountsData;
          allCategories = [...sysCats, ...userCats];
          setCachedAccounts(accountsData);
          setCachedCategories(allCategories);
        } catch (error) {
          console.error("❌ Erro ao carregar dados:", error);
          setError("Erro ao carregar dados. Tente novamente.");
          setIsProcessing(false);
          return;
        }
      }

      if (accounts.length === 0) {
        setError("Você precisa criar pelo menos uma conta antes de usar comandos de voz.");
        setIsProcessing(false);
        return;
      }

      // 🚀 NOVO: Parsing LOCAL super rápido (sem IA)
      const localParsing = parseCommandLocally(text, allCategories);
      
      let aiResponse;
      
      if (localParsing.confidence === 'high') {
        console.log("⚡ Parsing LOCAL (instantâneo):", localParsing);
        aiResponse = localParsing;
      } else {
        console.log("🤖 Usando IA para parsing complexo...");
        // Só usar IA se parsing local falhou
        aiResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Comando: "${text}"

CATEGORIAS: ${allCategories.slice(0, 10).map(c => `${c.name}(${c.id})`).join(',')}

Extrair: action, type, amount, description, date, category_id`,
          response_json_schema: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["transacao", "conta_pagar", "conta_receber"] },
              type: { type: "string", enum: ["income", "expense"] },
              amount: { type: "number" },
              description: { type: "string" },
              date: { type: "string" },
              category_id: { type: "string" }
            }
          }
        });
      }

      // ✅ USAR FUNÇÃO CORRIGIDA
      const todayDate = getBrazilDate();
      
      if (!aiResponse.date) aiResponse.date = todayDate;

      // ✅ Categoria
      let category = allCategories.find(c => c.id === aiResponse.category_id);
      if (!category) {
        const categoriesOfType = allCategories.filter(c => c.type === aiResponse.type);
        category = categoriesOfType[0] || allCategories[0];
      }

      const defaultAccount = accounts[0];
      const oldBalance = defaultAccount.balance;

      if (aiResponse.action === "transacao") {
        const newBalance = aiResponse.type === "income" 
          ? oldBalance + aiResponse.amount
          : oldBalance - aiResponse.amount;

        console.log("💰 Criando transação com data:", aiResponse.date);

        await Promise.all([
          Transaction.create({
            description: aiResponse.description,
            amount: parseFloat(aiResponse.amount),
            type: aiResponse.type,
            category_id: category?.id || null,
            account_id: defaultAccount.id,
            date: aiResponse.date, // Use the determined date here
            status: "completed",
            notes: `Criado por comando de voz: "${text}"`
          }),
          Account.update(defaultAccount.id, {
            name: defaultAccount.name,
            type: defaultAccount.type,
            balance: parseFloat(newBalance.toFixed(2)),
            currency: defaultAccount.currency || "BRL",
            is_active: defaultAccount.is_active !== false,
            color: defaultAccount.color || "#a855f7"
          })
        ]);

        console.log("✅ Transação criada com data:", aiResponse.date);

        setResult({
          type: "success",
          feedbackCategory: "transaction",
          data: {
            transaction_type: aiResponse.type,
            amount: aiResponse.amount,
            description: aiResponse.description,
            category: category,
            account: defaultAccount,
            date: aiResponse.date, // Use the determined date here
            oldBalance: oldBalance,
            newBalance: newBalance,
            transaction_id: 'criada'
          }
        });

      } else if (aiResponse.action === "conta_pagar" || aiResponse.action === "conta_receber") {
        console.log("📋 Criando conta...");

        await Bill.create({
          description: aiResponse.description,
          amount: aiResponse.amount,
          type: aiResponse.action === "conta_pagar" ? "payable" : "receivable",
          category_id: category?.id || null,
          account_id: defaultAccount.id,
          due_date: aiResponse.date, // Use the determined date here
          status: "pending",
          notes: `Criado por comando de voz: "${text}"`
        });

        console.log("✅ Conta criada!");

        setResult({
          type: "success",
          feedbackCategory: "bill",
          data: {
            bill_type: aiResponse.action === "conta_pagar" ? "payable" : "receivable",
            amount: aiResponse.amount,
            description: aiResponse.description,
            category: category,
            account: defaultAccount,
            due_date: aiResponse.date, // Use the determined date here
            status: "pending",
            bill_id: 'criada'
          }
        });
      }

    } catch (error) {
      console.error('❌ Erro:', error);
      setError("Não consegui processar o comando. Tente novamente.");
    }

    setIsProcessing(false);
  };

  // 🚀 NOVO: Parsing local super rápido (sem IA)
  const parseCommandLocally = (text, categories) => {
    const lowerText = text.toLowerCase();
    
    // ✅ MELHORADO: Extrair valor com suporte para milhares
    // Exemplos: "2.800" → 2800, "2800" → 2800, "2,80" → 2.80, "50" → 50
    const amountMatch = text.match(/\d+(?:[.,]\d+)*/);
    if (!amountMatch) {
      return { confidence: 'low' };
    }
    
    let amountStr = amountMatch[0];
    let amount;
    
    // ✅ Detectar formato brasileiro vs internacional
    if (amountStr.includes('.') && amountStr.includes(',')) {
      // Ex: "1.234,56" → remover ponto, trocar vírgula por ponto
      amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
    } else if (amountStr.includes(',')) {
      // Pode ser decimal "2,80" ou milhar "2,800"
      const parts = amountStr.split(',');
      if (parts[1] && parts[1].length <= 2) {
        // É decimal: "2,80" → 2.80
        amount = parseFloat(amountStr.replace(',', '.'));
      } else {
        // É milhar: "2,800" → 2800
        amount = parseFloat(amountStr.replace(',', ''));
      }
    } else if (amountStr.includes('.')) {
      // Pode ser decimal "2.80" ou milhar "2.800"
      const parts = amountStr.split('.');
      if (parts[1] && parts[1].length <= 2) {
        // É decimal: "2.80" → 2.80
        amount = parseFloat(amountStr);
      } else {
        // É milhar: "2.800" → 2800
        amount = parseFloat(amountStr.replace(/\./g, ''));
      }
    } else {
      // Número inteiro simples: "2800" → 2800
      amount = parseFloat(amountStr);
    }

    console.log(`💰 Valor extraído: "${amountStr}" → ${amount}`);

    // Detectar tipo e ação
    let type = 'expense';
    let action = 'transacao';
    
    // Palavras-chave para ENTRADA
    if (/recebi|ganhei|salário|pagamento|receber|entrada/.test(lowerText)) {
      type = 'income';
    }
    
    // Palavras-chave para SAÍDA
    if (/gastei|paguei|comprei|despesa|saída/.test(lowerText)) {
      type = 'expense';
    }

    // Detectar contas a pagar/receber
    if (/vou pagar|tenho que pagar|pagar dia/.test(lowerText)) {
      action = 'conta_pagar';
      type = 'expense';
    }
    
    if (/vou receber|tenho a receber|receber dia/.test(lowerText)) {
      action = 'conta_receber';
      type = 'income';
    }

    // Extrair descrição (remover valor e palavras-chave)
    let description = text
      .replace(/recebi|ganhei|gastei|paguei|comprei|r\$|\d+(?:[.,]\d+)*|reais?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!description || description.length < 3) {
      description = type === 'income' ? 'Entrada' : 'Saída';
    }

    // Detectar categoria por palavras-chave
    let category_id = null;
    const categoryKeywords = {
      'mercado|supermercado|alimentação|comida|food|restaurante|lanche': 'alimentação',
      'gasolina|combustível|uber|99|transporte|ônibus|metrô': 'transporte',
      'aluguel|condomínio|luz|água|energia|conta|moradia': 'moradia',
      'salário|pagamento|freelance|trabalho': 'salário',
      'farmácia|remédio|médico|hospital|saúde|plano': 'saúde',
      'netflix|spotify|cinema|lazer|entretenimento': 'lazer',
      'roupa|sapato|shopping|vestuário': 'vestuário'
    };

    for (const [keywords, categoryName] of Object.entries(categoryKeywords)) {
      const regex = new RegExp(keywords, 'i');
      if (regex.test(lowerText)) {
        const foundCat = categories.find(c => 
          c.name.toLowerCase().includes(categoryName) && c.type === type
        );
        if (foundCat) {
          category_id = foundCat.id;
          break;
        }
      }
    }

    // Se não encontrou categoria, usar primeira do tipo
    if (!category_id) {
      const firstCat = categories.find(c => c.type === type);
      if (firstCat) category_id = firstCat.id;
    }

    // ✅ USAR FUNÇÃO CORRIGIDA
    const todayDate = getBrazilDate();

    return {
      confidence: 'high',
      action,
      type,
      amount,
      description,
      date: todayDate,
      category_id
    };
  };

  const handleCloseResult = () => {
    console.log("✅ Fechando modal e atualizando dados...");
    setResult(null);
    
    if (onSuccess) {
      console.log("🔄 Chamando onSuccess() para atualizar dashboard...");
      onSuccess();
    }
  };

  // ✅ NOVA FUNÇÃO: Formatar data sem conversão de timezone
  const formatDateWithoutTimezone = (dateString) => {
    if (!dateString) return '-';
    // Split "2025-11-07" → ["2025", "11", "07"]
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {(isListening || isProcessing || result || error) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 mr-2"
          >
            <Card className="glass-card border-purple-700/50 neon-glow w-80 max-w-[calc(100vw-3rem)]">
              <CardContent className="p-4">
                {isListening && (
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"
                    >
                      <Mic className="w-8 h-8 text-white" />
                    </motion.div>
                    <p className="text-white font-medium mb-2">Estou ouvindo...</p>
                    {transcript && (
                      <p className="text-purple-300 text-sm italic">"{transcript}"</p>
                    )}
                  </div>
                )}

                {isProcessing && (
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-3 text-cyan-400 animate-spin" />
                    <p className="text-white font-medium mb-2">Processando...</p>
                    <p className="text-purple-300 text-sm">"{transcript}"</p>
                  </div>
                )}

                {result && result.type === "success" && result.feedbackCategory === "transaction" && (
                  <div className="text-center max-h-[70vh] overflow-y-auto">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${
                        result.data.transaction_type === "income" 
                          ? "from-green-600 to-emerald-600" 
                          : "from-red-600 to-orange-600"
                      } flex items-center justify-center`}
                    >
                      <Check className="w-8 h-8 text-white" />
                    </motion.div>

                    <p className="text-white font-semibold mb-1 text-lg">
                      {result.data.transaction_type === "income" ? "💰 Entrada" : "💸 Saída"} Lançada!
                    </p>
                    <p className="text-cyan-400 text-xs mb-3">✓ Já está no seu sistema</p>

                    <div className="space-y-2 text-sm text-left bg-purple-900/20 rounded-lg p-4">
                      <div className="flex justify-between items-center pb-2 border-b border-purple-700/30">
                        <span className="text-purple-300">Valor:</span>
                        <span className={`font-bold text-lg ${
                          result.data.transaction_type === "income" ? "text-green-400" : "text-red-400"
                        }`}>
                          {result.data.transaction_type === "income" ? "+" : "-"} R$ {result.data.amount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-start pb-2 border-b border-purple-700/30">
                        <span className="text-purple-300">Descrição:</span>
                        <span className="text-white text-right max-w-[60%]">{result.data.description}</span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-purple-700/30">
                        <span className="text-purple-300">Categoria:</span>
                        <Badge style={{ 
                          backgroundColor: result.data.category?.color + '30', 
                          color: result.data.category?.color 
                        }}>
                          {result.data.category?.name || "Sem categoria"}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-purple-700/30">
                        <span className="text-purple-300">Conta:</span>
                        <span className="text-white">{result.data.account?.name || "Não definida"}</span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-purple-700/30">
                        <span className="text-purple-300">Data:</span>
                        <span className="text-white">{formatDateWithoutTimezone(result.data.date)}</span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-purple-700/30">
                        <span className="text-purple-300">Saldo Anterior:</span>
                        <span className="text-purple-400">R$ {result.data.oldBalance.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center pb-2">
                        <span className="text-purple-300 font-bold">Novo Saldo:</span>
                        <span className={`font-bold text-lg ${
                          result.data.newBalance >= result.data.oldBalance ? "text-green-400" : "text-yellow-400"
                        }`}>
                          R$ {result.data.newBalance.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleCloseResult}
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      OK, Entendi!
                    </Button>
                  </div>
                )}

                {result && result.type === "success" && result.feedbackCategory === "bill" && (
                  <div className="text-center max-h-[70vh] overflow-y-auto">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center"
                    >
                      <Check className="w-8 h-8 text-white" />
                    </motion.div>

                    <p className="text-white font-semibold mb-1 text-lg">
                      📋 {result.data.bill_type === "payable" ? "Conta a Pagar" : "Conta a Receber"} Criada!
                    </p>
                    <p className="text-purple-400 text-xs mb-3">✓ Já está agendada</p>

                    <div className="space-y-2 text-sm text-left bg-purple-900/20 rounded-lg p-4">
                      <div className="flex justify-between items-center pb-2 border-b border-purple-700/30">
                        <span className="text-purple-300">Valor:</span>
                        <span className="text-white font-bold">R$ {result.data.amount.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-start pb-2 border-b border-purple-700/30">
                        <span className="text-purple-300">Descrição:</span>
                        <span className="text-white text-right max-w-[60%]">{result.data.description}</span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-purple-700/30">
                        <span className="text-purple-300">Categoria:</span>
                        <Badge style={{ backgroundColor: result.data.category?.color + '30', color: result.data.category?.color }}>
                          {result.data.category?.name || "Sem categoria"}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-purple-700/30">
                        <span className="text-purple-300">Vencimento:</span>
                        <span className="text-white">{formatDateWithoutTimezone(result.data.due_date)}</span>
                      </div>

                      <div className="flex justify-between items-center pb-2">
                        <span className="text-purple-300">Status:</span>
                        <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/40">PENDENTE</Badge>
                      </div>

                      <p className="text-[10px] text-purple-400 text-center pt-2">ℹ️ Não afeta o saldo até ser paga/recebida</p>
                    </div>

                    <Button
                      onClick={handleCloseResult}
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      OK, Entendi!
                    </Button>
                  </div>
                )}

                {error && (
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center"
                    >
                      {voiceSupported ? <X className="w-8 h-8 text-white" /> : <AlertCircle className="w-8 h-8 text-white" />}
                    </motion.div>
                    <p className="text-red-400 font-medium mb-2">Ops!</p>
                    <p className="text-purple-300 text-sm mb-3">{error}</p>
                    <Button
                      onClick={() => {
                        setError(null);
                        if (!voiceSupported) {
                          initializeVoiceRecognition();
                        }
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`w-16 h-16 rounded-full shadow-2xl ${
            isListening 
              ? 'bg-gradient-to-br from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 animate-pulse' 
              : 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
          } neon-glow`}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8" />
          ) : isListening ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>
      </motion.div>

      {!isListening && !isProcessing && !result && !error && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-20 top-1/2 -translate-y-1/2 whitespace-nowrap"
        >
          <Badge className="bg-purple-900/90 text-white border-purple-700">
            <Sparkles className="w-3 h-3 mr-1" />
            Fale comigo!
          </Badge>
        </motion.div>
      )}
    </div>
  );
}