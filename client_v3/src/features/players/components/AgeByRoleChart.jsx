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

// Funzione per tradurre i ruoli
const translateRole = (position) => {
  const roleMap = {
    'GOALKEEPER': 'Portiere',
    'DEFENDER': 'Difensore',
    'MIDFIELDER': 'Centrocampista',
    'FORWARD': 'Attaccante'
  };
  return roleMap[position] || position || '-';
};

export default function AgeByRoleChart({ players }) {
  // Calcola età media per ruolo
  const roleAgeStats = players.reduce((acc, player) => {
    const role = translateRole(player.position);
    const age = calculateAge(player.dateOfBirth);
    
    if (!acc[role]) {
      acc[role] = {
        role,
        totalAge: 0,
        count: 0,
        players: []
      };
    }
    
    if (age !== null) {
      acc[role].totalAge += age;
      acc[role].count++;
      acc[role].players.push({ ...player, age });
    }
    
    return acc;
  }, {});

  // Prepara dati per il grafico
  const chartData = Object.values(roleAgeStats)
    .filter(stat => stat.count > 0)
    .map(stat => ({
      role: stat.role,
      etaMedia: (stat.totalAge / stat.count).toFixed(1),
      giocatori: stat.count
    }))
    .sort((a, b) => parseFloat(a.etaMedia) - parseFloat(b.etaMedia));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Età Media: {data.etaMedia} anni
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Giocatori: {data.giocatori}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>Nessun dato età per ruolo disponibile</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="role" 
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
            label={{ value: 'Età Media (anni)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="etaMedia" 
            fill="#8b5cf6" 
            radius={[4, 4, 0, 0]}
            animationBegin={0}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
