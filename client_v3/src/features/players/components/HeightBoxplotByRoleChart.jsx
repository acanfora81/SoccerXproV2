import React, { useMemo } from "react";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ErrorBar } from "recharts";

const translateRole = (position) => ({
  GOALKEEPER: 'Portiere', DEFENDER: 'Difensore', MIDFIELDER: 'Centrocampista', FORWARD: 'Attaccante'
}[position] || position || '-');

const quantile = (arr, q) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a,b)=>a-b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base] + (sorted[base + 1] !== undefined ? rest * (sorted[base + 1] - sorted[base]) : 0);
};

export default function HeightBoxplotByRoleChart({ players }) {
  const roles = ['Portiere','Difensore','Centrocampista','Attaccante'];
  const data = useMemo(() => {
    const byRole = Object.fromEntries(roles.map(r => [r, []]));
    players.forEach(p => {
      const r = translateRole(p.position);
      const h = Number(p.height) || 0;
      if (byRole[r] && h > 0) byRole[r].push(h);
    });
    return roles.map(r => {
      const arr = byRole[r];
      const min = arr.length ? Math.min(...arr) : 0;
      const max = arr.length ? Math.max(...arr) : 0;
      const q1 = Math.round(quantile(arr, 0.25));
      const med = Math.round(quantile(arr, 0.5));
      const q3 = Math.round(quantile(arr, 0.75));
      const iqrLow = q1; // usiamo ErrorBar per whiskers min/max
      const iqrHigh = q3;
      return { role: r, q1, med, q3, min, max, box: iqrHigh - iqrLow };
    });
  }, [players]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="font-semibold text-lg mb-2 text-blue-400">{label}</p>
          <div className="text-sm space-y-1">
            <div>Min: <span className="font-bold">{d.min} cm</span></div>
            <div>Q1: <span className="font-bold">{d.q1} cm</span></div>
            <div>Mediana: <span className="font-bold">{d.med} cm</span></div>
            <div>Q3: <span className="font-bold">{d.q3} cm</span></div>
            <div>Max: <span className="font-bold">{d.max} cm</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="boxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="role" stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
          <YAxis stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
          {/* Box = barra tra Q1 e Q3 */}
          <Bar dataKey="box" stackId="a" fill="url(#boxGradient)" radius={[6,6,0,0]}
               shape={(props) => {
                 const { x, y, width, height, payload } = props;
                 // disegna rettangolo da Q1 a Q3 calcolando altezza relativa
                 const chartHeight = props.background?.height || height;
                 const top = y; // già posizionato correttamente da Recharts
                 return <rect x={x} y={top} width={width} height={height} rx={6} ry={6} fill="url(#boxGradient)"/>;
               }}
          />
          {/* Whiskers min/max via ErrorBar centrato sulla mediana */}
          <ErrorBar dataKey="med" width={0} data={[{ x:0, y:0 }]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}






