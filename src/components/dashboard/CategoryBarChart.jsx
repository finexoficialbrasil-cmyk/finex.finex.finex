import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart3 } from "lucide-react";

export default function CategoryBarChart({ transactions, categories, type = "all" }) {
  const categoryData = useMemo(() => {
    const categoryMap = {};
    
    transactions
      .filter(t => {
        if (type === "all") return t.status === "completed";
        return t.type === type && t.status === "completed";
      })
      .forEach(t => {
        const cat = categories.find(c => c.id === t.category_id);
        const catName = cat?.name || "Sem categoria";
        
        if (!categoryMap[catName]) {
          categoryMap[catName] = {
            name: catName,
            receitas: 0,
            despesas: 0
          };
        }
        
        if (t.type === "income") {
          categoryMap[catName].receitas += t.amount;
        } else {
          categoryMap[catName].despesas += t.amount;
        }
      });
    
    return Object.values(categoryMap)
      .sort((a, b) => (b.receitas + b.despesas) - (a.receitas + a.despesas))
      .slice(0, 8);
  }, [transactions, categories, type]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-purple-900/90 backdrop-blur-sm border border-purple-700/50 rounded-lg p-3">
          <p className="text-white font-bold mb-2">{payload[0].payload.name}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: R$ {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card border-0 neon-glow h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          {type === "expense" ? "Despesas" : type === "income" ? "Receitas" : "Receitas vs Despesas"} por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categoryData.length === 0 ? (
          <div className="text-center py-12 text-purple-300">
            <p>Nenhum dado para exibir</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#a855f750" />
              <XAxis 
                dataKey="name" 
                stroke="#c4b5fd"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: '#c4b5fd', fontSize: 12 }}
              />
              <YAxis 
                stroke="#c4b5fd"
                tick={{ fill: '#c4b5fd', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#c4b5fd' }}
                formatter={(value) => (
                  <span className="text-purple-200">{value}</span>
                )}
              />
              {type !== "expense" && <Bar dataKey="receitas" fill="#10b981" radius={[8, 8, 0, 0]} />}
              {type !== "income" && <Bar dataKey="despesas" fill="#ef4444" radius={[8, 8, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}