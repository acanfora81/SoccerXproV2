import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

// Funzione per tradurre i tipi di contratto
const translateContractType = (contracts) => {
  if (!contracts || !Array.isArray(contracts) || contracts.length === 0) {
    return 'Non specificato';
  }
  
  const latestContract = contracts[0];
  const contractMap = {
    'PERMANENT': 'Permanente',
    'PROFESSIONAL': 'Professionale',
    'LOAN': 'Prestito',
    'TRIAL': 'Prova',
    'YOUTH': 'Giovanile',
    'AMATEUR': 'Dilettante',
    'PART_TIME': 'Part-time'
  };
  return contractMap[latestContract.contractType] || latestContract.contractType || 'Non specificato';
};

export default function ContractDistributionChart({ players }) {
  // Calcola distribuzione contratti
  const contractStats = players.reduce((acc, player) => {
    const contractType = translateContractType(player.contracts);
    acc[contractType] = (acc[contractType] || 0) + 1;
    return acc;
  }, {});

  // Prepara dati per il grafico
  const chartData = Object.entries(contractStats).map(([type, count]) => ({
    name: type,
    value: count,
    percentage: ((count / players.length) * 100).toFixed(1)
  }));

  // Colori per i segmenti
  const COLORS = [
    '#3b82f6', // Blu
    '#10b981', // Verde
    '#f59e0b', // Giallo
    '#ef4444', // Rosso
    '#8b5cf6', // Viola
    '#06b6d4', // Ciano
    '#84cc16', // Lime
    '#f97316'  // Arancione
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Giocatori: {data.value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Percentuale: {data.payload.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Non mostrare etichette per segmenti < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>Nessun dato contrattuale disponibile</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color, fontSize: '12px' }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
