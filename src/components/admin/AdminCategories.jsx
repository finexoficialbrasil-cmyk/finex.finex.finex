import React, { useState, useEffect } from "react";
import { SystemCategory } from "@/entities/SystemCategory";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tags, Plus, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const colorOptions = [
  { value: "#a855f7", label: "Roxo" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#06b6d4", label: "Ciano" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#8b5cf6", label: "Violeta" }
];

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    color: "#a855f7",
    order: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await SystemCategory.list("order");
    setCategories(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingCategory) {
      await SystemCategory.update(editingCategory.id, formData);
    } else {
      await SystemCategory.create({ ...formData, is_system: true });
    }
    
    resetForm();
    loadCategories();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      type: "expense",
      color: "#a855f7",
      order: 0
    });
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      order: category.order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza? Esta categoria será removida para todos os usuários.")) {
      await SystemCategory.delete(id);
      loadCategories();
    }
  };

  const incomeCategories = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");

  return (
    <div className="space-y-6">
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <Button
            onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Categoria Padrão
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-bold text-green-400 mb-4">Receitas ({incomeCategories.length})</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incomeCategories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card border-0 neon-glow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: cat.color + '30', border: `2px solid ${cat.color}` }}
                      >
                        <Tags className="w-6 h-6" style={{ color: cat.color }} />
                      </div>
                      <p className="text-white font-semibold">{cat.name}</p>
                    </div>
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
                        onClick={() => handleDelete(cat.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-red-400 mb-4">Despesas ({expenseCategories.length})</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseCategories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card border-0 neon-glow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: cat.color + '30', border: `2px solid ${cat.color}` }}
                      >
                        <Tags className="w-6 h-6" style={{ color: cat.color }} />
                      </div>
                      <p className="text-white font-semibold">{cat.name}</p>
                    </div>
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
                        onClick={() => handleDelete(cat.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {editingCategory ? "Editar Categoria" : "Nova Categoria Padrão"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-purple-200">Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-purple-900/20 border-purple-700/50 text-white"
              />
            </div>

            <div>
              <Label className="text-purple-200">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-purple-200">Cor</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
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
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-purple-200">Ordem</Label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="bg-purple-900/20 border-purple-700/50 text-white"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex-1 border-purple-700 text-purple-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {editingCategory ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}