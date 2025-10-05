import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

export default function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

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

  if (isAuthenticated) {
    console.log('🟡 [ROUTE] Utente già autenticato - redirect a /app/dashboard');
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
