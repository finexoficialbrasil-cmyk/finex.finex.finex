
import React, { useState, useEffect } from "react";
import FeatureGuard from "../components/FeatureGuard";
import { Category } from "@/entities/Category";
import { SystemCategory } from "@/entities/SystemCategory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tags, Plus, Edit, Trash2, TrendingUp, TrendingDown, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const colorOptions = [
  { value: "#a855f7", label: "Roxo" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#06b6d4", label: "Ciano" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#14b8a6", label: "Turquesa" },
  { value: "#f97316", label: "Laranja" }
];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [systemCategories, setSystemCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // New state for loading
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ NOVO: Estado de submissão
  const [filterType, setFilterType] = useState("all"); // New state for filter
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    color: "#a855f7",
    budget_limit: ""
  });
  const [activeTab, setActiveTab] = useState("income");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    console.log("🔄 Carregando categorias...");
    setIsLoading(true); // Set loading to true before fetching
    try {
      // ✅ OTIMIZADO: Carregar com limite
      const [userCats, sysCats] = await Promise.all([
        Category.list("-created_date", 100), // Optimized: added sort and limit
        SystemCategory.list("order") // Keep as is, usually a small dataset
      ]);
    
      console.log("👤 Categorias do usuário:", userCats.length);
      console.log("🌐 Categorias do sistema:", sysCats.length);
    
      setCategories(userCats);
      setSystemCategories(sysCats);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      // Optionally, display an error message to the user
    } finally {
      setIsLoading(false); // Set loading to false after fetching (whether successful or not)
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ BLOQUEAR cliques duplos
    if (isSubmitting) {
      console.log("⚠️ Já está processando, ignorando clique duplo");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const data = {
        ...formData,
        budget_limit: formData.budget_limit ? parseFloat(formData.budget_limit) : undefined
      };
      
      if (editingCategory) {
        await Category.update(editingCategory.id, data);
      } else {
        await Category.create(data);
      }
      
      resetForm();
      loadCategories();
    } catch (error) {
      console.error("❌ Erro ao salvar categoria:", error);
      alert("Erro ao salvar categoria. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      type: "expense",
      color: "#a855f7",
      budget_limit: ""
    });
  };

  const handleEdit = (category) => {
    // Não permitir editar categorias do sistema
    if (category.isSystem) {
      alert("⚠️ Categorias do sistema não podem ser editadas. Você pode criar suas próprias categorias personalizadas!");
      return;
    }
    
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color || "#a855f7",
      budget_limit: category.budget_limit?.toString() || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (category) => {
    // Não permitir deletar categorias do sistema
    if (category.isSystem) {
      alert("⚠️ Categorias do sistema não podem ser removidas. Apenas suas categorias personalizadas podem ser deletadas.");
      return;
    }
    
    if (confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      try {
        console.log("🗑️ Tentando deletar categoria:", category.id, category.name);
        await Category.delete(category.id);
        console.log("✅ Categoria deletada com sucesso!");
        await loadCategories();
      } catch (error) {
        console.error("❌ Erro ao deletar categoria:", error);
        
        if (error.response?.status === 404) {
          alert("⚠️ Categoria não encontrada. Recarregando lista...");
          await loadCategories();
        } else if (error.response?.status === 403) {
          alert("⚠️ Você não tem permissão para deletar esta categoria.");
        } else if (error.message?.includes("foreign key") || error.message?.includes("in use")) {
          alert("❌ Não é possível deletar esta categoria porque ela está sendo usada em transações. Remova as transações primeiro.");
        } else {
          alert("❌ Erro ao deletar categoria: " + (error.message || "Erro desconhecido"));
        }
      }
    }
  };

  // Mesclar categorias do sistema com categorias do usuário
  const allCategories = [
    ...systemCategories.map(c => ({ ...c, isSystem: true })),
    ...categories.map(c => ({ ...c, isSystem: false }))
  ];

  const incomeCategories = allCategories.filter(c => c.type === "income");
  const expenseCategories = allCategories.filter(c => c.type === "expense");

  console.log("📊 Total categorias (sistema + usuário):", allCategories.length);
  console.log("   - Entradas:", incomeCategories.length);
  console.log("   - Saídas:", expenseCategories.length);

  // Show loading state while categories are being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-purple-300">Carregando categorias...</div>
      </div>
    );
  }

  return (
    <FeatureGuard pageName="Categories">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                Categorias
              </h1>
              <p className="text-purple-300 mt-1">Organize suas finanças por categorias</p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 neon-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          {/* Tabs */}
          <Card className="glass-card border-0 neon-glow">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-purple-900/20 grid w-full grid-cols-2">
                  <TabsTrigger value="income">Entradas</TabsTrigger>
                  <TabsTrigger value="expense">Saídas</TabsTrigger>
                </TabsList>

                {/* Income Categories Tab Content */}
                <TabsContent value="income" className="mt-6">
                  <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Entradas
                  </h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {incomeCategories.map((cat, index) => (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="glass-card border-0 neon-glow hover:scale-105 transition-transform">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: cat.color + '30', border: `2px solid ${cat.color}` }}
                                >
                                  <Tags className="w-6 h-6" style={{ color: cat.color }} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-white">{cat.name}</p>
                                    {cat.isSystem && (
                                      <Lock className="w-3 h-3 text-purple-400" title="Categoria do Sistema" />
                                    )}
                                  </div>
                                  {cat.budget_limit && (
                                    <p className="text-xs text-purple-300">
                                      Limite: R$ {cat.budget_limit.toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {!cat.isSystem && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(cat)}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="w-4 h-4 text-purple-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(cat)}
                                    className="h-8 w-8"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    {incomeCategories.length === 0 && (
                      <p className="text-purple-300 text-sm col-span-3">Nenhuma categoria de entrada disponível</p>
                    )}
                  </div>
                </TabsContent>

                {/* Expense Categories Tab Content */}
                <TabsContent value="expense" className="mt-6">
                  <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    Saídas
                  </h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {expenseCategories.map((cat, index) => (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="glass-card border-0 neon-glow hover:scale-105 transition-transform">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: cat.color + '30', border: `2px solid ${cat.color}` }}
                                >
                                  <Tags className="w-6 h-6" style={{ color: cat.color }} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-white">{cat.name}</p>
                                    {cat.isSystem && (
                                      <Lock className="w-3 h-3 text-purple-400" title="Categoria do Sistema" />
                                    )}
                                  </div>
                                  {cat.budget_limit && (
                                    <p className="text-xs text-purple-300">
                                      Limite: R$ {cat.budget_limit.toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {!cat.isSystem && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(cat)}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="w-4 h-4 text-purple-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(cat)}
                                    className="h-8 w-8"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    {expenseCategories.length === 0 && (
                      <p className="text-purple-300 text-sm col-span-3">Nenhuma categoria de saída disponível</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Info Card */}
          {systemCategories.length > 0 && (
            <Card className="glass-card border-0 border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <p className="text-white font-medium">ℹ️ Categorias do Sistema</p>
                    <p className="text-purple-300 text-sm mt-1">
                      As categorias com cadeado são padrão do sistema e não podem ser editadas ou removidas. Você pode criar suas próprias categorias personalizadas clicando em "Nova Categoria"!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="glass-card border-purple-700/50 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-purple-200">Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Alimentação, Salário..."
                  className="bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>

              <div>
                <Label className="text-purple-200 text-sm">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Entrada</SelectItem>
                    <SelectItem value="expense">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-purple-200">Limite Mensal (Opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.budget_limit}
                  onChange={(e) => setFormData({ ...formData, budget_limit: e.target.value })}
                  placeholder="0.00"
                  className="bg-purple-900/20 border-purple-700/50 text-white"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label className="text-purple-200">Cor</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {colorOptions.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`h-12 rounded-lg transition-transform ${
                        formData.color === color.value ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 border-purple-700 text-purple-300"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingCategory ? "Atualizar" : "Criar"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGuard>
  );
}
