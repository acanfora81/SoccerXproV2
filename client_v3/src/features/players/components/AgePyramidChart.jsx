import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const calcAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const translateRole = (position) => ({
  GOALKEEPER: 'Portiere', DEFENDER: 'Difensore', MIDFIELDER: 'Centrocampista', FORWARD: 'Attaccante'
}[position] || position || '-');

export default function AgePyramidChart({ players }) {
  const buckets = ['16-20','21-25','26-30','31-35','36+'];
  const roles = ['Portiere','Difensore','Centrocampista','Attaccante'];
  const dataMap = new Map(buckets.map(b => [b, Object.fromEntries(roles.map(r => [r, 0]))]));

  players.forEach(p => {
    const age = calcAge(p.dateOfBirth);
    if (age == null) return;
    let b = null;
    if (age <= 20) b = '16-20';
    else if (age <= 25) b = '21-25';
    else if (age <= 30) b = '26-30';
    else if (age <= 35) b = '31-35';
    else b = '36+';
    const role = translateRole(p.position);
    if (!dataMap.has(b)) return;
    if (!(role in dataMap.get(b))) return;
    dataMap.get(b)[role] += 1;
  });

  const data = buckets.map(b => ({
    range: b,
    Portiere: dataMap.get(b)['Portiere'],
    Difensore: dataMap.get(b)['Difensore'],
    Centrocampista: dataMap.get(b)['Centrocampista'],
    Attaccante: dataMap.get(b)['Attaccante'],
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    const total = payload.reduce((s, e) => s + (e.value || 0), 0);
    return (
      <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
        <p className="font-semibold text-lg mb-2 text-purple-400">Fascia {label}</p>
        {payload.map((e, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
            <span>{e.name}: <span className="font-bold">{e.value}</span></span>
          </div>
        ))}
        <div className="mt-2 text-sm text-gray-300">Totale: <span className="font-bold text-white">{total}</span></div>
      </div>
    );
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="pyrG1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="pyrG2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="pyrG3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="pyrG4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
          <YAxis dataKey="range" type="category" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          <Bar dataKey="Portiere" stackId="a" fill="url(#pyrG1)" radius={[6,6,6,6]} />
          <Bar dataKey="Difensore" stackId="a" fill="url(#pyrG2)" radius={[6,6,6,6]} />
          <Bar dataKey="Centrocampista" stackId="a" fill="url(#pyrG3)" radius={[6,6,6,6]} />
          <Bar dataKey="Attaccante" stackId="a" fill="url(#pyrG4)" radius={[6,6,6,6]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}





