// Percorso: client_v3/src/design-system/ds/PageLoading.jsx
import React from 'react';
import PageHeader from './PageHeader';
import LoadingSpinner from './LoadingSpinner';

const PageLoading = ({ 
  title, 
  description, 
  height = 'h-64',
  showText = false,
  text = 'Caricamento...'
}) => {
  return (
    <div className="space-y-6">
      {title && (
        <PageHeader
          title={title}
          description={description}
        />
      )}
      <div className={`flex items-center justify-center ${height}`}>
        <LoadingSpinner 
          size="default" 
          showText={showText}
          text={text}
        />
      </div>
    </div>
  );
};

export default PageLoading;



















