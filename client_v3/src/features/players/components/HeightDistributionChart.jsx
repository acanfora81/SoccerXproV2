import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function HeightDistributionChart({ players }) {
  // Calcola distribuzione per fasce di altezza
  const heightGroups = {
    '150-160': 0,
    '161-170': 0,
    '171-180': 0,
    '181-190': 0,
    '191-200': 0,
    '200+': 0
  };

  players.forEach(player => {
    if (player.height && player.height > 0) {
      if (player.height >= 150 && player.height <= 160) heightGroups['150-160']++;
      else if (player.height >= 161 && player.height <= 170) heightGroups['161-170']++;
      else if (player.height >= 171 && player.height <= 180) heightGroups['171-180']++;
      else if (player.height >= 181 && player.height <= 190) heightGroups['181-190']++;
      else if (player.height >= 191 && player.height <= 200) heightGroups['191-200']++;
      else if (player.height > 200) heightGroups['200+']++;
    }
  });

  // Prepara dati per il grafico
  const chartData = Object.entries(heightGroups).map(([range, count]) => ({
    range,
    count,
    percentage: players.length > 0 ? ((count / players.length) * 100).toFixed(1) : 0
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">Fascia {label} cm</p>
          <p className="text-sm text-orange-600 dark:text-orange-400">
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

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="range" 
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            fill="#f59e0b" 
            radius={[4, 4, 0, 0]}
            animationBegin={0}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
