// ValueTooltip per i grafici di valori economici della dashboard contratti
import React from 'react';

const ValueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="tooltip-header">
          <p className="tooltip-label">{label}</p>
        </div>
        <div className="tooltip-content">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="tooltip-item">
              <div 
                className="tooltip-color" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="tooltip-name">{entry.name}:</span>
              <span className="tooltip-value">
                {new Intl.NumberFormat("it-IT", { 
                  style: "currency", 
                  currency: "EUR",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(entry.value)}
                {entry.payload?.count && (
                  <span className="tooltip-count"> ({entry.payload.count} contratti)</span>
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

export default ValueTooltip;






















