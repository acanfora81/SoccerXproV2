import React from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Funzione per tradurre i ruoli
const translateRole = (position) => {
  const roleMap = {
    'GOALKEEPER': 'Portiere',
    'DEFENDER': 'Difensore',
    'MIDFIELDER': 'Centrocampista',
    'FORWARD': 'Attaccante'
  };
  return roleMap[position] || position || '-';
};

export default function PhysicalStatsChart({ players }) {
  // Calcola statistiche per ruolo
  const roleStats = players.reduce((acc, player) => {
    const role = translateRole(player.position);
    if (!acc[role]) {
      acc[role] = {
        role,
        count: 0,
        totalHeight: 0,
        totalWeight: 0,
        players: []
      };
    }
    acc[role].count++;
    if (player.height && player.height > 0) {
      acc[role].totalHeight += player.height;
      acc[role].players.push({ ...player, height: player.height });
    }
    if (player.weight && player.weight > 0) {
      acc[role].totalWeight += player.weight;
    }
    return acc;
  }, {});

  // Prepara dati per il grafico
  const chartData = Object.values(roleStats).map(stat => ({
    role: stat.role,
    altezzaMedia: stat.players.length > 0 ? Math.round(stat.totalHeight / stat.players.length) : 0,
    pesoMedio: stat.count > 0 ? Math.round(stat.totalWeight / stat.count) : 0,
    giocatori: stat.count
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.name.includes('altezza') ? 'cm' : entry.name.includes('peso') ? 'kg' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="role" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            yAxisId="left"
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Altezza (cm)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Peso (kg)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="altezzaMedia" 
            fill="#3b82f6" 
            name="Altezza Media (cm)"
            radius={[4, 4, 0, 0]}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="pesoMedio" 
            stroke="#10b981" 
            strokeWidth={3}
            name="Peso Medio (kg)"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
