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
import ContractsDashboard from './pages/contracts/ContractsDashboard';
import ExpiringContracts from './pages/contracts/ExpiringContracts';
import TaxRatesUpload from './pages/tax/TaxRatesUpload';
import TaxRatesList from './pages/tax/TaxRatesList';
import BonusTaxRatesUpload from './pages/tax/BonusTaxRatesUpload';
import BonusTaxRatesList from './pages/tax/BonusTaxRatesList';
import RegionalAdditionalsUpload from './pages/tax/RegionalAdditionalsUpload';
import MunicipalAdditionalsUpload from './pages/tax/MunicipalAdditionalsUpload';
import TaxConfigPage from './pages/tax/TaxConfigPage';
import ChoosePlan from './pages/onboarding/ChoosePlan';
import PaymentSim from './pages/onboarding/PaymentSim';
import SetupTeam from './pages/onboarding/SetupTeam';
import PlayersUpload from './pages/players/PlayersUpload';
import ContractsSummary from './pages/ContractsSummary';
import TaxCalculator from './pages/tax/TaxCalculator';
import IrpefBracketsPage from './pages/tax/IrpefBracketsPage';
import IrpefUploadPage from './pages/tax/IrpefUploadPage';
import RegionalAdditionalsPage from './pages/tax/RegionalAdditionalsPage';
import MunicipalAdditionalsPage from './pages/tax/MunicipalAdditionalsPage';
import SignupPage from './pages/SignupPage';
import LandingPage from './pages/LandingPage';
import CheckoutPage from './pages/CheckoutPage';
import NotFound from './pages/NotFound';
import { medicalRoutes } from './routes/medicalRoutes';

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
    return <PageLoader message="Caricamento Dati Amministrativi..." minHeight={360} />;
  }

  return (
    <div className="App">
      <RouteProgress />
      <Routes>
        {/* Route pubbliche (non richiedono autenticazione) */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm onLoginSuccess={() => window.location.reload()} />
        } />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/checkout/:plan" element={<CheckoutPage />} />
        {/* Onboarding pubblico */}
        <Route path="/onboarding/choose-plan" element={<ChoosePlan />} />
        <Route path="/onboarding/payment" element={<PaymentSim />} />
        <Route path="/onboarding/setup-team" element={<SetupTeam />} />
        
        {/* Route private (richiedono autenticazione) */}
        <Route path="/dashboard/*" element={
          !isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
        <FiltersProvider>
          <MainLayout 
            user={user}
            onLogout={handleLogout}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/players" element={<PlayersList />} />
              <Route path="/players/upload" element={<PlayersUpload teamId={user?.teamId} />} />
              <Route path="/players/stats" element={<PlayerStatistics />} />
              <Route path="/performance/team" element={<TeamDashboard />} />
              <Route path="/performance/players" element={<PerformancePlayersListPage />} />
              {/* Redirect legacy per compatibilità */}
              <Route path="/performance/players/list" element={<Navigate to="/dashboard/performance/players" replace />} />
              <Route path="/performance/dossier" element={<Navigate to="/dashboard/performance/players" replace />} />
              <Route path="/performance/dossier/:playerId" element={<DossierPage />} />
              <Route path="/performance/compare" element={<ComparePage />} />
              <Route path="/performance/analytics" element={<AnalyticsAdvanced />} />
              <Route path="/performance/import" element={<PerformanceImport />} />
              <Route path="/performance/reports" element={<Reports />} />
              <Route path="/contracts" element={<ContractsList />} />
              <Route path="/contracts/dashboard" element={<ContractsDashboard />} />
              <Route path="/contracts/expiring" element={<ExpiringContracts />} />
              <Route path="/contracts/summary" element={<ContractsSummary />} />
              <Route path="/taxrates/upload" element={<TaxRatesUpload teamId={user?.teamId} />} />
              <Route path="/taxrates/list" element={<TaxRatesList teamId={user?.teamId} />} />
              <Route path="/bonustaxrates/upload" element={<BonusTaxRatesUpload teamId={user?.teamId} />} />
              <Route path="/bonustaxrates/list" element={<BonusTaxRatesList teamId={user?.teamId} />} />
              <Route path="/regional-additionals/upload" element={<RegionalAdditionalsUpload />} />
              <Route path="/municipal-additionals/upload" element={<MunicipalAdditionalsUpload />} />
              <Route path="/tax-config" element={<TaxConfigPage />} />
              <Route path="/tax/calculator" element={<TaxCalculator />} />
              <Route path="/tax/irpef-brackets" element={<IrpefBracketsPage />} />
              <Route path="/tax/irpef-upload" element={<IrpefUploadPage />} />
              <Route path="/tax/regional-additionals" element={<RegionalAdditionalsPage />} />
              <Route path="/tax/municipal-additionals" element={<MunicipalAdditionalsPage />} />
              {/* Medical Routes */}
              {medicalRoutes('/dashboard/medical')}
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
          )
        } />
      </Routes>
    </div>
  );
}

export default App;
