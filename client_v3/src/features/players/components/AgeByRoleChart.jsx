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
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-3 text-purple-400">{label}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm font-medium">
                Età Media: <span className="text-white font-bold">{data.etaMedia} anni</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium">
                Giocatori: <span className="text-white font-bold">{data.giocatori}</span>
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
        <p>Nessun dato età per ruolo disponibile</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="ageByRoleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="role" 
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
            label={{ value: 'Età Media (anni)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          <Bar 
            dataKey="etaMedia" 
            fill="url(#ageByRoleGradient)" 
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
