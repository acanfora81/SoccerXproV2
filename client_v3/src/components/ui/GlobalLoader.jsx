// =============================================
// 🌐 GLOBAL LOADER — SOCCER X PRO SUITE (Dynamic)
// =============================================
// Mostra automaticamente il nome della sezione corrente
// =============================================

import React from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SECTION_NAMES, DEFAULT_SECTION_NAME } from "@/utils/sectionNames";

export default function GlobalLoader({ fullscreen = true, isVisible = true }) {
  const location = useLocation();

  // Trova nome sezione dalla mappa (ordine importante: specifici prima)
  const currentPath = location.pathname;
  const sectionName =
    SECTION_NAMES.find(({ path }) => currentPath.startsWith(path))?.name ||
    DEFAULT_SECTION_NAME;
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="global-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={
            fullscreen
              ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0f1a] dark:bg-[#0a0e18] text-gray-300"
              : "flex flex-col items-center justify-center py-10 text-center"
          }
        >
          {/* Spinner */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center"
          >
            <div className="absolute w-14 h-14 rounded-full border-4 border-gray-600/20" />
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </motion.div>

          {/* Text */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-sm md:text-base font-medium text-gray-300 dark:text-gray-200"
          >
            Caricamento in corso di{" "}
            <span className="font-semibold text-blue-400">{sectionName}</span>…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
