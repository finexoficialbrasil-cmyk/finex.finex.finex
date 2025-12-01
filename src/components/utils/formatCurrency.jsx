// Formata número para moeda brasileira (R$ 1.234,56)
export const formatCurrencyBR = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Formata apenas número sem R$ (1.234,56)
export const formatNumberBR = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0,00';
  
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};