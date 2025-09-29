import React from 'react';
import logoSrc from '../../assets/images/Logo.png.png';

const Logo = ({ 
  size = 'medium', 
  showText = false, 
  className = '',
  style = {} 
}) => {
  // Dimensioni predefinite per il logo
  const sizeMap = {
    small: { width: 24, height: 24 },
    medium: { width: 32, height: 32 },
    large: { width: 48, height: 48 },
    xlarge: { width: 64, height: 64 },
    fullwidth: { width: '100%', height: 'auto' }
  };

  const logoSize = sizeMap[size] || sizeMap.medium;

  return (
    <div className={`logo-container ${className}`} style={style}>
      {/* Logo con immagine reale */}
      <img 
        src={logoSrc}
        alt="Soccer X Pro Suite Logo"
        className="logo-image"
        style={{
          width: logoSize.width,
          height: logoSize.height,
          objectFit: 'contain',
          marginRight: showText ? '8px' : '0'
        }}
        onError={(e) => {
          // Fallback se l'immagine non viene trovata
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      
      {/* Fallback placeholder (nascosto di default) */}
      <div 
        className="logo-fallback"
        style={{
          width: logoSize.width,
          height: logoSize.height,
          backgroundColor: 'var(--color-primary)',
          borderRadius: '8px',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: `${logoSize.width * 0.4}px`,
          marginRight: showText ? '8px' : '0'
        }}
      >
        SX
      </div>
      
      {showText && (
        <span className="logo-text" style={{ 
          fontSize: `${logoSize.width * 0.6}px`,
          fontWeight: '600',
          color: 'var(--text-color-primary)'
        }}>
          Soccer X Pro Suite
        </span>
      )}
    </div>
  );
};

export default Logo;
