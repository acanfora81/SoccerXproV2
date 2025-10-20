import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function JerseyNumberHistogram({ players }) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i*10+1}-${(i+1)*10}`, count: 0 }));
  players.forEach(p => {
    const n = Number(p.shirtNumber) || 0;
    if (n <= 0) return;
    const idx = Math.min(9, Math.floor((n-1)/10));
    buckets[idx].count += 1;
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-2 text-amber-400">Numeri {label}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm">Giocatori: <span className="font-bold text-white">{payload[0].value}</span></span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="jnGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="range" stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
          <YAxis stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          <Bar dataKey="count" fill="url(#jnGradient)" radius={[6,6,0,0]} animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}






