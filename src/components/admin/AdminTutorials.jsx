import React, { useState, useEffect } from "react";
import { SystemTutorial } from "@/entities/SystemTutorial";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { PlayCircle, Plus, Edit, Trash2, Eye } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { value: "financas", label: "Finanças Pessoais" },
  { value: "investimentos", label: "Investimentos" },
  { value: "configuracoes", label: "Configurações" },
  { value: "seguranca", label: "Segurança" },
  { value: "relatorios", label: "Relatórios" },
  { value: "iniciante", label: "Iniciante" },
  { value: "avancado", label: "Avançado" },
  { value: "integracao", label: "Integrações" }
];

export default function AdminTutorials() {
  const [tutorials, setTutorials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    category: "financas",
    order: 0,
    is_active: true
  });

  useEffect(() => {
    loadTutorials();
  }, []);

  const loadTutorials = async () => {
    const data = await SystemTutorial.list("order");
    setTutorials(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingTutorial) {
      await SystemTutorial.update(editingTutorial.id, formData);
    } else {
      await SystemTutorial.create(formData);
    }
    
    resetForm();
    loadTutorials();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTutorial(null);
    setFormData({
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      category: "financas",
      order: 0,
      is_active: true
    });
  };

  const handleEdit = (tutorial) => {
    setEditingTutorial(tutorial);
    setFormData({
      title: tutorial.title,
      description: tutorial.description || "",
      video_url: tutorial.video_url,
      thumbnail_url: tutorial.thumbnail_url || "",
      category: tutorial.category,
      order: tutorial.order || 0,
      is_active: tutorial.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir este tutorial?")) {
      await SystemTutorial.delete(id);
      loadTutorials();
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await UploadFile({ file });
      setFormData({ ...formData, thumbnail_url: file_url });
    } catch (error) {
      alert("Erro ao fazer upload da miniatura");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <Button
            onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Tutorial do Sistema
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial, index) => (
          <motion.div
            key={tutorial.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card border-0 neon-glow hover:scale-105 transition-transform">
              <CardHeader className="p-0">
                {tutorial.thumbnail_url ? (
                  <img
                    src={tutorial.thumbnail_url}
                    alt={tutorial.title}
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-t-xl flex items-center justify-center">
                    <PlayCircle className="w-16 h-16 text-purple-400" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{tutorial.title}</h3>
                    <p className="text-purple-300 text-sm mt-1 line-clamp-2">
                      {tutorial.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-purple-400">
                    <Eye className="w-4 h-4" />
                    {tutorial.views_count || 0} visualizações
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(tutorial)}
                      className="h-8 w-8"
                    >
                      <Edit className="w-4 h-4 text-purple-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tutorial.id)}
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {editingTutorial ? "Editar Tutorial" : "Novo Tutorial do Sistema"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-purple-200">Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-purple-900/20 border-purple-700/50 text-white"
              />
            </div>

            <div>
              <Label className="text-purple-200">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-purple-900/20 border-purple-700/50 text-white"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-purple-200">URL do Vídeo (YouTube)</Label>
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                required
                placeholder="https://www.youtube.com/watch?v=..."
                className="bg-purple-900/20 border-purple-700/50 text-white"
              />
            </div>

            <div>
              <Label className="text-purple-200">Miniatura</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="bg-purple-900/20 border-purple-700/50 text-white"
              />
              {formData.thumbnail_url && (
                <img src={formData.thumbnail_url} alt="Preview" className="mt-2 w-full h-32 object-cover rounded" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-purple-200">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {editingTutorial ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}