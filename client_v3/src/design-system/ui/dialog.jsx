import { createContext, useContext, useState } from "react";
import { cn } from "../../lib/utils/cn";

const DialogContext = createContext();

export function Dialog({ children, open, onOpenChange }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogContent({ children, className }) {
  const { open, onOpenChange } = useContext(DialogContext);
  
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className={cn(
        "relative bg-white dark:bg-[#0f1424] rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 max-w-md w-full mx-4",
        className
      )}>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children }) {
  return <div className="px-6 py-4 border-b dark:border-white/10">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{children}</h2>;
}

export function DialogDescription({ children }) {
  return <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{children}</p>;
}

export function DialogFooter({ children }) {
  return <div className="px-6 py-4 border-t dark:border-white/10 flex justify-end gap-3">{children}</div>;
}
