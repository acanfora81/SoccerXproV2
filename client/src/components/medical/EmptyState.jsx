import React from 'react';
import { motion } from 'framer-motion';

export default function EmptyState({ 
  title, 
  message, 
  action, 
  icon = '📋',
  className = '' 
}) {
  return (
    <motion.div 
      className={`empty-state fade-in ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </motion.div>
  );
}

export function EmptyStateWithIllustration({ 
  title, 
  message, 
  action, 
  illustration,
  className = '' 
}) {
  return (
    <motion.div 
      className={`empty-state fade-in ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {illustration && (
        <div style={{ marginBottom: 16, fontSize: '64px', opacity: 0.6 }}>
          {illustration}
        </div>
      )}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </motion.div>
  );
}