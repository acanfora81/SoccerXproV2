// client/src/App.jsx
// App principale con sistema di autenticazione Zustand e routing React Router

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { FiltersProvider } from './modules/filters/index.js';
import LoginForm from './components/auth/LoginForm';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/dashboard/Dashboard';
import PlayersList from './components/players/PlayersList';
import PlayerStatistics from './components/players/PlayerStatistics';
import PerformanceImport from './components/performance/PerformanceImport';
import Analytics from './components/analytics/Analytics';
import TeamDashboard from './components/analytics/TeamDashboard';
import AnalyticsAdvanced from './components/analytics/AnalyticsAdvanced';
import Reports from './components/analytics/Reports';
import PerformancePlayersListPage from './pages/performance/PlayersList';
import PerformancePlayersDossier from './pages/performance/PlayersDossier';
import DossierPage from './pages/performance/DossierPage';
import ComparePage from './pages/performance/ComparePage';
import ContractsList from './pages/contracts/ContractsList';
import ExpiringContracts from './pages/contracts/ExpiringContracts';
import NotFound from './pages/NotFound';

// 🎨 STILI GLOBALI AGGIORNATI - IMPORTANTE!
import './index.css'; // ← Questo contiene TUTTI i CSS importati
import RouteProgress from './components/ui/RouteProgress';
import PageLoader from './components/ui/PageLoader';

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
  };

  // Loading state
  if (isLoading) {
    return <PageLoader message="Caricamento dati amministrativi..." minHeight={360} />;
  }

  return (
    <div className="App">
      <RouteProgress />
      {!isAuthenticated ? (
        <LoginForm />
      ) : (
        <FiltersProvider>
          <MainLayout 
            user={user}
            onLogout={handleLogout}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/players" element={<PlayersList />} />
              <Route path="/players/stats" element={<PlayerStatistics />} />
              <Route path="/performance/team" element={<TeamDashboard />} />
              <Route path="/performance/players" element={<PerformancePlayersListPage />} />
              {/* Redirect legacy per compatibilità */}
              <Route path="/performance/players/list" element={<Navigate to="/performance/players" replace />} />
              <Route path="/performance/dossier" element={<Navigate to="/performance/players" replace />} />
              <Route path="/performance/dossier/:playerId" element={<DossierPage />} />
              <Route path="/performance/compare" element={<ComparePage />} />
              <Route path="/performance/analytics" element={<AnalyticsAdvanced />} />
              <Route path="/performance/import" element={<PerformanceImport />} />
              <Route path="/performance/reports" element={<Reports />} />
              <Route path="/contracts" element={<ContractsList />} />
              <Route path="/contracts/expiring" element={<ExpiringContracts />} />
              <Route path="/medical" element={
                <div className="page-placeholder"><h2>Area Medica</h2><p>Modulo in sviluppo - Infortuni e visite mediche</p></div>
              } />
              <Route path="/market" element={
                <div className="page-placeholder"><h2>Mercato</h2><p>Modulo in sviluppo - Trasferimenti e scouting</p></div>
              } />
              <Route path="/administration" element={
                <div className="page-placeholder"><h2>Amministrazione</h2><p>Modulo in sviluppo - Budget e amministrazione</p></div>
              } />
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </FiltersProvider>
      )}
    </div>
  );
}

export default App;
