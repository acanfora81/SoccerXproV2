// CountTooltip per i grafici di conteggio contratti della dashboard contratti
import React from 'react';

const CountTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <div className="mb-2">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        </div>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{entry.name}:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {entry.value} contratti
                {entry.payload?.percentage && (
                  <span className="text-gray-500 dark:text-gray-400 ml-1">({entry.payload.percentage}%)</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default CountTooltip;
