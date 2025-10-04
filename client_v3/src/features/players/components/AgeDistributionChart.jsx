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
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">Fascia {label} anni</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
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
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]}
            animationBegin={0}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
