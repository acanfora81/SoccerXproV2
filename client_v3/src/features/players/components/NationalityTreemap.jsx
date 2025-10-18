import React from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

export default function NationalityTreemap({ players }) {
  const counts = players.reduce((acc, p) => {
    const n = p.nationality || 'Non specificata';
    acc[n] = (acc[n] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700 shadow-xl">
          <div className="font-semibold text-blue-400 mb-1">{d.name}</div>
          <div className="text-sm">Giocatori: <span className="font-bold">{d.value}</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          ratio={4/3}
          stroke="#0f172a"
          fill="#3B82F6"
          content={({ x, y, width, height, name, index }) => (
            <g>
              <rect x={x} y={y} width={width} height={height} rx={8} ry={8} fill={index % 2 === 0 ? '#3B82F6' : '#1D4ED8'} opacity={0.85} />
              {width > 60 && height > 20 && (
                <text x={x + 8} y={y + 18} fill="#fff" fontSize={12} fontWeight="600">{name}</text>
              )}
            </g>
          )}
        >
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}





