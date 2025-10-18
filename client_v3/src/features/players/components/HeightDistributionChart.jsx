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
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-3 text-orange-400">Fascia {label} cm</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm font-medium">
                Giocatori: <span className="text-white font-bold">{data.count}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium">
                Percentuale: <span className="text-white font-bold">{data.percentage}%</span>
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="heightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#D97706" stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="range" 
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          <Bar 
            dataKey="count" 
            fill="url(#heightGradient)" 
            radius={[6, 6, 0, 0]}
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
