// CustomTooltip per i grafici della dashboard contratti
import React from 'react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <div className="mb-2">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        </div>
        <div className="space-y-1">
          {payload.map((entry, index) => {
            // Determina se è un grafico di conteggio contratti o di valori economici
            const isContractCount = entry.payload?.originalRole || 
                                   (entry.name && (entry.name.includes('Portieri') || entry.name.includes('Difensori') || 
                                    entry.name.includes('Centrocampisti') || entry.name.includes('Attaccanti')));
            
            return (
              <div key={`item-${index}`} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{entry.name}:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {isContractCount ? 
                    `${entry.value} contratti` :
                    entry.payload?.percentage ? 
                      `${entry.value} contratti (${entry.payload.percentage}%)` :
                      entry.payload?.count ? 
                        `${new Intl.NumberFormat("it-IT", { 
                          style: "currency", 
                          currency: "EUR",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(entry.value)} (${entry.payload.count} contratti)` :
                        new Intl.NumberFormat("it-IT", { 
                          style: "currency", 
                          currency: "EUR",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(entry.value)
                  }
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
