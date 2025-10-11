import { Activity, TrendingUp, Users, Zap, Target, HeartPulse, AlertTriangle } from "lucide-react";
import { formatItalianNumber } from '@/utils/italianNumbers';

export default function OverviewSection({ data, players }) {
  if (!data) return null;

  const readiness = data.readiness || {};
  const alerts = data.alerts || [];

  return (
    <div className="rounded-md border dark:border-white/10 p-4 bg-gray-50 dark:bg-[#0f1424]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Panoramica Generale
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Metric label="Sessioni Totali" value={formatItalianNumber(data.summary?.totalSessions || 0)} icon={<Users className="w-4 h-4 text-blue-400" />} />
        <Metric label="Distanza Totale" value={`${formatItalianNumber(data.load?.totalDistance || 0)} m`} icon={<TrendingUp className="w-4 h-4 text-green-400" />} />
        <Metric label="Velocità Media" value={`${formatItalianNumber(data.summary?.avgSpeed || 0, 1)} km/h`} icon={<Zap className="w-4 h-4 text-yellow-400" />} />
        <Metric label="Player Load Medio" value={formatItalianNumber(data.summary?.avgPlayerLoad || 0, 0)} icon={<Target className="w-4 h-4 text-red-400" />} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Metric label="ACWR medio" value={formatItalianNumber(readiness.avgACWR || 0, 2)} icon={<HeartPulse className="w-4 h-4 text-pink-400" />} />
        <Metric label="Monotony" value={formatItalianNumber(readiness.avgMonotony || 0, 2)} icon={<TrendingUp className="w-4 h-4 text-orange-400" />} />
        <Metric label="Freshness" value={formatItalianNumber(readiness.avgFreshness || 0, 2)} icon={<Activity className="w-4 h-4 text-green-400" />} />
      </div>

      {alerts?.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" /> Alert Recenti
          </h4>
          <ul className="space-y-1">
            {alerts.map((a, i) => (
              <li key={i} className={`text-xs ${
                a.level === "danger" ? "text-red-500" :
                a.level === "warning" ? "text-yellow-400" : "text-gray-400"
              }`}>
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="bg-white dark:bg-[#0f1424] rounded-xl p-4 border border-gray-200/50 dark:border-white/10 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value ?? "-"}
      </div>
    </div>
  );
}


