import { AlertTriangle } from "lucide-react";

export default function AlertPanel({ alerts }) {
  if (!alerts?.length) return null;
  return (
    <div className="mt-4 border-t pt-3">
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400" /> Alert Recenti
      </h4>
      <ul className="space-y-1">
        {alerts.map((a, i) => (
          <li key={i} className={`text-sm ${
            a.level === "danger" ? "text-red-500" :
            a.level === "warning" ? "text-yellow-400" : "text-gray-400"
          }`}>
            {a.message}
          </li>
        ))}
      </ul>
    </div>
  );
}


