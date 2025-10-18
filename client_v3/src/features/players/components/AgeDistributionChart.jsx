import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Funzione per calcolare l'età dalla data di nascita
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function AgeDistributionChart({ players }) {
  // Calcola distribuzione per fasce d'età
  const ageGroups = {
    '16-20': 0,
    '21-25': 0,
    '26-30': 0,
    '31-35': 0,
    '36+': 0
  };

  players.forEach(player => {
    const age = calculateAge(player.dateOfBirth);
    if (age !== null) {
      if (age >= 16 && age <= 20) ageGroups['16-20']++;
      else if (age >= 21 && age <= 25) ageGroups['21-25']++;
      else if (age >= 26 && age <= 30) ageGroups['26-30']++;
      else if (age >= 31 && age <= 35) ageGroups['31-35']++;
      else if (age >= 36) ageGroups['36+']++;
    }
  });

  // Prepara dati per il grafico
  const chartData = Object.entries(ageGroups).map(([range, count]) => ({
    range,
    count,
    percentage: players.length > 0 ? ((count / players.length) * 100).toFixed(1) : 0
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-3 text-orange-400">Fascia {label} anni</p>
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
            <linearGradient id="ageGradient" x1="0" y1="0" x2="0" y2="1">
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
            fill="url(#ageGradient)" 
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
