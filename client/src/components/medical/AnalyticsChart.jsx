import React from 'react';

// Simple chart components without external dependencies
export function LineAnalytics({ data, xKey, yKey, color = '#4f46e5', title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        opacity: 0.7 
      }}>
        Nessun dato disponibile
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d[yKey] || 0));
  const minValue = Math.min(...data.map(d => d[yKey] || 0));
  const range = maxValue - minValue || 1;

  return (
    <div style={{ height: 300, position: 'relative' }}>
      {title && <h4 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>{title}</h4>}
      <div style={{ 
        height: 250, 
        border: '1px solid var(--border-color, #2a2a2a)', 
        borderRadius: '8px',
        padding: '16px',
        position: 'relative',
        background: 'var(--card-bg, #111)'
      }}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1="0"
              y1={ratio * 200}
              x2="100%"
              y2={ratio * 200}
              stroke="var(--border-color, #2a2a2a)"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 200 - ((d[yKey] - minValue) / range) * 200;
              return `${x}%,${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 200 - ((d[yKey] - minValue) / range) * 200;
            return (
              <circle
                key={i}
                cx={`${x}%`}
                cy={y}
                r="4"
                fill={color}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div style={{ 
          position: 'absolute', 
          left: '-40px', 
          top: '0', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          fontSize: '12px',
          opacity: 0.7
        }}>
          {[maxValue, minValue + range * 0.5, minValue].map((value, i) => (
            <span key={i}>{Math.round(value)}</span>
          ))}
        </div>
        
        {/* X-axis labels */}
        <div style={{ 
          position: 'absolute', 
          bottom: '-20px', 
          left: '0', 
          right: '0', 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '12px',
          opacity: 0.7
        }}>
          {data.map((d, i) => (
            <span key={i}>{d[xKey]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const COLORS = ['#4f46e5', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#06b6d4'];

export function PieAnalytics({ data, dataKey, nameKey, title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        opacity: 0.7 
      }}>
        Nessun dato disponibile
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);
  let currentAngle = 0;

  return (
    <div style={{ height: 300, position: 'relative' }}>
      {title && <h4 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>{title}</h4>}
      <div style={{ 
        height: 250, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px solid var(--border-color, #2a2a2a)', 
        borderRadius: '8px',
        background: 'var(--card-bg, #111)'
      }}>
        <svg width="200" height="200" style={{ marginRight: '20px' }}>
          {data.map((item, i) => {
            const value = item[dataKey] || 0;
            const percentage = (value / total) * 100;
            const angle = (value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle += angle;

            const radius = 80;
            const centerX = 100;
            const centerY = 100;

            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
            const endAngleRad = (endAngle - 90) * (Math.PI / 180);

            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            return (
              <path
                key={i}
                d={pathData}
                fill={COLORS[i % COLORS.length]}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        
        {/* Legend */}
        <div style={{ fontSize: '12px' }}>
          {data.map((item, i) => {
            const value = item[dataKey] || 0;
            const percentage = ((value / total) * 100).toFixed(1);
            return (
              <div key={i} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '8px' 
              }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: COLORS[i % COLORS.length],
                  marginRight: '8px',
                  borderRadius: '2px'
                }} />
                <span>{item[nameKey]}: {percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function BarAnalytics({ data, xKey, yKey, color = '#4f46e5', title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        opacity: 0.7 
      }}>
        Nessun dato disponibile
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d[yKey] || 0));

  return (
    <div style={{ height: 300, position: 'relative' }}>
      {title && <h4 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>{title}</h4>}
      <div style={{ 
        height: 250, 
        border: '1px solid var(--border-color, #2a2a2a)', 
        borderRadius: '8px',
        padding: '16px',
        background: 'var(--card-bg, #111)',
        display: 'flex',
        alignItems: 'end',
        justifyContent: 'space-around'
      }}>
        {data.map((d, i) => {
          const height = ((d[yKey] || 0) / maxValue) * 200;
          return (
            <div key={i} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              height: '100%',
              justifyContent: 'end'
            }}>
              <div style={{ 
                width: '30px', 
                height: `${height}px`, 
                backgroundColor: color,
                borderRadius: '4px 4px 0 0',
                marginBottom: '8px',
                minHeight: '4px'
              }} />
              <span style={{ 
                fontSize: '12px', 
                opacity: 0.7,
                transform: 'rotate(-45deg)',
                whiteSpace: 'nowrap'
              }}>
                {d[xKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
