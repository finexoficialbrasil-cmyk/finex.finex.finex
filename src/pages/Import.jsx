
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Transaction } from "@/entities/Transaction";
import { Account } from "@/entities/Account";
import { Category } from "@/entities/Category";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FeatureGuard from "../components/FeatureGuard";

export default function Import() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [importResults, setImportResults] = useState(null);

  React.useEffect(() => {
    loadAccountsAndCategories();
  }, []);

  const loadAccountsAndCategories = async () => {
    try {
      const { SystemCategory } = await import("@/entities/SystemCategory");
      
      const [accs, userCats, sysCats] = await Promise.all([
        Account.list(),
        Category.list(),
        SystemCategory.list()
      ]);
      
      // Mesclar categorias do sistema com categorias do usuário
      const allCategories = [
        ...sysCats.map(c => ({ ...c, isSystem: true, id: c.id, name: c.name, type: c.type, color: c.color })), // Ensure all fields are present
        ...userCats.map(c => ({ ...c, isSystem: false, id: c.id, name: c.name, type: c.type, color: c.color }))
      ];
      
      console.log("📊 Categorias carregadas:", allCategories.length);
      
      setAccounts(accs);
      setCategories(allCategories);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsedData([]);
    setImportResults(null);

    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (extension === 'ofx') {
      setFileType('ofx');
    } else if (extension === 'csv') {
      setFileType('csv');
    } else if (extension === 'txt') {
      setFileType('txt');
    } else if (extension === 'pdf') {
      setFileType('pdf');
    } else {
      alert("❌ Formato não suportado! Use OFX, CSV, TXT ou PDF.");
      setFile(null);
    }
  };

  const handleUploadAndParse = async () => {
    if (!file || !selectedAccount) {
      alert("❌ Selecione um arquivo e uma conta!");
      return;
    }

    setIsUploading(true);
    setIsProcessing(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const response = await base44.functions.invoke('parseFinancialFile', {
        file_url,
        file_type: fileType,
        account_id: selectedAccount
      });

      if (response.data.status === 'error') {
        throw new Error(response.data.message);
      }

      setParsedData(response.data.transactions);
      
      const withCategory = response.data.transactions.filter(t => t.category_id).length;
      const total = response.data.transactions.length;
      
      alert(`✅ ${total} transações detectadas!\n🤖 ${withCategory} categorias identificadas automaticamente pela IA\n\n📝 Revise os dados antes de importar.`);

    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      alert(`❌ Erro ao processar arquivo: ${error.message}`);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      alert("❌ Nenhuma transação para importar!");
      return;
    }

    const missingCategory = parsedData.filter(tx => !tx.category_id);
    if (missingCategory.length > 0) {
      alert(`❌ ${missingCategory.length} transação(ões) sem categoria!\n\nPor favor, selecione uma categoria para todas as transações.`);
      return;
    }

    if (!confirm(`📥 CONFIRMAR IMPORTAÇÃO\n\n${parsedData.length} transações serão importadas.\n\nContinuar?`)) {
      return;
    }

    setIsProcessing(true);

    try {
      let success = 0;
      let errors = 0;

      for (const tx of parsedData) {
        try {
          await Transaction.create({
            description: tx.description,
            amount: Math.abs(tx.amount),
            type: tx.type,
            category_id: tx.category_id,
            account_id: selectedAccount,
            date: tx.date,
            status: "completed",
            notes: `Importado de ${fileType.toUpperCase()}`
          });
          success++;
        } catch (err) {
          console.error("Erro ao importar transação:", err);
          errors++;
        }
      }

      const account = accounts.find(a => a.id === selectedAccount);
      if (account) {
        const totalIncome = parsedData.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const totalExpense = parsedData.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const newBalance = account.balance + totalIncome - totalExpense;

        await Account.update(selectedAccount, { balance: newBalance });
      }

      setImportResults({ success, errors, total: parsedData.length });
      setParsedData([]);
      setFile(null);

      alert(`✅ IMPORTAÇÃO CONCLUÍDA!\n\n✔️ ${success} transações importadas\n${errors > 0 ? `❌ ${errors} erros` : ''}\n\n🔄 Recarregue a página para ver os dados.`);

    } catch (error) {
      console.error("Erro na importação:", error);
      alert(`❌ Erro na importação: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCategoryChange = (index, categoryId) => {
    const updated = [...parsedData];
    updated[index].category_id = categoryId;
    setParsedData(updated);
  };

  const handleRemoveTransaction = (index) => {
    const updated = parsedData.filter((_, i) => i !== index);
    setParsedData(updated);
  };

  return (
    <FeatureGuard pageName="Import">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 mb-4">
            <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Importar Transações
            </h1>
          </div>
          <p className="text-purple-300 text-lg">
            Importe suas transações de arquivos OFX, CSV, TXT ou PDF
          </p>
        </motion.div>

        <Card className="glass-card border-0 border-l-4 border-cyan-500">
          <CardContent className="p-6">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Formatos Suportados
            </h3>
            <div className="space-y-3 text-sm text-purple-300">
              <div className="p-3 rounded-lg bg-cyan-900/20 border border-cyan-700/30">
                <p className="font-semibold text-cyan-300">📄 OFX (Open Financial Exchange)</p>
                <p className="text-xs mt-1">Formato padrão dos bancos brasileiros. Exportado pelo Internet Banking.</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-700/30">
                <p className="font-semibold text-blue-300">📊 CSV (Comma-Separated Values)</p>
                <p className="text-xs mt-1">Planilhas Excel/Google Sheets. Colunas: data, descrição, valor, tipo</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-700/30">
                <p className="font-semibold text-purple-300">📝 TXT (Texto)</p>
                <p className="text-xs mt-1">Formato de texto simples. Uma transação por linha.</p>
              </div>
              <div className="p-3 rounded-lg bg-pink-900/20 border border-pink-700/30">
                <p className="font-semibold text-pink-300">📕 PDF (Portable Document Format)</p>
                <p className="text-xs mt-1">Extratos bancários em PDF. A IA extrai automaticamente os dados.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 neon-glow">
          <CardHeader className="border-b border-purple-900/30">
            <CardTitle className="text-white">1. Selecionar Arquivo e Conta</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-purple-200">Conta de Destino</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-2">
                  <SelectValue placeholder="Selecione a conta..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-purple-400 mt-1">
                As transações serão vinculadas a esta conta
              </p>
            </div>

            <div>
              <Label className="text-purple-200">Arquivo (.ofx, .csv, .txt, .pdf)</Label>
              <Input
                type="file"
                accept=".ofx,.csv,.txt,.pdf"
                onChange={handleFileChange}
                className="bg-purple-900/20 border-purple-700/50 text-white mt-2"
              />
              {file && (
                <p className="text-sm text-cyan-400 mt-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {file.name} ({fileType.toUpperCase()})
                </p>
              )}
            </div>

            <Button
              onClick={handleUploadAndParse}
              disabled={!file || !selectedAccount || isUploading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {fileType === 'pdf' ? 'Processando com IA...' : 'Analisando e categorizando com IA...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Carregar e Analisar com IA
                </>
              )}
            </Button>
            
            {fileType === 'pdf' && file && (
              <Alert className="bg-yellow-900/20 border-yellow-700/30">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-300 text-xs">
                  ⚡ PDFs são processados com IA. Pode levar alguns segundos extras.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {parsedData.length > 0 && (
          <Card className="glass-card border-0 neon-glow">
            <CardHeader className="border-b border-purple-900/30">
              <CardTitle className="text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span>2. Revisar Transações ({parsedData.length})</span>
                <Button
                  onClick={handleImport}
                  disabled={isProcessing || parsedData.some(tx => !tx.category_id)}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Importar Todas
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"> {/* Added custom-scrollbar class for styling */}
                {parsedData.map((tx, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg glass-card border border-purple-700/30"
                  >
                    {/* Header da Transação */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${tx.type === 'income' ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                          {tx.type === 'income' ? '📈' : '📉'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{tx.description}</p>
                          <p className="text-sm text-purple-300">{tx.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-lg whitespace-nowrap ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'income' ? '+' : '-'} R$ {Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTransaction(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Seletor de Categoria */}
                    <div className="mt-3">
                      <Label className="text-purple-200 text-xs mb-2 block">Categoria *</Label>
                      <Select
                        value={tx.category_id || ""}
                        onValueChange={(value) => handleCategoryChange(index, value)}
                      >
                        <SelectTrigger className={`w-full bg-purple-900/20 border-purple-700/50 text-white ${!tx.category_id ? 'border-yellow-500/50' : ''}`}>
                          <SelectValue placeholder="⚠️ Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <div className="px-2 py-1.5 text-xs font-semibold text-purple-400 border-b border-purple-700/30">
                            {tx.type === 'income' ? '📈 ENTRADAS' : '📉 SAÍDAS'}
                          </div>
                          {categories
                            .filter(c => c.type === tx.type)
                            .map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: cat.color }}
                                  />
                                  <span>{cat.name}</span>
                                  {cat.isSystem && (
                                    <span className="text-[10px] text-purple-400">(Sistema)</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          {categories.filter(c => c.type === tx.type).length === 0 && (
                            <div className="px-3 py-2 text-sm text-purple-400">
                              Nenhuma categoria disponível
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      {!tx.category_id && (
                        <p className="text-xs text-yellow-400 mt-1">
                          ⚠️ Categoria obrigatória para importação
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Aviso se houver transações sem categoria */}
              {parsedData.some(tx => !tx.category_id) && (
                <Alert className="mt-4 bg-yellow-900/20 border-yellow-700/30">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-300 text-sm">
                    ⚠️ Selecione uma categoria para todas as transações antes de importar.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {importResults && (
          <Alert className="glass-card border-0 border-l-4 border-green-500">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <AlertDescription className="text-green-300">
              <p className="font-bold mb-2">✅ Importação Concluída!</p>
              <p className="text-sm">
                {importResults.success} de {importResults.total} transações importadas com sucesso.
                {importResults.errors > 0 && ` ${importResults.errors} erros encontrados.`}
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </FeatureGuard>
  );
}
