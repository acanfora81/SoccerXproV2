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
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-3 text-blue-400">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium">
                {entry.name}: <span className="text-white font-bold">{entry.value}</span>
                {entry.name.includes('altezza') ? ' cm' : entry.name.includes('peso') ? ' kg' : ''}
              </span>
            </div>
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
          <defs>
            <linearGradient id="altezzaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.6}/>
            </linearGradient>
            <linearGradient id="pesoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="role" 
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
            label={{ value: 'Altezza (cm)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
            label={{ value: 'Peso (kg)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          <Legend 
            wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
          />
          <Bar 
            yAxisId="left"
            dataKey="altezzaMedia" 
            fill="url(#altezzaGradient)" 
            name="Altezza Media (cm)"
            radius={[6, 6, 0, 0]}
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="pesoMedio" 
            stroke="url(#pesoGradient)" 
            strokeWidth={4}
            name="Peso Medio (kg)"
            dot={{ fill: '#10B981', strokeWidth: 3, r: 6 }}
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
