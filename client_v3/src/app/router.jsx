import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import { AuthProvider } from "@/contexts/AuthContext";

// Onboarding Pages
import LandingPage from "@/pages/LandingPage";
import ChoosePlan from "@/pages/ChoosePlan";
import CheckoutPage from "@/pages/CheckoutPage";
import SetupTeam from "@/pages/SetupTeam";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";

// Dashboard Pages
import Dashboard from "@/features/dashboard/pages/Dashboard";
import PlayersList from "@/features/players/pages/PlayersList";
import PlayersStats from "@/features/players/pages/PlayersStats";
import PlayersUpload from "@/features/players/pages/PlayersUpload";
import ContractsDashboard from "@/features/contracts/pages/ContractsDashboard";
import ContractsList from "@/features/contracts/pages/ContractsList";
import ExpiringContracts from "@/features/contracts/pages/ExpiringContracts";
import ContractsSummary from "@/features/contracts/pages/ContractsSummary";

// Tax Pages
import TaxRatesList from "@/features/tax/pages/TaxRatesList";
import BonusTaxRatesList from "@/features/tax/pages/BonusTaxRatesList";
import IrpefBracketsPage from "@/features/tax/pages/IrpefBracketsPage";
import RegionalAdditionalsPage from "@/features/tax/pages/RegionalAdditionalsPage";
import MunicipalAdditionalsPage from "@/features/tax/pages/MunicipalAdditionalsPage";
import TaxCalculator from "@/features/tax/pages/TaxCalculator";

// Performance Pages
import PerformanceDashboard from "@/features/performance/pages/PerformanceDashboard";
import PerformancePlayers from "@/features/performance/pages/PerformancePlayers";
import DossierPage from "@/features/performance/pages/DossierPage";
import ComparePage from "@/features/performance/pages/ComparePage";
import ImportPage from "@/features/performance/pages/ImportPage";

// Placeholder components per le altre pagine
function PlaceholderPage({ title }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400">Pagina in costruzione...</p>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  // Public Routes (with redirect if authenticated)
  {
    element: <PublicRoute />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
    ],
  },
  
  // Onboarding Routes (pubbliche senza guard)
  {
    path: "/onboarding/choose-plan",
    element: <ChoosePlan />,
  },
  {
    path: "/onboarding/payment",
    element: <CheckoutPage />,
  },
  {
    path: "/onboarding/setup-team",
    element: <SetupTeam />,
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // Dashboard
      { path: "dashboard", element: <Dashboard /> },
      
             // Giocatori
             { path: "dashboard/players", element: <PlayersList /> },
             { path: "dashboard/players/stats", element: <PlayersStats /> },
             { path: "dashboard/players/upload", element: <PlayersUpload /> },
      
      // Performance
      { path: "dashboard/performance", element: <PerformanceDashboard /> },
      { path: "dashboard/performance/team", element: <PerformanceDashboard /> },
      { path: "dashboard/performance/players", element: <PerformancePlayers /> },
      { path: "dashboard/performance/dossier/:playerId", element: <DossierPage /> },
      { path: "dashboard/performance/compare", element: <ComparePage /> },
      { path: "dashboard/performance/analytics", element: <PlaceholderPage title="Analytics Avanzate" /> },
      { path: "dashboard/performance/import", element: <ImportPage /> },
      { path: "dashboard/performance/reports", element: <PlaceholderPage title="Reports" /> },
      
      // Contratti
      { path: "dashboard/contracts", element: <ContractsList /> },
      { path: "dashboard/contracts/dashboard", element: <ContractsDashboard /> },
      { path: "dashboard/contracts/expiring", element: <ExpiringContracts /> },
      { path: "dashboard/contracts/summary", element: <ContractsSummary /> },
      
      // Aliquote
      { path: "dashboard/taxrates/list", element: <TaxRatesList /> },
      { path: "dashboard/bonustaxrates/list", element: <BonusTaxRatesList /> },
      { path: "dashboard/tax/irpef-brackets", element: <IrpefBracketsPage /> },
      { path: "dashboard/tax/regional-additionals", element: <RegionalAdditionalsPage /> },
      { path: "dashboard/tax/municipal-additionals", element: <MunicipalAdditionalsPage /> },
      { path: "dashboard/tax/calculator", element: <TaxCalculator /> },
      
      // Area Medica
      { path: "dashboard/medical", element: <PlaceholderPage title="Area Medica" /> },
      { path: "dashboard/medical/dashboard", element: <PlaceholderPage title="Dashboard Medica" /> },
      { path: "dashboard/medical/injuries", element: <PlaceholderPage title="Infortuni" /> },
      { path: "dashboard/medical/visits", element: <PlaceholderPage title="Visite Mediche" /> },
      { path: "dashboard/medical/calendar", element: <PlaceholderPage title="Calendario Medico" /> },
      { path: "dashboard/medical/cases", element: <PlaceholderPage title="Casi GDPR" /> },
      { path: "dashboard/medical/documents", element: <PlaceholderPage title="Documenti Medici" /> },
      { path: "dashboard/medical/consents", element: <PlaceholderPage title="Consensi" /> },
      { path: "dashboard/medical/analytics", element: <PlaceholderPage title="Analytics Mediche" /> },
      { path: "dashboard/medical/audit", element: <PlaceholderPage title="Audit Medico" /> },
      { path: "dashboard/medical/settings", element: <PlaceholderPage title="Impostazioni Mediche" /> },
      
      // Mercato
      { path: "dashboard/market", element: <PlaceholderPage title="Mercato" /> },
      { path: "dashboard/market/transfers", element: <PlaceholderPage title="Trasferimenti" /> },
      { path: "dashboard/market/scouting", element: <PlaceholderPage title="Scouting" /> },
      { path: "dashboard/market/targets", element: <PlaceholderPage title="Obiettivi" /> },
      
      // Amministrazione
      { path: "dashboard/administration", element: <PlaceholderPage title="Amministrazione" /> },
      { path: "dashboard/administration/budget", element: <PlaceholderPage title="Budget" /> },
      { path: "dashboard/administration/expenses", element: <PlaceholderPage title="Spese" /> },
      { path: "dashboard/administration/users", element: <PlaceholderPage title="Utenti" /> },
      
      // Sicurezza
      { path: "dashboard/security/2fa", element: <PlaceholderPage title="Sicurezza 2FA" /> },
      
      // Utilità
      { path: "dashboard/utilities", element: <PlaceholderPage title="Utilità di Sistema" /> },
      { path: "dashboard/taxrates/upload", element: <PlaceholderPage title="Upload Aliquote Stipendi" /> },
      { path: "dashboard/bonustaxrates/upload", element: <PlaceholderPage title="Upload Aliquote Bonus" /> },
      { path: "dashboard/tax/irpef-upload", element: <PlaceholderPage title="Upload Scaglioni IRPEF" /> },
      { path: "dashboard/regional-additionals/upload", element: <PlaceholderPage title="Upload Addizionali Regionali" /> },
      { path: "dashboard/municipal-additionals/upload", element: <PlaceholderPage title="Upload Addizionali Comunali" /> },
      { path: "dashboard/tax-config", element: <PlaceholderPage title="Configurazioni Fiscali" /> },
      
      // Redirect di default
      { path: "", element: <Navigate to="/app/dashboard" replace /> },
      // Fallback
      { path: "*", element: <Dashboard /> },
    ],
  },
  // Fallback route for unknown paths
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default function AppRouter() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
