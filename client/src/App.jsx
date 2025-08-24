// client/src/App.jsx
// App principale con sistema di autenticazione Zustand e layout

import { useEffect, useState } from 'react';
import useAuthStore from './store/authStore';
import LoginForm from './components/auth/LoginForm';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/dashboard/Dashboard';
import PlayersList from './components/players/PlayersList';
import './styles/themes.css';
import './styles/layout.css';
import './styles/dashboard.css';
import PlayerStatistics from './components/players/PlayerStatistics';

function App() {
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

  // Render del contenuto in base alla sezione attiva
  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'players':
        return <PlayersList />;
      case 'players-stats':
        return <PlayerStatistics />;
      case 'contracts':
        return (
          <div className="page-placeholder">
            <h2>Gestione Contratti</h2>
            <p>Modulo in sviluppo - Contratti e scadenze</p>
          </div>
        );
      case 'medical':
        return (
          <div className="page-placeholder">
            <h2>Area Medica</h2>
            <p>Modulo in sviluppo - Infortuni e visite mediche</p>
          </div>
        );
      case 'market':
        return (
          <div className="page-placeholder">
            <h2>Mercato</h2>
            <p>Modulo in sviluppo - Trasferimenti e scouting</p>
          </div>
        );
      case 'administration':
        return (
          <div className="page-placeholder">
            <h2>Amministrazione</h2>
            <p>Modulo in sviluppo - Budget e amministrazione</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '10px' }}>⚽</div>
          <div>Caricamento SoccerXpro V2...</div>
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
          onSectionChange={setCurrentSection}
          user={user}
          onLogout={handleLogout}
        >
          {renderContent()}
        </MainLayout>
      )}
    </div>
  );
}

export default App;