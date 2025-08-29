// client/src/App.jsx
// App principale con sistema di autenticazione Zustand e layout AGGIORNATO

import { useEffect, useState } from 'react';
import useAuthStore from './store/authStore';
import LoginForm from './components/auth/LoginForm';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/dashboard/Dashboard';
import PlayersList from './components/players/PlayersList';
import PlayerStatistics from './components/players/PlayerStatistics';
import PerformanceImport from './components/performance/PerformanceImport';
import Analytics from './components/analytics/Analytics';
import AnalyticsAdvanced from './components/analytics/AnalyticsAdvanced';
import Reports from './components/analytics/Reports';

// 🎨 STILI GLOBALI AGGIORNATI - IMPORTANTE!
import './index.css'; // ← Questo contiene TUTTI i CSS importati

function App() {
  // 🎨 Applicazione tema al caricamento
  useEffect(() => {
    const savedTheme = localStorage.getItem('soccerxpro-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);
  // Hook per lo store di autenticazione
  const {
    user,
    isAuthenticated,
    isLoading,
    checkAuth,
    logout
  } = useAuthStore();

  // State locale per la navigazione
  const [currentSection, setCurrentSection] = useState('dashboard');

  console.log('🔵 App renderizzato, isAuthenticated:', isAuthenticated); // INFO DEV - rimuovere in produzione

  // Verifica autenticazione al caricamento
  useEffect(() => {
    console.log('🔵 App: verifica autenticazione iniziale'); // INFO DEV - rimuovere in produzione
    checkAuth();
  }, [checkAuth]);

  // Handler per logout
  const handleLogout = async () => {
    console.log('🔵 App: logout richiesto'); // INFO DEV - rimuovere in produzione
    await logout();
    setCurrentSection('dashboard'); // Reset sezione dopo logout
  };

  // Handler cambio sezione dalla sidebar
  const handleSectionChange = (section) => {
    setCurrentSection(section);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner">⚽</div>
          <div className="loading-text">Caricamento SoccerXpro V2...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {!isAuthenticated ? (
        <LoginForm />
      ) : (
        <MainLayout 
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
          user={user}
          onLogout={handleLogout}
        >
          {currentSection === 'dashboard' && <Dashboard />}
          {currentSection === 'players' && <PlayersList />}
          {currentSection === 'players-stats' && <PlayerStatistics />}
          {currentSection === 'performance-import' && <PerformanceImport />}
          {currentSection === 'performance-analytics' && <Analytics />}
          {currentSection === 'performance-analytics-advanced' && <AnalyticsAdvanced />}
          {currentSection === 'performance-reports' && <Reports />}
          {currentSection === 'contracts' && (
            <div className="page-placeholder"><h2>Gestione Contratti</h2><p>Modulo in sviluppo - Contratti e scadenze</p></div>
          )}
          {currentSection === 'medical' && (
            <div className="page-placeholder"><h2>Area Medica</h2><p>Modulo in sviluppo - Infortuni e visite mediche</p></div>
          )}
          {currentSection === 'market' && (
            <div className="page-placeholder"><h2>Mercato</h2><p>Modulo in sviluppo - Trasferimenti e scouting</p></div>
          )}
          {currentSection === 'administration' && (
            <div className="page-placeholder"><h2>Amministrazione</h2><p>Modulo in sviluppo - Budget e amministrazione</p></div>
          )}
        </MainLayout>
      )}
    </div>
  );
}

export default App;
