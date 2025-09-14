// CustomTooltip per i grafici della dashboard contratti
import React from 'react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="tooltip-header">
          <p className="tooltip-label">{label}</p>
        </div>
        <div className="tooltip-content">
          {payload.map((entry, index) => {
            // Determina se è un grafico di conteggio contratti o di valori economici
            const isContractCount = entry.payload?.originalRole || 
                                   (entry.name && (entry.name.includes('Portieri') || entry.name.includes('Difensori') || 
                                    entry.name.includes('Centrocampisti') || entry.name.includes('Attaccanti')));
            
            return (
              <div key={`item-${index}`} className="tooltip-item">
                <div 
                  className="tooltip-color" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="tooltip-name">{entry.name}:</span>
                <span className="tooltip-value">
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
