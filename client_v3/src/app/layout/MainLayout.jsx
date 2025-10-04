import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ThemeProvider from "../providers";
import ThemeToggle from "@/design-system/ds/ThemeToggle";
import StatusBar from "./StatusBar";
import { Sparkles } from "lucide-react";

export default function MainLayout({ children }) {
  const [active, setActive] = useState("dashboard");

  return (
    <ThemeProvider>
      <div className="min-h-screen w-full flex bg-gray-50 dark:bg-[#0a0f1a] text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Sidebar */}
        <Sidebar active={active} onSelect={setActive} />

        {/* Main section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* HEADER */}
          <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b dark:bg-[#0b1120]/80 dark:border-white/10 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 grid place-items-center shadow-wow">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                    Athlos Suite Pro
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Smart Club Management Platform
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 grid place-items-center shadow-wow text-white font-semibold">
                  AC
                </div>
              </div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-10">{children}</div>
          </main>

          {/* FOOTER */}
          <footer className="bg-white/80 backdrop-blur-md border-t dark:bg-[#0b1120]/80 dark:border-white/10 text-xs text-gray-600 dark:text-gray-400">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <span>© 2025 Athlos Suite Pro · v3.0</span>
              <span className="italic">Developed by Alessandro Canfora</span>
            </div>
          </footer>

          {/* STATUS BAR */}
          <StatusBar />
        </div>
      </div>
    </ThemeProvider>
  );
}
