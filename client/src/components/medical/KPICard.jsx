import React from 'react';
import { motion } from 'framer-motion';

export default function KPICard({ value, label, icon, hint, trend, onClick, delay = 0 }) {
  const getTrendColor = (trend) => {
    if (!trend) return '';
    if (trend > 0) return 'color: var(--medical-success)';
    if (trend < 0) return 'color: var(--medical-danger)';
    return 'color: var(--medical-info)';
  };

  const getTrendIcon = (trend) => {
    if (!trend) return '';
    if (trend > 0) return '📈';
    if (trend < 0) return '📉';
    return '➡️';
  };

  return (
    <motion.div 
      className="kpi-card fade-in" 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: delay,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <div className="kpi-value">
        {icon && <span>{icon}</span>}
        <span>{value}</span>
        {trend && (
          <span style={{ fontSize: '16px', ...getTrendColor(trend) }}>
            {getTrendIcon(trend)}
          </span>
        )}
      </div>
      <div className="kpi-label">{label}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </motion.div>
  );
}
