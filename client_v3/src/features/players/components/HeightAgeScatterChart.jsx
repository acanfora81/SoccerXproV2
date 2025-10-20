import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const calcAge = (dob) => {
  if (!dob) return null;
  const t = new Date();
  const b = new Date(dob);
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
};

export default function HeightAgeScatterChart({ players }) {
  const data = players
    .map(p => ({ age: calcAge(p.dateOfBirth), height: Number(p.height) || 0 }))
    .filter(d => Number.isFinite(d.age) && d.height > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700 shadow-xl">
          <div className="text-sm">Età: <span className="font-bold">{d.age}</span></div>
          <div className="text-sm">Altezza: <span className="font-bold">{d.height} cm</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis type="number" dataKey="age" name="Età" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
          <YAxis type="number" dataKey="height" name="Altezza" unit="cm" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          <Scatter data={data}>
            {data.map((d, i) => (
              <Cell key={i} fill="#60A5FA" />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}






