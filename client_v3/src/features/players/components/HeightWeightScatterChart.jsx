import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

export default function HeightWeightScatterChart({ players }) {
  // Prepara dati per il grafico (solo giocatori con altezza e peso)
  const chartData = players
    .filter(player => player.height && player.weight && player.height > 0 && player.weight > 0)
    .map(player => ({
      x: player.height,
      y: player.weight,
      name: `${player.firstName} ${player.lastName}`,
      role: translateRole(player.position),
      age: player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : null
    }));

  // Colori moderni per ruolo
  const roleColors = {
    'Portiere': '#3B82F6',
    'Difensore': '#10B981', 
    'Centrocampista': '#F59E0B',
    'Attaccante': '#EF4444'
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-3 text-blue-400">{data.name}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: roleColors[data.role] }}
              />
              <span className="text-sm font-medium">
                Ruolo: <span className="text-white font-bold">{data.role}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium">
                Altezza: <span className="text-white font-bold">{data.x} cm</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">
                Peso: <span className="text-white font-bold">{data.y} kg</span>
              </span>
            </div>
            {data.age && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm font-medium">
                  Età: <span className="text-white font-bold">{data.age} anni</span>
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>Nessun dato fisico disponibile</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Altezza"
            unit="cm"
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
            label={{ value: 'Altezza (cm)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Peso"
            unit="kg"
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
            label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          <Scatter 
            data={chartData} 
            fill="#8884d8"
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={roleColors[entry.role] || '#8884d8'} 
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Legenda colori */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {Object.entries(roleColors).map(([role, color]) => (
          <div key={role} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">{role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
