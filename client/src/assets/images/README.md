# Logo Soccer X Pro Suite

## Come aggiungere il logo reale

### 1. Preparare l'immagine del logo
- Formato consigliato: PNG con trasparenza
- Dimensioni consigliate: 512x512px (per alta qualità)
- Nome file: `logo.png`

### 2. Posizionare il file
```
client/src/assets/images/logo.png
```

### 3. Sostituire il componente Logo
Nel file `client/src/components/ui/Logo.jsx`, sostituire il contenuto con:

```jsx
import React from 'react';

const Logo = ({ 
  size = 'medium', 
  showText = false, 
  className = '',
  style = {} 
}) => {
  const sizeMap = {
    small: { width: 24, height: 24 },
    medium: { width: 32, height: 32 },
    large: { width: 48, height: 48 },
    xlarge: { width: 64, height: 64 }
  };

  const logoSize = sizeMap[size] || sizeMap.medium;

  return (
    <div className={`logo-container ${className}`} style={style}>
      <img 
        src="/src/assets/images/logo.png"
        alt="Soccer X Pro Suite Logo"
        className="logo-image"
        style={{
          width: logoSize.width,
          height: logoSize.height,
          objectFit: 'contain',
          marginRight: showText ? '8px' : '0'
        }}
      />
      
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
```

### 4. Alternative per il percorso dell'immagine
Se l'immagine non viene caricata, puoi provare questi percorsi:
- `./assets/images/logo.png`
- `../../assets/images/logo.png`
- Importare l'immagine: `import logoSrc from '../../assets/images/logo.png'`

### 5. Ottimizzazioni
- Per migliori performance, considera di creare versioni multiple del logo:
  - `logo-24.png` (24x24px)
  - `logo-32.png` (32x32px)
  - `logo-48.png` (48x48px)
  - `logo-64.png` (64x64px)

### 6. Test
Dopo aver aggiunto il logo, testa in:
- Sidebar (MainLayout)
- Pagina di login
- Modalità scura/chiara
- Dimensioni responsive
