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

  // Colori per ruolo
  const roleColors = {
    'Portiere': '#3b82f6',
    'Difensore': '#10b981', 
    'Centrocampista': '#f59e0b',
    'Attaccante': '#ef4444'
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ruolo: <span style={{ color: roleColors[data.role] }}>{data.role}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Altezza: {data.x} cm
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Peso: {data.y} kg
          </p>
          {data.age && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Età: {data.age} anni
            </p>
          )}
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
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Altezza"
            unit="cm"
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Altezza (cm)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Peso"
            unit="kg"
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter 
            data={chartData} 
            fill="#8884d8"
            animationBegin={0}
            animationDuration={800}
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
