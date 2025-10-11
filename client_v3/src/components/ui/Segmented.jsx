import React from 'react';

export default function Segmented({ 
  options = [], 
  value, 
  onChange, 
  className = '' 
}) {
  return (
    <div className={`inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 gap-1 ${className}`}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all
              ${isActive 
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}














