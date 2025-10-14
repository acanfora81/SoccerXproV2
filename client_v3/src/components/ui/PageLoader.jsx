import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoader = ({ message = "Caricamento dati...", minHeight = 220 }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center gap-4" 
      style={{ minHeight }}
    >
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
};

export default PageLoader;




















