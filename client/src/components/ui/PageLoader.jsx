import React from 'react';
import { Loader2 } from 'lucide-react';
import '../../styles/loading.css';

const PageLoader = ({ message = 'Caricamento dati...', minHeight = 220 }) => {
  return (
    <div className="sx-loader" style={{ minHeight }}>
      <Loader2 className="sx-loader__spinner" size={28} />
      <p className="sx-loader__text">{message}</p>
    </div>
  );
};

export default PageLoader;
