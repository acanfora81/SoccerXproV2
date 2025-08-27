// client/src/components/ui/ThemeToggle.jsx
// 🔄 TOGGLE SWITCH per cambio tema

import { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  // 🔄 Carica tema salvato al mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('soccerxpro-theme');
    const prefersDark = savedTheme === 'dark';
    setIsDark(prefersDark);
    updateTheme(prefersDark);
  }, []);

  // 🎨 Aggiorna tema nel DOM
  const updateTheme = (dark) => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('soccerxpro-theme', dark ? 'dark' : 'light');
  };

  // 🔄 Toggle tema
  const handleToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    updateTheme(newTheme);
    
    console.log(`🎨 Tema cambiato in: ${newTheme ? 'DARK (nero/viola)' : 'LIGHT (bianco/blu)'}`);
  };

  return (
    <div className="theme-toggle">
      <span className="toggle-label">
        {isDark ? 'Tema Scuro' : 'Tema Chiaro'}
      </span>
      <div 
        className="toggle-switch" 
        onClick={handleToggle}
        title={`Cambia in tema ${isDark ? 'chiaro' : 'scuro'}`}
      >
        <div className={`toggle-slider ${isDark ? 'active' : ''}`} />
      </div>
    </div>
  );
};

export default ThemeToggle;