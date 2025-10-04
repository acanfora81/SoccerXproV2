import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function StatusBar() {
  const [status, setStatus] = useState("checking");
  const [lastCheck, setLastCheck] = useState(null);

  const checkHealth = async () => {
    try {
      const res = await fetch("/api/health");
      setStatus(res.ok ? "online" : "offline");
    } catch {
      setStatus("offline");
    } finally {
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const color =
    status === "online"
      ? "bg-green-500"
      : status === "offline"
      ? "bg-red-500"
      : "bg-yellow-500 animate-pulse";

  const label =
    status === "online"
      ? "Backend Online"
      : status === "offline"
      ? "Backend Offline"
      : "Verifica in corso...";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-border-light dark:border-border-dark text-sm z-50">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
          <span className="font-medium">{label}</span>
          {lastCheck && (
            <span className="text-xs text-gray-400">
              Ultimo controllo: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </div>

        <button
          onClick={checkHealth}
          className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <RefreshCw size={14} /> Riprova
        </button>
      </div>
    </div>
  );
}
