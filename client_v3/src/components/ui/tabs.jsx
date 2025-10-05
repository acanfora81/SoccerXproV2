import React from 'react';

export const Tabs = ({ children, value, onValueChange, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { value, onValueChange })
      )}
    </div>
  );
};

export const TabsList = ({ children, value, onValueChange, className = '' }) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1 ${className}`}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { currentValue: value, onValueChange })
      )}
    </div>
  );
};

export const TabsTrigger = ({ children, value: tabValue, currentValue, onValueChange, className = '' }) => {
  const isActive = currentValue === tabValue;
  
  return (
    <button
      onClick={() => onValueChange(tabValue)}
      className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium 
        ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none 
        disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-800
        ${isActive 
          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-50' 
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
};
