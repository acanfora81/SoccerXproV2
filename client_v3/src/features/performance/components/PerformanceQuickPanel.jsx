// Percorso: client_v3/src/features/performance/components/PerformanceQuickPanel.jsx
import { useEffect, useState } from 'react';
import { statsByPlayer } from '@/features/performance/api/performanceApi';
import { Activity, TrendingUp, Zap, Target } from 'lucide-react';

export default function PerformanceQuickPanel({ playerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!playerId) return;
    
    setLoading(true);
    statsByPlayer(playerId)
      .then((response) => {
        setData(response?.data || response || null);
      })
      .catch((error) => {
        console.error('Errore caricamento stats performance:', error);
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [playerId]);

  if (!playerId) return null;
  
  if (loading) {
    return (
      <div className="rounded-md border dark:border-white/10 p-4 bg-gray-50 dark:bg-[#0f1424]">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Caricamento performance…</span>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="rounded-md border dark:border-white/10 p-4 bg-gray-50 dark:bg-[#0f1424]">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Nessun dato performance disponibile
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border dark:border-white/10 p-4 bg-gray-50 dark:bg-[#0f1424]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Snapshot Performance</span>
        </div>
        <a 
          className="text-xs text-primary hover:underline flex items-center gap-1" 
          href={`/app/dashboard/performance/dossier/${playerId}`}
        >
          Apri Dossier →
        </a>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#111827] rounded border dark:border-white/10">
          <Zap className="w-4 h-4 text-yellow-500" />
          <div className="flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">HSR</div>
            <div className="font-semibold text-sm">{data.hsr_m ? `${data.hsr_m} m` : '-'}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#111827] rounded border dark:border-white/10">
          <TrendingUp className="w-4 h-4 text-red-500" />
          <div className="flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">Sprint</div>
            <div className="font-semibold text-sm">{data.sprint_m ? `${data.sprint_m} m` : '-'}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#111827] rounded border dark:border-white/10">
          <Activity className="w-4 h-4 text-blue-500" />
          <div className="flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">Distanza Tot</div>
            <div className="font-semibold text-sm">{data.distance_km ? `${data.distance_km} km` : '-'}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#111827] rounded border dark:border-white/10">
          <Target className="w-4 h-4 text-green-500" />
          <div className="flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">Load</div>
            <div className="font-semibold text-sm">{data.load ?? '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

















