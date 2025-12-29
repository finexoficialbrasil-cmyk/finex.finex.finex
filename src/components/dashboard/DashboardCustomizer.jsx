import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Eye, EyeOff, Grid3x3, Calendar, BarChart3, PieChart, TrendingUp, DollarSign, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const AVAILABLE_WIDGETS = [
  { id: "stats", name: "Resumo Financeiro", icon: DollarSign, description: "Cards com valores totais" },
  { id: "bills-summary", name: "Contas a Pagar/Receber", icon: Calendar, description: "Previsao de contas pendentes" },
  { id: "expenses-pie", name: "Despesas (Pizza)", icon: PieChart, description: "Grafico de pizza por categoria" },
  { id: "category-bar", name: "Categorias (Barras)", icon: BarChart3, description: "Comparativo de categorias" },
  { id: "balance-evolution", name: "Evolucao do Saldo", icon: TrendingUp, description: "Linha do tempo do saldo" },
  { id: "cashflow", name: "Fluxo de Caixa", icon: Calendar, description: "Entradas vs Saidas" },
  { id: "accounts", name: "Minhas Contas", icon: Grid3x3, description: "Lista de contas" },
  { id: "quick-actions", name: "Acoes Rapidas", icon: Zap, description: "Atalhos para acoes comuns" },
  { id: "goals", name: "Metas Financeiras", icon: TrendingUp, description: "Progresso das metas" },
  { id: "transactions", name: "Ultimas Transacoes", icon: BarChart3, description: "Historico recente" }
];

export default function DashboardCustomizer({ 
  visibleWidgets, 
  onToggleWidget, 
  period,
  onPeriodChange,
  chartType,
  onChartTypeChange 
}) {
  const [showCustomizer, setShowCustomizer] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowCustomizer(true)}
        variant="outline"
        className="border-purple-700 text-purple-300 hover:bg-purple-900/30"
      >
        <Settings className="w-4 h-4 mr-2" />
        Personalizar Dashboard
      </Button>

      <Dialog open={showCustomizer} onOpenChange={setShowCustomizer}>
        <DialogContent className="glass-card border-purple-700/50 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              <Settings className="w-6 h-6 inline mr-2 text-purple-400" />
              Personalizar Dashboard
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Configuracoes Globais */}
            <Card className="bg-purple-900/20 border-purple-700/30">
              <CardHeader>
                <CardTitle className="text-white text-lg">Configuracoes Globais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-purple-200 mb-2 block">Periodo de Analise</Label>
                  <Select value={period} onValueChange={onPeriodChange}>
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Ultima Semana</SelectItem>
                      <SelectItem value="month">Mes Atual</SelectItem>
                      <SelectItem value="year">Ano Atual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-purple-200 mb-2 block">Tipo de Grafico (Categorias)</Label>
                  <Select value={chartType} onValueChange={onChartTypeChange}>
                    <SelectTrigger className="bg-purple-900/20 border-purple-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Receitas + Despesas</SelectItem>
                      <SelectItem value="income">Apenas Receitas</SelectItem>
                      <SelectItem value="expense">Apenas Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Widgets Disponiveis */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Widgets Disponiveis</h3>
              <p className="text-purple-300 text-sm mb-4">
                Clique para mostrar/ocultar widgets no seu dashboard
              </p>
              
              <div className="grid gap-3">
                {AVAILABLE_WIDGETS.map(widget => {
                  const Icon = widget.icon;
                  const isVisible = visibleWidgets.includes(widget.id);
                  
                  return (
                    <div
                      key={widget.id}
                      onClick={() => onToggleWidget(widget.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                        isVisible 
                          ? 'bg-purple-600/30 border-2 border-purple-500' 
                          : 'bg-purple-900/20 border-2 border-purple-900/30 opacity-60'
                      } hover:scale-105`}
                    >
                      <div className={`p-3 rounded-lg ${
                        isVisible 
                          ? 'bg-purple-500/30' 
                          : 'bg-purple-900/30'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isVisible ? 'text-purple-300' : 'text-purple-500'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-white">{widget.name}</p>
                          <Badge className={
                            isVisible 
                              ? 'bg-green-600/20 text-green-400' 
                              : 'bg-gray-600/20 text-gray-400'
                          }>
                            {isVisible ? (
                              <><Eye className="w-3 h-3 mr-1" /> Visivel</>
                            ) : (
                              <><EyeOff className="w-3 h-3 mr-1" /> Oculto</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-purple-300">{widget.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-purple-700/30">
              <Button
                onClick={() => setShowCustomizer(false)}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Concluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}