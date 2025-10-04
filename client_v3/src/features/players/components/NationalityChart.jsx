import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function NationalityChart({ players }) {
  // Calcola distribuzione nazionalità
  const nationalityStats = players.reduce((acc, player) => {
    const nationality = player.nationality || 'Non specificata';
    acc[nationality] = (acc[nationality] || 0) + 1;
    return acc;
  }, {});

  // Prepara dati per il grafico (top 8 nazionalità)
  const chartData = Object.entries(nationalityStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([nationality, count]) => ({
      nationality,
      count,
      percentage: ((count / players.length) * 100).toFixed(1)
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{data.nationality}</p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Giocatori: {data.count}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Percentuale: {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>Nessun dato nazionalità disponibile</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="nationality" 
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]}
            animationBegin={0}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
