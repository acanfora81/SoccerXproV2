// client/src/store/authStore.js
// 🏪 Store Zustand per gestione autenticazione SoccerXpro V2

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiFetch } from '../utils/http';

console.log('🟢 Inizializzazione authStore...'); // INFO - rimuovere in produzione

// 🔐 Store per autenticazione
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ===== STATE =====
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ===== ACTIONS =====

      /**
       * 🚀 Login utente
       */
      login: async (credentials) => {
        console.log('🔵 AuthStore: tentativo login per', credentials.email); // INFO DEV - rimuovere in produzione
        
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
          });

          const data = await response.json();

          if (response.ok) {
            console.log('🟢 AuthStore: login riuscito', data.user.email); // INFO - rimuovere in produzione
            
            // Conferma sessione lato server tramite /me (cookie HttpOnly)
            try {
              const meRes = await apiFetch('/api/auth/me');
              if (meRes.ok) {
                const me = await meRes.json();
                set({
                  user: me.user || data.user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null
                });
              } else {
                // Fallback: usa user del login
                set({
                  user: data.user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null
                });
              }
            } catch (_) {
              set({
                user: data.user,
                isAuthenticated: true,
                isLoading: false,
                error: null
              });
            }

            return { success: true, data };
          } else {
            console.log('🟡 AuthStore: login fallito', data.error); // WARNING - rimuovere in produzione
            
            set({
              isLoading: false,
              error: data.error || 'Errore durante il login'
            });

            return { success: false, error: data.error };
          }
        } catch (error) {
          console.log('🔴 AuthStore: errore rete login', error.message); // ERROR - mantenere essenziali
          
          set({
            isLoading: false,
            error: 'Errore di connessione'
          });

          return { success: false, error: 'Errore di connessione' };
        }
      },

      /**
       * 📝 Registrazione utente
       */
      register: async (userData) => {
        console.log('🔵 AuthStore: tentativo registrazione per', userData.email); // INFO DEV - rimuovere in produzione
        
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
          });

          const data = await response.json();

          if (response.ok) {
            console.log('🟢 AuthStore: registrazione riuscita', data.user.email); // INFO - rimuovere in produzione
            
            // Se la registrazione include login automatico
            if (data.access_token) {
              set({
                user: data.user,
                token: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: data.expires_at,
                isAuthenticated: true,
                isLoading: false,
                error: null
              });
            } else {
              // Solo registrazione, senza login automatico
              set({
                isLoading: false,
                error: null
              });
            }

            return { success: true, data };
          } else {
            console.log('🟡 AuthStore: registrazione fallita', data.error); // WARNING - rimuovere in produzione
            
            set({
              isLoading: false,
              error: data.error || 'Errore durante la registrazione'
            });

            return { success: false, error: data.error };
          }
        } catch (error) {
          console.log('🔴 AuthStore: errore rete registrazione', error.message); // ERROR - mantenere essenziali
          
          set({
            isLoading: false,
            error: 'Errore di connessione'
          });

          return { success: false, error: 'Errore di connessione' };
        }
      },

      /**
       * 🚪 Logout utente
       */
      logout: async () => {
        console.log('🔵 AuthStore: logout in corso'); // INFO DEV - rimuovere in produzione
        
        try {
          await apiFetch('/api/auth/logout', {
            method: 'POST',
          });
        } catch (error) {
          console.log('🟡 AuthStore: errore logout API', error.message); // WARNING - rimuovere in produzione
          // Continua comunque con il logout locale
        }

        // Reset dello stato locale
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });

        console.log('🟢 AuthStore: logout completato'); // INFO - rimuovere in produzione
      },

      /**
       * 🔄 Refresh token
       */
      refreshAccessToken: async () => {
        console.log('🔵 AuthStore: refresh token in corso'); // INFO DEV - rimuovere in produzione

        try {
          const response = await apiFetch('/api/auth/refresh', {
            method: 'POST',
          });

          if (response.ok) {
            console.log('🟢 AuthStore: token rinnovato'); // INFO - rimuovere in produzione

            return true;
          } else {
            let data = {};
            try { data = await response.json(); } catch (_) {}
            console.log('🟡 AuthStore: refresh token fallito', data.error); // WARNING - rimuovere in produzione
            get().logout();
            return false;
          }
        } catch (error) {
          console.log('🔴 AuthStore: errore refresh token', error.message); // ERROR - mantenere essenziali
          get().logout();
          return false;
        }
      },

      /**
       * 🧹 Pulisci errori
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * ✅ Verifica se token è valido
       */
      isTokenValid: () => {
        const { token, expiresAt } = get();
        
        if (!token || !expiresAt) {
          return false;
        }

        // Controlla se il token scade nei prossimi 5 minuti
        const now = new Date().getTime();
        const expirationTime = new Date(expiresAt * 1000).getTime();
        const fiveMinutes = 5 * 60 * 1000;

        return (expirationTime - now) > fiveMinutes;
      },

      /**
       * 🔍 Verifica autenticazione al caricamento
       */
      checkAuth: async () => {
        console.log('🔵 AuthStore: verifica autenticazione via /me'); // INFO DEV - rimuovere in produzione
        set({ isLoading: true });
        try {
          const res = await apiFetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });
            return true;
          }
          // Prova un refresh una volta
          const refreshed = await get().refreshAccessToken();
          if (refreshed) {
            const res2 = await apiFetch('/api/auth/me');
            if (res2.ok) {
              const data2 = await res2.json();
              set({ user: data2.user, isAuthenticated: true, isLoading: false, error: null });
              return true;
            }
          }
        } catch (e) {
          console.log('🟡 AuthStore: errore checkAuth', e.message);
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
        return false;
      }
    }),
    {
      name: 'soccerxpro-auth', // nome per localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;