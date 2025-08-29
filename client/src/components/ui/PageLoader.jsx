import React from 'react';
import { Loader2 } from 'lucide-react';
import '../../styles/global.css';

const PageLoader = ({ pageName = "pagina" }) => {
  return (
    <div className="page-loader">
      <div className="loader-content">
        <div className="loader-spinner">
          <Loader2 size={48} className="animate-spin" />
        </div>
        <h2 className="loader-title">
          Caricamento {pageName}
        </h2>
        <p className="loader-subtitle">
          Stiamo preparando i tuoi dati...
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
