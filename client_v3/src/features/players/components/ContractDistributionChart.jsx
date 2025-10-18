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

  // Colori moderni per i segmenti
  const COLORS = [
    '#3B82F6', // Blu moderno
    '#10B981', // Verde moderno
    '#F59E0B', // Arancione moderno
    '#EF4444', // Rosso moderno
    '#8B5CF6', // Viola moderno
    '#06B6D4', // Ciano moderno
    '#84CC16', // Lime moderno
    '#F97316'  // Arancione scuro
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-3 text-blue-400">{data.name}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: data.color }}
              />
              <span className="text-sm font-medium">
                Giocatori: <span className="text-white font-bold">{data.value}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium">
                Percentuale: <span className="text-white font-bold">{data.payload.percentage}%</span>
              </span>
            </div>
          </div>
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
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
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
