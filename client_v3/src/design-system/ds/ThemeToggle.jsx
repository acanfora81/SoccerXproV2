import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../app/providers";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const btn = "px-3 py-1.5 rounded-lg text-sm border transition flex items-center justify-center";
  const active = "bg-gray-100 dark:bg-white/20 border-gray-300 dark:border-white/30";
  const inactive = "hover:bg-gray-50 dark:hover:bg-white/10 border-gray-200 dark:border-white/10";

  return (
    <div className="inline-flex items-center gap-2">
      <button onClick={() => setTheme("light")} className={`${btn} ${theme==="light" ? active : inactive}`}>
        <Sun className="w-4 h-4" />
      </button>
      <button onClick={() => setTheme("dark")} className={`${btn} ${theme==="dark" ? active : inactive}`}>
        <Moon className="w-4 h-4" />
      </button>
      <button onClick={() => setTheme("system")} className={`${btn} ${theme==="system" ? active : inactive}`}>
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
