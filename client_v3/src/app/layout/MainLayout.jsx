import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ThemeProvider from "../providers";
import ThemeToggle from "@/design-system/ds/ThemeToggle";
import StatusBar from "./StatusBar";
import { Sparkles } from "lucide-react";
import { FiltersProvider } from "@/modules/filters/index.js";

export default function MainLayout() {
  return (
    <ThemeProvider defaultTheme="light" enableSystem={false}>
      <FiltersProvider>
        <div className="min-h-screen w-full flex bg-layout-light dark:bg-layout-dark text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* === SIDEBAR === */}
        <Sidebar />

        {/* === MAIN WRAPPER === */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* === HEADER === */}
          <header className="sticky top-0 z-30 backdrop-blur-md bg-surface-light/80 dark:bg-surface-dark/80 border-b border-border-light dark:border-border-dark shadow-header transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 grid place-items-center shadow-wow">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-text-strong dark:text-white">
                    Soccer X Pro
                  </h1>
                  <p className="text-xs text-text-muted dark:text-gray-400">
                    Smart Club Management Platform
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </header>

          {/* === MAIN CONTENT === */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-10">
              <Outlet />
            </div>
          </main>

          {/* === FOOTER === */}
          <footer className="bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-t border-border-light dark:border-border-dark text-xs text-text-muted dark:text-gray-400 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <span>© 2025 Soccer X Pro · v3.0</span>
              <span className="italic">Developed by Alessandro Canfora</span>
            </div>
          </footer>

          {/* === STATUS BAR === */}
          <StatusBar />
        </div>
      </div>
      </FiltersProvider>
    </ThemeProvider>
  );
}
