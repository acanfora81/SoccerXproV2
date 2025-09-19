// CountTooltip per i grafici di conteggio contratti della dashboard contratti
import React from 'react';

const CountTooltip = ({ active, payload, label }) => {
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
                {entry.value} contratti
                {entry.payload?.percentage && (
                  <span className="tooltip-percentage"> ({entry.payload.percentage}%)</span>
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








