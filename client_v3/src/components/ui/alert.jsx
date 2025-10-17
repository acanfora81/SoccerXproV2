import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

const alertVariants = {
  default: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
  destructive: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200',
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
};

const alertIcons = {
  default: Info,
  destructive: XCircle,
  warning: AlertTriangle,
  success: CheckCircle
};

export const Alert = ({ 
  children, 
  variant = 'default', 
  className = '',
  ...props 
}) => {
  const Icon = alertIcons[variant];
  
  return (
    <div 
      className={`
        relative w-full rounded-lg border p-4 
        ${alertVariants[variant]}
        ${className}
      `}
      {...props}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AlertDescription = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`text-sm [&_p]:leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};




