import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const translateRole = (position) => ({
  GOALKEEPER: 'Portiere',
  DEFENDER: 'Difensore',
  MIDFIELDER: 'Centrocampista',
  FORWARD: 'Attaccante',
}[position] || position || '-');

const calcBMI = (h, w) => {
  if (!h || !w || h <= 0 || w <= 0) return null;
  const m = h / 100;
  return w / (m*m);
};

export default function BMIByRoleChart({ players }) {
  const roles = ['Portiere','Difensore','Centrocampista','Attaccante'];
  const acc = Object.fromEntries(roles.map(r => [r, { sum: 0, count: 0 }]));
  players.forEach(p => {
    const r = translateRole(p.position);
    const bmi = calcBMI(Number(p.height), Number(p.weight));
    if (!acc[r] || bmi == null) return;
    acc[r].sum += bmi;
    acc[r].count += 1;
  });
  const data = roles.map(r => ({ role: r, bmi: acc[r].count ? Number((acc[r].sum/acc[r].count).toFixed(1)) : 0 }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-2 text-green-400">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">BMI medio: <span className="font-bold text-white">{payload[0].value.toFixed(1)}</span></span>
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
            <linearGradient id="bmiRoleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="role" stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
          <YAxis stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          <Bar dataKey="bmi" fill="url(#bmiRoleGradient)" radius={[6,6,0,0]} animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}





