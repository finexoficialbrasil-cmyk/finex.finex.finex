import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Goal, Transaction } from "@/entities/all";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  PiggyBank,
  TrendingUp,
  Star,
  CheckCircle,
  MoreVertical,
  DollarSign,
  Info,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import SubscriptionGuard from "../components/SubscriptionGuard";
import FeatureGuard from "../components/FeatureGuard";

const icons = [
  "✈️", "🚗", "🏠", "🎓", "💼", "💻", "📱", "🎁", "🎉", "❤️", "🏖️", "🚀"
];

const colors = [
  "from-purple-600 to-pink-500",
  "from-blue-600 to-cyan-500",
  "from-green-600 to-teal-500",
  "from-yellow-500 to-amber-500",
  "from-red-500 to-orange-500",
  "from-indigo-500 to-violet-500"
];

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ NOVO: Estado de submissão
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_amount: "",
    current_amount: "",
    deadline: new Date(),
    icon: icons[0],
    color: colors[0],
    status: "active"
  });

  const [contributionAmount, setContributionAmount] = useState("");
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [contributingGoal, setContributingGoal] = useState(null);
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false); // ✅ NOVO

  useEffect(() => {
    loadGoals();
    document.title = "Metas Financeiras - FINEX";
  }, []);

  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await Goal.list("-created_date");
      setGoals(data);
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFormSubmit = async (e) => {
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
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || 0),
        deadline: format(formData.deadline, 'yyyy-MM-dd')
      };

      if (editingGoal) {
        await Goal.update(editingGoal.id, data);
      } else {
        await Goal.create(data);
      }

      resetForm();
      loadGoals();
    } catch (error) {
      console.error("❌ Erro ao salvar meta:", error);
      alert("Erro ao salvar meta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setShowForm(false);
    setEditingGoal(null);
    setFormData({
      title: "",
      description: "",
      target_amount: "",
      current_amount: "",
      deadline: new Date(),
      icon: icons[0],
      color: colors[0],
      status: "active"
    });
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      target_amount: goal.target_amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      current_amount: goal.current_amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      deadline: new Date(goal.deadline),
      icon: goal.icon,
      color: goal.color,
      status: goal.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir esta meta?")) {
      await Goal.delete(id);
      loadGoals();
    }
  };

  const handleOpenContribution = (goal) => {
    setContributingGoal(goal);
    setShowContributionModal(true);
    setContributionAmount("");
  };

  const handleContributionSubmit = async () => {
    // ✅ BLOQUEAR cliques duplos
    if (isSubmittingContribution) {
      console.log("⚠️ Já está processando, ignorando clique duplo");
      return;
    }
    
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) return;

    setIsSubmittingContribution(true);
    
    try {
      const newCurrentAmount = (contributingGoal.current_amount || 0) + amount;
      
      await Goal.update(contributingGoal.id, {
        current_amount: newCurrentAmount
      });

      setShowContributionModal(false);
      setContributingGoal(null);
      loadGoals();
    } catch (error) {
      console.error("❌ Erro ao fazer aporte:", error);
      alert("Erro ao fazer aporte. Tente novamente.");
    } finally {
      setIsSubmittingContribution(false);
    }
  };
  
  const handleMarkAsCompleted = async (goal) => {
     if (confirm("Tem certeza que deseja marcar esta meta como concluída?")) {
        await Goal.update(goal.id, { status: 'completed', current_amount: goal.target_amount });
        loadGoals();
     }
  };


  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.status === 'completed'), [goals]);

  return (
    <SubscriptionGuard>
      <FeatureGuard featureName="has_goals" featureLabel="Metas Financeiras">
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                <Target className="w-8 h-8" />
                Metas Financeiras
              </h1>
              <p className="text-purple-300 mt-2">
                Defina, acompanhe e conquiste seus objetivos financeiros.
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 neon-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Meta
            </Button>
          </motion.div>
          
          {isLoading ? (
            <div className="text-center text-purple-300">Carregando metas...</div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Metas Ativas ({activeGoals.length})</h2>
              {activeGoals.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {activeGoals.map((goal, index) => {
                      const progress = (goal.current_amount / goal.target_amount) * 100;
                      const daysLeft = differenceInDays(new Date(goal.deadline), new Date());
                      const isOverdue = isBefore(new Date(goal.deadline), new Date()) && daysLeft < 0;

                      return (
                        <motion.div
                          key={goal.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="glass-card border-0 neon-glow h-full flex flex-col">
                            <CardHeader className="flex-shrink-0">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${goal.color} flex items-center justify-center text-3xl`}>
                                    {goal.icon}
                                  </div>
                                  <div>
                                    <CardTitle className="text-xl text-white">{goal.title}</CardTitle>
                                    <p className="text-sm text-purple-300 line-clamp-1">{goal.description}</p>
                                  </div>
                                </div>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-300"><MoreVertical className="w-4 h-4" /></Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-2">
                                    <Button variant="ghost" className="w-full justify-start" onClick={() => handleEdit(goal)}><Edit className="w-4 h-4 mr-2" /> Editar</Button>
                                    <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-500" onClick={() => handleDelete(goal.id)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</Button>
                                    <Button variant="ghost" className="w-full justify-start" onClick={() => handleMarkAsCompleted(goal)}><CheckCircle className="w-4 h-4 mr-2" /> Concluir</Button>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col justify-between">
                              <div className="space-y-4">
                                <div className="text-center">
                                  <p className="text-3xl font-bold text-white">
                                    R$ {goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-sm text-purple-300">
                                    de R$ {goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <div>
                                  <Progress value={progress} className={`[&>*]:bg-gradient-to-r ${goal.color}`} />
                                  <p className="text-center text-sm font-bold mt-2" style={{ color: `var(--tw-gradient-from)` }}>{progress.toFixed(1)}%</p>
                                </div>
                                <div className="flex justify-between text-xs text-purple-400">
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    {isOverdue ? (
                                      <span className="text-red-400">Atrasado</span>
                                    ) : (
                                      <span>{daysLeft} dias restantes</span>
                                    )}
                                  </div>
                                  <Badge variant="outline" className={`border-opacity-50 text-xs ${goal.status === 'active' ? 'border-green-500 text-green-400' : 'border-gray-500 text-gray-400'}`}>
                                    {goal.status === 'active' ? 'Ativa' : 'Pausada'}
                                  </Badge>
                                </div>
                              </div>
                              <Button 
                                onClick={() => handleOpenContribution(goal)}
                                className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                              >
                                <DollarSign className="w-4 h-4 mr-2" /> Fazer Aporte
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <Card className="glass-card border-dashed border-purple-800/60">
                  <CardContent className="p-12 text-center">
                    <Target className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">Nenhuma meta ativa</h3>
                    <p className="text-purple-300 mt-2">Comece a planejar seus sonhos. Crie sua primeira meta!</p>
                    <Button onClick={() => setShowForm(true)} className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600">
                      <Plus className="w-4 h-4 mr-2" /> Criar Meta
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {completedGoals.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-white mt-12 mb-6">Metas Concluídas ({completedGoals.length})</h2>
                  <div className="space-y-3">
                    {completedGoals.map(goal => (
                      <Card key={goal.id} className="glass-card border-0 neon-glow opacity-70">
                        <CardContent className="p-4 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${goal.color} flex items-center justify-center text-2xl`}>
                              {goal.icon}
                            </div>
                            <div>
                              <p className="font-semibold text-white line-through">{goal.title}</p>
                              <p className="text-xs text-purple-300">Concluída em {format(new Date(goal.updated_date), 'dd/MM/yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-green-400 font-bold">
                            <CheckCircle className="w-5 h-5" />
                            R$ {goal.target_amount.toLocaleString('pt-BR')}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          
          {/* Formulário Modal */}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="glass-card border-purple-700/50 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  <Target />
                  {editingGoal ? 'Editar Meta Financeira' : 'Criar Nova Meta'}
                </DialogTitle>
                <DialogDescription className="text-purple-300">
                  Defina os detalhes do seu objetivo para começar a economizar.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
                <div>
                  <Label className="text-purple-200">Nome da Meta</Label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="bg-purple-900/20 border-purple-700/50 text-white" />
                </div>
                <div>
                  <Label className="text-purple-200">Descrição (Opcional)</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-purple-900/20 border-purple-700/50 text-white" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-purple-200">Valor Alvo (R$)</Label>
                    <Input type="number" step="0.01" value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} required className="bg-purple-900/20 border-purple-700/50 text-white" />
                  </div>
                  <div>
                    <Label className="text-purple-200">Valor Inicial (R$)</Label>
                    <Input type="number" step="0.01" value={formData.current_amount} onChange={e => setFormData({...formData, current_amount: e.target.value})} className="bg-purple-900/20 border-purple-700/50 text-white" />
                  </div>
                </div>
                <div>
                  <Label className="text-purple-200">Data Limite</Label>
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-purple-900/20 border-purple-700/50 hover:bg-purple-900/30 text-white">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.deadline ? format(formData.deadline, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={formData.deadline} onSelect={date => setFormData({...formData, deadline: date})} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                   <div>
                      <Label className="text-purple-200">Ícone</Label>
                      <Select value={formData.icon} onValueChange={value => setFormData({...formData, icon: value})}>
                         <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-2xl"><SelectValue /></SelectTrigger>
                         <SelectContent>
                            {icons.map(icon => <SelectItem key={icon} value={icon} className="text-2xl">{icon}</SelectItem>)}
                         </SelectContent>
                      </Select>
                   </div>
                   <div>
                      <Label className="text-purple-200">Cor</Label>
                      <Select value={formData.color} onValueChange={value => setFormData({...formData, color: value})}>
                         <SelectTrigger className="bg-purple-900/20 border-purple-700/50">
                            <SelectValue>
                               <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${formData.color}`} />
                                  <span>{formData.color.split(" ")[0].replace('from-','').replace('-600','')}</span>
                               </div>
                            </SelectValue>
                         </SelectTrigger>
                         <SelectContent>
                            {colors.map(color => (
                               <SelectItem key={color} value={color}>
                                  <div className="flex items-center gap-2">
                                     <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${color}`} />
                                     <span>{color.split(" ")[0].replace('from-','').replace('-600','')}</span>
                                  </div>
                               </SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>
                </div>
                 <DialogFooter>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={resetForm}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        editingGoal ? 'Salvar Alterações' : 'Criar Meta'
                      )}
                    </Button>
                 </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Modal de Aporte */}
          <Dialog open={showContributionModal} onOpenChange={setShowContributionModal}>
             <DialogContent className="glass-card border-purple-700/50 text-white">
                <DialogHeader>
                   <DialogTitle className="text-xl">Fazer Aporte na Meta</DialogTitle>
                   <DialogDescription>Quanto você quer adicionar à sua meta "{contributingGoal?.title}"?</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                   <Label>Valor do Aporte (R$)</Label>
                   <Input type="number" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} placeholder="Ex: 150.00" className="bg-purple-900/20 border-purple-700/50 text-white" />
                   <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg text-xs text-blue-200 flex items-start gap-2">
                      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>Este valor será adicionado ao montante atual da sua meta, mas não criará uma transação de "saída" em suas contas.</span>
                   </div>
                </div>
                <DialogFooter>
                   <Button 
                     variant="ghost" 
                     onClick={() => setShowContributionModal(false)}
                     disabled={isSubmittingContribution}
                   >
                     Cancelar
                   </Button>
                   <Button 
                     onClick={handleContributionSubmit} 
                     className="bg-gradient-to-r from-green-500 to-emerald-500"
                     disabled={isSubmittingContribution}
                   >
                     {isSubmittingContribution ? (
                       <>
                         <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                         Adicionando...
                       </>
                     ) : (
                       'Adicionar'
                     )}
                   </Button>
                </DialogFooter>
             </DialogContent>
          </Dialog>
        </div>
      </FeatureGuard>
    </SubscriptionGuard>
  );
}