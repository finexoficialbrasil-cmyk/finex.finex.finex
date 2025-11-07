import React, { useState, useEffect } from "react";
import { SystemNotification } from "@/entities/SystemNotification";
import { Card, CardContent } from "@/components/ui/card";
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
import { Bell, Plus, Edit, Trash2, AlertCircle, Info, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const typeIcons = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  error: XCircle
};

const typeColors = {
  info: "from-blue-600 to-cyan-600",
  warning: "from-yellow-600 to-orange-600",
  success: "from-green-600 to-emerald-600",
  error: "from-red-600 to-pink-600"
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    priority: "medium",
    is_active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    link_url: ""
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const data = await SystemNotification.list("-created_date");
    setNotifications(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingNotification) {
      await SystemNotification.update(editingNotification.id, formData);
    } else {
      await SystemNotification.create(formData);
    }
    
    resetForm();
    loadNotifications();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingNotification(null);
    setFormData({
      title: "",
      message: "",
      type: "info",
      priority: "medium",
      is_active: true,
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      link_url: ""
    });
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      is_active: notification.is_active,
      start_date: notification.start_date,
      end_date: notification.end_date || "",
      link_url: notification.link_url || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir esta notificação?")) {
      await SystemNotification.delete(id);
      loadNotifications();
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
            Nova Notificação do Sistema
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {notifications.map((notif, index) => {
          const Icon = typeIcons[notif.type];
          
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`glass-card border-0 neon-glow ${!notif.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${typeColors[notif.type]}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-bold">{notif.title}</h3>
                          {!notif.is_active && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-600 text-gray-300">Inativa</span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            notif.priority === 'urgent' ? 'bg-red-600' :
                            notif.priority === 'high' ? 'bg-orange-600' :
                            notif.priority === 'medium' ? 'bg-yellow-600' :
                            'bg-blue-600'
                          } text-white`}>
                            {notif.priority === 'urgent' ? 'Urgente' :
                             notif.priority === 'high' ? 'Alta' :
                             notif.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                        <p className="text-purple-200 text-sm">{notif.message}</p>
                        {notif.start_date && (
                          <p className="text-purple-400 text-xs mt-2">
                            Início: {new Date(notif.start_date).toLocaleDateString('pt-BR')}
                            {notif.end_date && ` | Fim: ${new Date(notif.end_date).toLocaleDateString('pt-BR')}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(notif)}
                        className="h-8 w-8"
                      >
                        <Edit className="w-4 h-4 text-purple-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(notif.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {editingNotification ? "Editar Notificação" : "Nova Notificação"}
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
              <Label className="text-purple-200">Mensagem</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={3}
                className="bg-purple-900/20 border-purple-700/50 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-purple-200">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-purple-200">Data Início</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>

              <div>
                <Label className="text-purple-200">Data Fim (Opcional)</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="bg-purple-900/20 border-purple-700/50 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-purple-200">Link de Ação (Opcional)</Label>
              <Input
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://..."
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
                {editingNotification ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}