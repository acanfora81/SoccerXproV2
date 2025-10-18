import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const calculateBMI = (hCm, wKg) => {
  if (!hCm || !wKg || hCm <= 0 || wKg <= 0) return null;
  const hM = hCm / 100;
  return Number((wKg / (hM * hM)).toFixed(1));
};

export default function BMIDistributionChart({ players }) {
  const groups = {
    "<18.5": 0,
    "18.5-25": 0,
    "25-30": 0,
    ">=30": 0,
  };

  players.forEach((p) => {
    const bmi = calculateBMI(Number(p.height), Number(p.weight));
    if (bmi == null) return;
    if (bmi < 18.5) groups["<18.5"]++;
    else if (bmi < 25) groups["18.5-25"]++;
    else if (bmi < 30) groups["25-30"]++;
    else groups[">=30"]++;
  });

  const data = Object.entries(groups).map(([range, count]) => ({ range, count }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-2 text-blue-400">BMI {label}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
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
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="bmiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="range" stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
          <YAxis stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          <Bar dataKey="count" fill="url(#bmiGradient)" radius={[6,6,0,0]} animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}





