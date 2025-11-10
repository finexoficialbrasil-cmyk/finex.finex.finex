import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCardPro({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  trend, 
  sparklineData = [] 
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const isPositive = trend?.startsWith("+");
  
  // Animar número contando
  useEffect(() => {
    const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (isNaN(numericValue)) return;
    
    const duration = 1000;
    const steps = 30;
    const increment = numericValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);

  const formatDisplayValue = (val) => {
    if (value.includes('R$')) {
      return `R$ ${val.toFixed(2)}`;
    }
    return val.toFixed(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="glass-card border-0 relative overflow-hidden group">
        {/* Gradient Background on Hover */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
        />
        
        {/* Sparkline Background */}
        {sparklineData.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-20 opacity-20">
            <svg width="100%" height="100%" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points={sparklineData.map((val, i) => 
                  `${(i / (sparklineData.length - 1)) * 100},${100 - (val / Math.max(...sparklineData)) * 80}`
                ).join(' ')}
              />
            </svg>
          </div>
        )}

        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-purple-300 text-sm font-medium mb-1">
                {title}
              </p>
              <motion.h3
                className="text-3xl font-bold text-white"
                key={displayValue}
              >
                {formatDisplayValue(displayValue)}
              </motion.h3>
            </div>
            
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
            >
              <Icon className="w-6 h-6 text-white" />
            </motion.div>
          </div>

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                isPositive ? 'bg-green-600/20' : 'bg-red-600/20'
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
                <span className={`text-xs font-bold ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trend}
                </span>
              </div>
              <span className="text-xs text-purple-400">vs. mês anterior</span>
            </div>
          )}
        </CardContent>

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 5
          }}
        />
      </Card>
    </motion.div>
  );
}