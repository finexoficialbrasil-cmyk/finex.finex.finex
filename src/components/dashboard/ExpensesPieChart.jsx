import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingDown } from "lucide-react";

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

export default function ExpensesPieChart({ transactions, categories }) {
  const expensesByCategory = useMemo(() => {
    const categoryMap = {};
    
    transactions
      .filter(t => t.type === "expense" && t.status === "completed")
      .forEach(t => {
        const cat = categories.find(c => c.id === t.category_id);
        const catName = cat?.name || "Sem categoria";
        
        if (!categoryMap[catName]) {
          categoryMap[catName] = {
            name: catName,
            value: 0,
            color: cat?.color || '#666'
          };
        }
        categoryMap[catName].value += t.amount;
      });
    
    return Object.values(categoryMap).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const total = expensesByCategory.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-purple-900/90 backdrop-blur-sm border border-purple-700/50 rounded-lg p-3">
          <p className="text-white font-bold">{data.name}</p>
          <p className="text-purple-300">R$ {data.value.toFixed(2)}</p>
          <p className="text-purple-400 text-sm">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card border-0 neon-glow h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingDown className="w-5 h-5 text-red-400" />
          Despesas por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        {expensesByCategory.length === 0 ? (
          <div className="text-center py-12 text-purple-300">
            <p>Nenhuma despesa registrada</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span className="text-purple-200 text-sm">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {expensesByCategory.slice(0, 5).map((cat, idx) => {
                const percentage = ((cat.value / total) * 100).toFixed(1);
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color || COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-purple-200">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">R$ {cat.value.toFixed(2)}</p>
                      <p className="text-purple-400 text-xs">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}