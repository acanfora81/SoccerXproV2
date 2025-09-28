import React from 'react';

export default function SkeletonBox({ height = 20, width = '100%', className = '', style = {} }) {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ height, width, ...style }}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox 
          key={i} 
          height={16} 
          width={i === lines - 1 ? '60%' : '100%'} 
          className="skeleton-text"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeleton-card skeleton ${className}`} />
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }) {
  return (
    <div className={className}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBox key={i} height={20} width="100%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBox key={colIndex} height={16} width="100%" />
          ))}
        </div>
      ))}
    </div>
  );
}


