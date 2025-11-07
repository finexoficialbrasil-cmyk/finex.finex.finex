import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { file_url, file_type, account_id } = await req.json();

        let transactions = [];

        if (file_type === 'pdf') {
            transactions = await parsePDF(file_url, base44);
        } else {
            const fileResponse = await fetch(file_url);
            const fileContent = await fileResponse.text();

            if (file_type === 'ofx') {
                transactions = parseOFX(fileContent);
            } else if (file_type === 'csv') {
                transactions = parseCSV(fileContent);
            } else if (file_type === 'txt') {
                transactions = parseTXT(fileContent);
            }
        }

        // 🚀 IA: Categorizar TODAS as transações de uma vez (processamento em lote)
        const categorizedTransactions = await autoCategorizeBatch(transactions, base44);

        return Response.json({
            status: 'success',
            transactions: categorizedTransactions
        });

    } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        return Response.json({
            status: 'error',
            message: error.message
        }, { status: 500 });
    }
});

// 🚀 NOVO: Categorização em lote (muito mais rápido!)
async function autoCategorizeBatch(transactions, base44) {
    try {
        if (transactions.length === 0) return [];

        // Carregar todas as categorias
        const [userCategories, systemCategories] = await Promise.all([
            base44.entities.Category.list(),
            base44.entities.SystemCategory.list()
        ]);

        const allCategories = [
            ...systemCategories.map(c => ({ ...c, isSystem: true })),
            ...userCategories.map(c => ({ ...c, isSystem: false }))
        ];

        console.log(`🚀 Categorizando ${transactions.length} transações EM LOTE com IA...`);

        const incomeCats = allCategories.filter(c => c.type === 'income');
        const expenseCats = allCategories.filter(c => c.type === 'expense');

        // Separar por tipo para processar em lote
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        const expenseTransactions = transactions.filter(t => t.type === 'expense');

        const results = [];

        // Processar entradas em lote
        if (incomeTransactions.length > 0 && incomeCats.length > 0) {
            const incomeResults = await categorizeBatchByType(incomeTransactions, incomeCats, 'income', base44);
            results.push(...incomeResults);
        }

        // Processar saídas em lote
        if (expenseTransactions.length > 0 && expenseCats.length > 0) {
            const expenseResults = await categorizeBatchByType(expenseTransactions, expenseCats, 'expense', base44);
            results.push(...expenseResults);
        }

        console.log(`✅ Categorização em lote concluída!`);
        return results;

    } catch (error) {
        console.error('Erro na categorização em lote:', error);
        return transactions.map(tx => ({ ...tx, category_id: null }));
    }
}

async function categorizeBatchByType(transactions, categories, type, base44) {
    try {
        const prompt = `Você é um assistente financeiro especializado em categorização.

TAREFA: Categorize TODAS as transações abaixo de uma só vez.

TRANSAÇÕES (${transactions.length}):
${transactions.map((tx, i) => `${i + 1}. "${tx.description}" - R$ ${tx.amount}`).join('\n')}

CATEGORIAS DISPONÍVEIS (${type === 'income' ? 'ENTRADAS' : 'SAÍDAS'}):
${categories.map((c, i) => `${i + 1}. ${c.name} (ID: ${c.id})`).join('\n')}

REGRAS DE CATEGORIZAÇÃO:
- Salário, pagamento → "Salário"
- Mercado, supermercado, food, alimentação → "Alimentação"
- Uber, gasolina, combustível, transporte → "Transporte"
- Aluguel, condomínio, luz, água → "Moradia"
- PIX, transferência → Analise o contexto
- Farmácia, médico, plano → "Saúde"
- Netflix, spotify, assinatura → "Lazer"

IMPORTANTE: Retorne um array JSON com o mesmo número de transações, na mesma ordem.`;

        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    categorizations: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                index: { type: "number", description: "Índice da transação (0-based)" },
                                category_id: { type: "string", description: "ID da categoria escolhida" }
                            },
                            required: ["index", "category_id"]
                        }
                    }
                },
                required: ["categorizations"]
            }
        });

        const categorizedTxs = transactions.map((tx, index) => {
            const categorization = result.categorizations.find(c => c.index === index);
            
            if (categorization && categories.some(c => c.id === categorization.category_id)) {
                return { ...tx, category_id: categorization.category_id };
            }
            
            // Fallback: usar primeira categoria
            return { ...tx, category_id: categories[0].id };
        });

        console.log(`✅ ${type}: ${categorizedTxs.filter(t => t.category_id).length}/${transactions.length} categorizadas`);
        
        return categorizedTxs;

    } catch (error) {
        console.error(`Erro ao categorizar ${type}:`, error);
        return transactions.map(tx => ({ ...tx, category_id: categories[0]?.id || null }));
    }
}

async function parsePDF(file_url, base44) {
    try {
        const schema = {
            type: "object",
            properties: {
                transactions: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            date: { type: "string", description: "Data da transação no formato DD/MM/YYYY" },
                            description: { type: "string", description: "Descrição ou histórico da transação" },
                            amount: { type: "number", description: "Valor da transação (positivo para entrada, negativo para saída)" },
                            type: { type: "string", enum: ["income", "expense"], description: "Tipo da transação" }
                        },
                        required: ["date", "description", "amount", "type"]
                    }
                }
            }
        };

        const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
            file_url,
            json_schema: schema
        });

        if (result.status === 'error') {
            throw new Error(result.details || 'Erro ao processar PDF');
        }

        const transactions = result.output.transactions.map(tx => ({
            description: tx.description,
            amount: Math.abs(tx.amount),
            type: tx.amount >= 0 ? 'income' : 'expense',
            date: formatDate(tx.date),
            category_id: null
        }));

        return transactions;

    } catch (error) {
        console.error('Erro ao processar PDF:', error);
        throw new Error('Falha ao extrair dados do PDF. Verifique se o arquivo contém uma tabela de transações legível.');
    }
}

function parseOFX(content) {
    const transactions = [];
    
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    const matches = content.matchAll(transactionRegex);

    for (const match of matches) {
        const txBlock = match[1];
        
        const typeMatch = txBlock.match(/<TRNTYPE>(.*?)</);
        const dateMatch = txBlock.match(/<DTPOSTED>(.*?)</);
        const amountMatch = txBlock.match(/<TRNAMT>(.*?)</);
        const memoMatch = txBlock.match(/<MEMO>(.*?)</);

        if (dateMatch && amountMatch) {
            const amount = parseFloat(amountMatch[1]);
            const type = amount >= 0 ? 'income' : 'expense';
            
            let date = dateMatch[1];
            if (date.length >= 8) {
                date = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
            }

            transactions.push({
                description: memoMatch ? memoMatch[1].trim() : 'Transação importada',
                amount: Math.abs(amount),
                type,
                date,
                category_id: null
            });
        }
    }

    return transactions;
}

function parseCSV(content) {
    const transactions = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cleaned = parts.map(p => p.replace(/^"|"$/g, '').trim());

        if (cleaned.length >= 3) {
            const date = cleaned[0];
            const description = cleaned[1];
            let amount = parseFloat(cleaned[2].replace(',', '.').replace(/[^\d.-]/g, ''));
            let type = cleaned[3]?.toLowerCase() || null;

            if (!type || !['income', 'expense'].includes(type)) {
                type = amount >= 0 ? 'income' : 'expense';
            }

            transactions.push({
                description: description || 'Transação importada',
                amount: Math.abs(amount),
                type,
                date: formatDate(date),
                category_id: null
            });
        }
    }

    return transactions;
}

function parseTXT(content) {
    const transactions = [];
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
        const parts = line.split(/[|\t]/).map(p => p.trim());
        
        if (parts.length >= 3) {
            const date = parts[0];
            const description = parts[1];
            let amount = parseFloat(parts[2].replace(',', '.').replace(/[^\d.-]/g, ''));
            let type = parts[3]?.toLowerCase() || null;

            if (!type || !['income', 'expense'].includes(type)) {
                type = amount >= 0 ? 'income' : 'expense';
            }

            transactions.push({
                description: description || 'Transação importada',
                amount: Math.abs(amount),
                type,
                date: formatDate(date),
                category_id: null
            });
        }
    }

    return transactions;
}

function formatDate(dateStr) {
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
    }
    
    if (dateStr.match(/^\d{8}$/)) {
        return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }
    
    return new Date().toISOString().split('T')[0];
}