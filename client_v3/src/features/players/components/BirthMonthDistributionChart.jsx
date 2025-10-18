import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export default function BirthMonthDistributionChart({ players }) {
  const counts = Array(12).fill(0);
  players.forEach(p => {
    if (!p.dateOfBirth) return;
    const m = new Date(p.dateOfBirth).getMonth();
    if (Number.isFinite(m)) counts[m]++;
  });
  const data = counts.map((c, i) => ({ month: monthNames[i], count: c }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-2 text-cyan-400">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-sm">Nati: <span className="font-bold text-white">{payload[0].value}</span></span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="bmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#0891B2" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
          <YAxis stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          <Bar dataKey="count" fill="url(#bmGradient)" radius={[6,6,0,0]} animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}





