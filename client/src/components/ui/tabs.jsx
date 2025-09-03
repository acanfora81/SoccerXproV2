import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

export function Tabs({ value, onValueChange, children, className = "" }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`tabs ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "" }) {
  return (
    <div className={`tabs-list ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = "" }) {
  const { value: selectedValue, onValueChange } = useContext(TabsContext);
  const isSelected = selectedValue === value;
  
  return (
    <button
      className={`tabs-trigger ${isSelected ? 'selected' : ''} ${className}`}
      onClick={() => onValueChange(value)}
      data-value={value}
    >
      {children}
    </button>
  );
}


