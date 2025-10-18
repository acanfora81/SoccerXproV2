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
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-3 text-green-400">{data.nationality}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
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
          <defs>
            <linearGradient id="nationalityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="nationality" 
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          <Bar 
            dataKey="count" 
            fill="url(#nationalityGradient)" 
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
