import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ThemeProvider from "../providers";
import ThemeToggle from "../../design-system/ds/ThemeToggle";

export default function MainLayout({ children }) {
  const [active, setActive] = useState("dashboard");

  return (
    <ThemeProvider>
      <div className="min-h-screen w-full flex bg-gray-50 dark:bg-[#0a0f1a]">
        <Sidebar active={active} onSelect={setActive} />

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b dark:bg-[#0b1120]/70 dark:border-white/10 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Athlos Suite Pro</h1>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-6 py-10">{children}</div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
