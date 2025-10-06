import React from 'react';

const ExportModal = ({ 
  show, 
  exportFormat, 
  setExportFormat, 
  onConfirm, 
  onCancel 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Esporta Dati</h3>
          <button 
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={onCancel}
            aria-label="Chiudi"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
              <input
                type="radio"
                name="exportFormat"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">CSV (.csv)</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Formato semplice, compatibile con Excel</div>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
              <input
                type="radio"
                name="exportFormat"
                value="excel"
                checked={exportFormat === 'excel'}
                onChange={(e) => setExportFormat(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Excel (.xlsx)</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Formato nativo Excel con formattazione</div>
              </div>
            </label>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-end gap-2">
          <button 
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
            onClick={onCancel}
          >
            Annulla
          </button>
          <button 
            type="button"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onConfirm}
          >
            Esporta
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
