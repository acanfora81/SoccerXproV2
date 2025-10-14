import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111827] to-[#1e1b4b] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white text-xl">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🟡 [ROUTE] Accesso negato - redirect a /login');
    return <Navigate to="/login" replace />;
  }

  // Blocca accesso se subscription non è attiva
  const status = user?.subscriptionStatus;
  const teamId = user?.teamId;
  const plan = user?.planCode;
  if (status && status !== 'ACTIVE' && teamId) {
    const target = `/onboarding/payment?teamId=${encodeURIComponent(teamId)}${plan ? `&plan=${encodeURIComponent(plan)}` : ''}`;
    return <Navigate to={target} replace />;
  }

  console.log('🟢 [ROUTE] Accesso consentito');
  return children;
}
