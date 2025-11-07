
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Transaction, Account, Category, Goal, Bill, Transfer } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Search, Shield, Mail, Calendar, Edit, Trash2, AlertTriangle, Info, Phone, Copy, Download, Upload, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest"); // ✅ NOVO: ordenação
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false); // NEW: State for transfer modal
  const [editingUser, setEditingUser] = useState(null);
  const [transferringUser, setTransferringUser] = useState(null); // NEW: User whose data is being transferred
  const [targetUserEmail, setTargetUserEmail] = useState(""); // NEW: Email of the target user for transfer
  const [isTransferring, setIsTransferring] = useState(false); // NEW: Loading state for transfer operation
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await User.me();
      setCurrentUser(userData);
    } catch (error) {
      console.error("Erro ao carregar usuário atual:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await User.list();
      setUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || "",
      email: user.email,
      phone: user.phone || ""
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await User.update(editingUser.id, {
        full_name: formData.full_name,
        phone: formData.phone
      });
      alert("✅ Usuário atualizado com sucesso!");
      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      alert("❌ Erro ao atualizar usuário. Tente novamente.");
    }
  };

  // ✅ NEW: Export user data as JSON
  const handleExportUserData = async (user) => {
    try {
      alert("📊 Exportando dados do usuário...");
      
      const [transactions, accounts, categories, goals, bills, transfers] = await Promise.all([
        Transaction.filter({ created_by: user.email }),
        Account.filter({ created_by: user.email }),
        Category.filter({ created_by: user.email }),
        Goal.filter({ created_by: user.email }),
        Bill.filter({ created_by: user.email }),
        Transfer.filter({ created_by: user.email })
      ]);

      const backup = {
        user_info: {
          original_email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          export_date: new Date().toISOString()
        },
        transactions: transactions.map(t => ({...t, id: undefined, created_by: undefined, created_date: undefined, updated_date: undefined})),
        accounts: accounts.map(a => ({...a, id: undefined, created_by: undefined, created_date: undefined, updated_date: undefined})),
        categories: categories.map(c => ({...c, id: undefined, created_by: undefined, created_date: undefined, updated_date: undefined})),
        goals: goals.map(g => ({...g, id: undefined, created_by: undefined, created_date: undefined, updated_date: undefined})),
        bills: bills.map(b => ({...b, id: undefined, created_by: undefined, created_date: undefined, updated_date: undefined})),
        transfers: transfers.map(t => ({...t, id: undefined, created_by: undefined, created_date: undefined, updated_date: undefined}))
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${user.email.replace('@', '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`✅ Backup exportado com sucesso!\n\n📊 Dados exportados:\n- ${transactions.length} transações\n- ${accounts.length} contas\n- ${categories.length} categorias\n- ${goals.length} metas\n- ${bills.length} contas a pagar/receber\n- ${transfers.length} transferências\n\n💾 Arquivo salvo para restauração futura.`);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      alert("❌ Erro ao exportar dados. Tente novamente.");
    }
  };

  // ✅ NEW: Initiate data transfer
  const handleStartTransfer = (user) => {
    setTransferringUser(user);
    setTargetUserEmail("");
    setShowTransferModal(true);
  };

  // ✅ NEW: Transfer data to a new user
  const handleTransferData = async () => {
    if (!targetUserEmail) {
      alert("❌ Digite o novo email do usuário!");
      return;
    }

    const targetUser = users.find(u => u.email.toLowerCase() === targetUserEmail.toLowerCase());
    
    if (!targetUser) {
      alert("❌ Usuário com este email não encontrado!\n\nO usuário precisa fazer login pelo menos uma vez para criar a conta.");
      return;
    }

    if (targetUser.id === transferringUser.id) {
      alert("❌ Não é possível transferir dados para o mesmo usuário!");
      return;
    }

    if (!confirm(`⚠️ CONFIRMAR TRANSFERÊNCIA DE DADOS\n\nDe: ${transferringUser.email}\nPara: ${targetUser.email}\n\nTodos os dados (transações, contas, categorias, metas, etc) serão COPIADOS para o novo usuário.\n\n✅ A conta antiga NÃO será excluída automaticamente.\n\nDeseja continuar?`)) {
      return;
    }

    setIsTransferring(true);

    try {
      alert("📊 Carregando dados do usuário antigo...");
      
      const [transactions, accounts, categories, goals, bills, transfers] = await Promise.all([
        Transaction.filter({ created_by: transferringUser.email }),
        Account.filter({ created_by: transferringUser.email }),
        Category.filter({ created_by: transferringUser.email }),
        Goal.filter({ created_by: transferringUser.email }),
        Bill.filter({ created_by: transferringUser.email }),
        Transfer.filter({ created_by: transferringUser.email })
      ]);

      alert(`📦 Encontrados:\n- ${transactions.length} transações\n- ${accounts.length} contas\n- ${categories.length} categorias\n- ${goals.length} metas\n- ${bills.length} contas a pagar/receber\n- ${transfers.length} transferências\n\nIniciando transferência...`);

      // Mapeamento de IDs antigos para novos
      const accountIdMap = {};
      const categoryIdMap = {};

      // 1. Transferir Categorias
      for (const cat of categories) {
        // Prepare data for new creation, ensuring it's for the target user
        const newCat = await Category.create({
          ...cat,
          id: undefined, // Let the system generate a new ID
          created_by: targetUser.email,
          created_date: undefined,
          updated_date: undefined
        });
        categoryIdMap[cat.id] = newCat.id;
      }

      // 2. Transferir Contas
      for (const acc of accounts) {
        // Prepare data for new creation, ensuring it's for the target user
        const newAcc = await Account.create({
          ...acc,
          id: undefined, // Let the system generate a new ID
          created_by: targetUser.email,
          created_date: undefined,
          updated_date: undefined
        });
        accountIdMap[acc.id] = newAcc.id;
      }

      // 3. Transferir Transações
      for (const tx of transactions) {
        // Prepare data for new creation, mapping category_id and account_id
        await Transaction.create({
          ...tx,
          id: undefined, // Let the system generate a new ID
          created_by: targetUser.email,
          created_date: undefined,
          updated_date: undefined,
          category_id: categoryIdMap[tx.category_id] || tx.category_id, // Use new category ID if mapped
          account_id: accountIdMap[tx.account_id] || tx.account_id,     // Use new account ID if mapped
        });
      }

      // 4. Transferir Metas
      for (const goal of goals) {
        // Prepare data for new creation
        await Goal.create({
          ...goal,
          id: undefined, // Let the system generate a new ID
          created_by: targetUser.email,
          created_date: undefined,
          updated_date: undefined
        });
      }

      // 5. Transferir Contas a Pagar/Receber
      for (const bill of bills) {
        // Prepare data for new creation, mapping category_id and account_id
        await Bill.create({
          ...bill,
          id: undefined, // Let the system generate a new ID
          created_by: targetUser.email,
          created_date: undefined,
          updated_date: undefined,
          category_id: categoryIdMap[bill.category_id] || bill.category_id, // Use new category ID if mapped
          account_id: accountIdMap[bill.account_id] || bill.account_id,     // Use new account ID if mapped
        });
      }

      // 6. Transferir Transferências
      for (const transfer of transfers) {
        // Prepare data for new creation, mapping from_account_id and to_account_id
        await Transfer.create({
          ...transfer,
          id: undefined, // Let the system generate a new ID
          created_by: targetUser.email,
          created_date: undefined,
          updated_date: undefined,
          from_account_id: accountIdMap[transfer.from_account_id] || transfer.from_account_id, // Use new account ID if mapped
          to_account_id: accountIdMap[transfer.to_account_id] || transfer.to_account_id         // Use new account ID if mapped
        });
      }

      // Optionally update target user's profile with previous user's info
      await User.update(targetUser.id, {
        full_name: transferringUser.full_name || targetUser.full_name,
        phone: transferringUser.phone || targetUser.phone,
        avatar_url: transferringUser.avatar_url || targetUser.avatar_url,
        theme: transferringUser.theme || targetUser.theme
      });

      alert(`✅ TRANSFERÊNCIA CONCLUÍDA COM SUCESSO!\n\n📊 Dados transferidos:\n- ${transactions.length} transações\n- ${accounts.length} contas\n- ${categories.length} categorias\n- ${goals.length} metas\n- ${bills.length} contas a pagar/receber\n- ${transfers.length} transferências\n\n✉️ Novo usuário: ${targetUser.email}\n\n⚠️ IMPORTANTE:\nAgora você pode excluir a conta antiga (${transferringUser.email}) se desejar.`);
      
      setShowTransferModal(false);
      setTransferringUser(null);
      setTargetUserEmail("");
      loadUsers();
    } catch (error) {
      console.error("Erro na transferência:", error);
      alert("❌ Erro durante a transferência. Alguns dados podem não ter sido transferidos. Verifique e tente novamente se necessário.");
    } finally {
      setIsTransferring(false);
    }
  };

  // ✅ NEW: Import data from a backup JSON file
  const handleImportBackup = async (user) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        if (!backup.user_info || !backup.user_info.original_email) {
          throw new Error("Formato de arquivo de backup inválido. 'user_info.original_email' não encontrado.");
        }

        if (!confirm(`⚠️ CONFIRMAR RESTAURAÇÃO DE BACKUP\n\nRestaurar backup de: ${backup.user_info.original_email}\nData do backup: ${new Date(backup.user_info.export_date).toLocaleDateString('pt-BR')}\n\nPara usuário: ${user.email}\n\nTodos os dados serão ADICIONADOS ao usuário atual.\n\nDeseja continuar?`)) {
          return;
        }

        alert("📦 Restaurando backup...");

        // Mapeamento de IDs do backup para novos IDs gerados no sistema
        const accountIdMap = {};
        const categoryIdMap = {};

        // Restaurar categorias
        for (const cat of backup.categories || []) {
          const newCat = await Category.create({
            ...cat,
            id: undefined, // Let the system generate a new ID
            created_by: user.email,
            created_date: undefined,
            updated_date: undefined
          });
          categoryIdMap[cat.id] = newCat.id;
        }

        // Restaurar contas
        for (const acc of backup.accounts || []) {
          const newAcc = await Account.create({
            ...acc,
            id: undefined, // Let the system generate a new ID
            created_by: user.email,
            created_date: undefined,
            updated_date: undefined
          });
          accountIdMap[acc.id] = newAcc.id;
        }

        // Restaurar transações
        for (const tx of backup.transactions || []) {
          await Transaction.create({
            ...tx,
            id: undefined, // Let the system generate a new ID
            created_by: user.email,
            created_date: undefined,
            updated_date: undefined,
            category_id: categoryIdMap[tx.category_id] || tx.category_id, // Use new category ID if mapped
            account_id: accountIdMap[tx.account_id] || tx.account_id      // Use new account ID if mapped
          });
        }

        // Restaurar metas
        for (const goal of backup.goals || []) {
          await Goal.create({
            ...goal,
            id: undefined, // Let the system generate a new ID
            created_by: user.email,
            created_date: undefined,
            updated_date: undefined
          });
        }

        // Restaurar contas a pagar/receber
        for (const bill of backup.bills || []) {
          await Bill.create({
            ...bill,
            id: undefined, // Let the system generate a new ID
            created_by: user.email,
            created_date: undefined,
            updated_date: undefined,
            category_id: categoryIdMap[bill.category_id] || bill.category_id, // Use new category ID if mapped
            account_id: accountIdMap[bill.account_id] || bill.account_id      // Use new account ID if mapped
          });
        }

        // Restaurar transferências
        for (const transfer of backup.transfers || []) {
          await Transfer.create({
            ...transfer,
            id: undefined, // Let the system generate a new ID
            created_by: user.email,
            created_date: undefined,
            updated_date: undefined,
            from_account_id: accountIdMap[transfer.from_account_id] || transfer.from_account_id, // Use new account ID if mapped
            to_account_id: accountIdMap[transfer.to_account_id] || transfer.to_account_id         // Use new account ID if mapped
          });
        }

        alert(`✅ BACKUP RESTAURADO COM SUCESSO!\n\n📊 Dados restaurados:\n- ${backup.transactions?.length || 0} transações\n- ${backup.accounts?.length || 0} contas\n- ${backup.categories?.length || 0} categorias\n- ${backup.goals?.length || 0} metas\n- ${backup.bills?.length || 0} contas a pagar/receber\n- ${backup.transfers?.length || 0} transferências`);
        
        loadUsers();
      } catch (error) {
        console.error("Erro ao importar backup:", error);
        alert(`❌ Erro ao importar backup. Verifique se o arquivo é válido. Detalhes: ${error.message}`);
      }
    };

    input.click();
  };


  const handleDelete = async (user) => {
    if (user.role === 'admin') {
      alert("❌ Não é possível excluir o administrador do sistema!");
      return;
    }

    if (user.id === currentUser?.id) {
      alert("❌ Você não pode excluir sua própria conta!");
      return;
    }

    if (confirm(`⚠️ ATENÇÃO: Deseja EXCLUIR o usuário "${user.full_name || user.email}"?\n\n📧 Email: ${user.email}\n📱 Telefone: ${user.phone || 'Não cadastrado'}\n\n❗ Esta ação NÃO PODE ser desfeita!\n❗ Use apenas para usuários que perderam acesso ao email e não há necessidade de backup/restauração.\n\n⚠️ IMPORTANTE: Se o usuário precisa dos dados, use as opções de 'Backup', 'Restaurar' ou 'Transferir' ANTES de excluir esta conta!\n\nConfirmar exclusão (sem preservação de dados)?`)) {
      try {
        await User.delete(user.id);
        alert(`✅ Usuário excluído com sucesso!\n\n📝 Instrua o usuário:\n1. Acessar o sistema novamente\n2. Fazer login com o NOVO email do Google\n3. O sistema criará automaticamente uma nova conta\n\n⚠️ Se os dados precisarem ser restaurados, instrua o usuário a entrar em contato com o admin APÓS criar a nova conta.`);
        loadUsers();
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        alert("❌ Erro ao excluir usuário. Tente novamente.");
      }
    }
  };

  const copyRecoveryInstructions = (user) => {
    const instructions = `📧 RECUPERAÇÃO DE CONTA COM DADOS - FINEX

Olá ${user.full_name || 'usuário'},

Sua conta antiga foi ou será removida do sistema, mas seus dados serão preservados.

✅ PRÓXIMOS PASSOS:

1. Acesse: ${window.location.origin}
2. Clique em "Entrar"
3. Faça login com seu NOVO email do Google
4. O sistema criará automaticamente sua nova conta
5. Em seguida, entre em contato com o administrador
6. O administrador irá transferir ou restaurar todos os seus dados para a nova conta.

📊 SEUS DADOS SERÃO PRESERVADOS:
- Todas as transações
- Contas e saldos
- Categorias personalizadas
- Metas financeiras
- Contas a pagar/receber
- Transferências

⚠️ IMPORTANTE:
- Use seu NOVO email do Google para fazer login.
- Aguarde a confirmação do administrador sobre a conclusão da transferência/restauração de dados antes de registrar novas informações.

Atenciosamente,
Equipe FINEX`;

    navigator.clipboard.writeText(instructions);
    alert("✅ Instruções copiadas! Envie para o usuário via WhatsApp, email, etc.");
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm);
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // ✅ NOVO: Ordenar usuários
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const dateA = new Date(a.created_date);
    const dateB = new Date(b.created_date);
    
    if (sortOrder === "newest") {
      return dateB.getTime() - dateA.getTime(); // Mais novos primeiro
    } else {
      return dateA.getTime() - dateB.getTime(); // Mais antigos primeiro
    }
  });

  const adminCount = users.filter(u => u.role === 'admin').length;

  if (isLoading) {
    return <div className="text-purple-300 text-center py-12">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Instruções de Recuperação de Conta - ATUALIZADO */}
      <Alert className="glass-card border-0 border-l-4 border-cyan-500">
        <Info className="h-5 w-5 text-cyan-400" />
        <AlertTitle className="text-white font-semibold text-lg">📧 RECUPERAÇÃO DE CONTA COM PRESERVAÇÃO DE DADOS</AlertTitle>
        <AlertDescription className="text-cyan-300 space-y-3 mt-3">
          <div className="bg-cyan-900/20 p-4 rounded-lg border border-cyan-700/30">
            <p className="font-bold text-cyan-200 mb-2">💾 NOVO: Gerenciamento Avançado de Dados!</p>
            <p className="text-sm">Agora você pode exportar, importar e transferir dados de usuários com facilidade.</p>
          </div>

          <div>
            <p className="font-bold text-white mb-2">📋 PASSO A PASSO - Recuperação COM Dados:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm ml-2">
              <li className="ml-2">
                <strong>Usuário te contata</strong> informando que perdeu acesso ao email ou deseja mudar
              </li>
              
              <li className="ml-2">
                <strong>Você confirma a identidade</strong> do usuário
              </li>
              
              <li className="ml-2">
                <strong>Escolha UMA das opções abaixo para gerenciar os dados do usuário:</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-2 text-cyan-400">
                  <li><strong>OPÇÃO A - Transferência Direta (Recomendado)</strong>
                    <ol className="list-decimal list-inside ml-4 mt-1">
                      <li>Peça para o usuário fazer login com o <strong>NOVO</strong> email primeiro para criar a nova conta.</li>
                      <li>Na lista de usuários, encontre a conta <strong>ANTIGA</strong> e clique em "🔄 Transferir".</li>
                      <li>No modal, digite o <strong>NOVO email</strong> que o usuário acabou de criar.</li>
                      <li>Confirme a transferência. Após sucesso, os dados antigos são copiados para a nova conta.</li>
                      <li><strong>OPCIONAL:</strong> Você pode excluir a conta antiga se desejar, mas os dados originais permanecem nela (além de estarem copiados na nova).</li>
                    </ol>
                  </li>
                  <li><strong>OPÇÃO B - Backup Manual e Restauração</strong>
                    <ol className="list-decimal list-inside ml-4 mt-1">
                      <li>Na lista de usuários, encontre a conta <strong>ANTIGA</strong> e clique em "💾 Backup" para salvar os dados em um arquivo JSON.</li>
                      <li>Exclua a conta antiga (botão "🗑️ Excluir").</li>
                      <li>Peça para o usuário fazer login com o <strong>NOVO</strong> email para criar a nova conta.</li>
                      <li>Na lista de usuários, encontre a <strong>NOVA</strong> conta e clique em "📥 Restaurar".</li>
                      <li>Selecione o arquivo JSON de backup que você salvou anteriormente.</li>
                    </ol>
                  </li>
                </ul>
              </li>
              
              <li className="ml-2">
                <strong>Envie as instruções atualizadas</strong> para o usuário (botão 📋) para que ele saiba como proceder com a nova conta e a restauração.
              </li>
            </ol>
          </div>

          <div className="bg-green-900/20 p-3 rounded-lg border border-green-700/30 mt-3">
            <p className="text-green-300 text-xs">
              <strong>✅ GARANTIDO:</strong> Todas as opções acima preservam integralmente os dados do usuário, incluindo transações, contas, saldos, categorias, metas, contas a pagar/receber e transferências!
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Aviso sobre Admin Único */}
      <Card className="glass-card border-0 border-l-4 border-yellow-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-white font-semibold">⚠️ Proteção de Administrador</p>
              <p className="text-yellow-300 text-sm mt-1">
                Este sistema permite apenas UM administrador. O admin atual NÃO pode ser removido.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-purple-900/20 border-purple-700/50 text-white"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-48 bg-purple-900/20 border-purple-700/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Usuários</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="user">Usuários Comuns</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="glass-card border-0 neon-glow">
        <CardHeader className="border-b border-purple-900/30">
          <CardTitle className="text-white">
            Usuários Cadastrados ({sortedUsers.length})
            {adminCount > 0 && (
              <span className="text-sm text-yellow-400 ml-3">
                • {adminCount} Admin{adminCount > 1 ? 's' : ''}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {sortedUsers.map((user, index) => {
              const isAdmin = user.role === 'admin';
              const isCurrentUser = user.id === currentUser?.id;

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex flex-col gap-3 p-4 rounded-xl glass-card"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {user.full_name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold flex items-center gap-2 flex-wrap">
                        {user.full_name || "Sem nome"}
                        {isAdmin && (
                          <Shield className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        )}
                        {isCurrentUser && (
                          <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-600/40 text-xs">
                            Você
                          </Badge>
                        )}
                      </p>
                      <div className="flex flex-col gap-1 mt-1 text-sm text-purple-300">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            {user.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          Cadastrado em {new Date(user.created_date).toLocaleDateString('pt-BR')} às {new Date(user.created_date).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <Badge className={isAdmin 
                      ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/40'
                      : 'bg-purple-600/20 text-purple-400 border-purple-600/40'
                    }>
                      {isAdmin ? '👑 Admin' : '👤 Usuário'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-purple-900/30">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      className="border-purple-700 text-purple-300 hover:bg-purple-600/20"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    
                    {!isAdmin && ( // All these actions are not for admins, they are protected
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportUserData(user)}
                          className="border-blue-700 text-blue-300 hover:bg-blue-600/20"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          💾 Backup
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImportBackup(user)}
                          className="border-green-700 text-green-300 hover:bg-green-600/20"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          📥 Restaurar
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartTransfer(user)}
                          className="border-orange-700 text-orange-300 hover:bg-orange-600/20"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          🔄 Transferir
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyRecoveryInstructions(user)}
                          className="border-cyan-700 text-cyan-300 hover:bg-cyan-600/20"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          📋 Instruções
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          className="border-red-700 text-red-300 hover:bg-red-600/20"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          🗑️ Excluir
                        </Button>
                      </>
                    )}
                    
                    {isAdmin && (
                      <Badge className="bg-yellow-900/20 text-yellow-300 border-yellow-700/40 text-xs">
                        🔒 Protegido
                      </Badge>
                    )}
                    
                    {isCurrentUser && !isAdmin && (
                      <Badge className="bg-cyan-900/20 text-cyan-300 border-cyan-700/40 text-xs">
                        Não pode se auto-excluir
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Editar Usuário
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <Label className="text-purple-200 text-sm">Nome Completo</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                placeholder="Nome do usuário"
              />
            </div>

            <div>
              <Label className="text-purple-200 text-sm">Email (Google)</Label>
              <Input
                value={formData.email}
                disabled
                className="bg-purple-900/20 border-purple-700/50 text-purple-400 mt-1"
              />
              <div className="mt-2 p-3 rounded-lg bg-blue-900/20 border border-blue-700/30">
                <p className="text-xs text-blue-300 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Email NÃO pode ser alterado.</strong> O email é a identidade do usuário no Google.
                    Se o usuário perdeu acesso ao email, veja as instruções de recuperação acima.
                  </span>
                </p>
              </div>
            </div>

            <div>
              <Label className="text-purple-200 text-sm">Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
                placeholder="(00) 00000-0000"
              />
              <p className="text-xs text-purple-400 mt-1">
                💡 Mantenha o telefone atualizado para facilitar a recuperação de conta
              </p>
            </div>

            {editingUser?.role === 'admin' && (
              <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-700/50">
                <p className="text-yellow-300 text-xs flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Este é o administrador do sistema. A função não pode ser alterada.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1 border-purple-700 text-purple-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              🔄 Transferir Dados do Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="bg-orange-900/20 border-orange-700/50">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-300 text-xs mt-1">
                <strong>IMPORTANTE:</strong> O novo usuário deve fazer login PRIMEIRO para criar a conta antes da transferência!
              </AlertDescription>
            </Alert>

            <div>
              <Label className="text-purple-200 text-sm">De (Usuário Antigo)</Label>
              <Input
                value={transferringUser?.email || ""}
                disabled
                className="bg-purple-900/20 border-purple-700/50 text-purple-400 mt-1"
              />
            </div>

            <div>
              <Label className="text-purple-200 text-sm">Para (Novo Email do Usuário)</Label>
              <Input
                value={targetUserEmail}
                onChange={(e) => setTargetUserEmail(e.target.value)}
                placeholder="novo.email@gmail.com"
                className="bg-purple-900/20 border-purple-700/50 text-white mt-1"
              />
              <p className="text-xs text-purple-400 mt-1">
                Digite o NOVO email que o usuário usou para fazer login
              </p>
            </div>

            <Alert className="bg-green-900/20 border-green-700/50">
              <Info className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300 text-xs mt-1">
                ✅ Todos os dados serão transferidos: transações, contas, saldos, categorias, metas, contas a pagar/receber e transferências.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTransferModal(false)}
                disabled={isTransferring}
                className="flex-1 border-purple-700 text-purple-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleTransferData}
                disabled={isTransferring || !targetUserEmail}
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600"
              >
                {isTransferring ? "Transferindo..." : "🔄 Transferir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
