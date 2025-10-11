// client_v3/src/store/authStore.js
// 🏪 Store Zustand per gestione autenticazione Soccer X Pro Suite

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

console.log('🟢 Inizializzazione authStore...');

// 🔐 Store per autenticazione
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ===== STATE =====
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ===== ACTIONS =====

      /**
       * 🚀 Login utente
       */
      login: async (credentials) => {
        console.log('🔵 AuthStore: tentativo login per', credentials.email);
        
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Invia i cookie HttpOnly
            body: JSON.stringify(credentials)
          });

          const data = await response.json();

          if (response.ok) {
            console.log('🟢 AuthStore: login riuscito', data.user.email);
            
            // Conferma sessione lato server tramite /me (cookie HttpOnly)
            try {
              const meRes = await fetch('http://localhost:3001/api/auth/me', {
                credentials: 'include'
              });
              if (meRes.ok) {
                const me = await meRes.json();
                set({
                  user: me.user || data.user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null
                });

                // Redirect alla pagina originale se salvata
                const redirectUrl = sessionStorage.getItem('postLoginRedirect');
                if (redirectUrl && redirectUrl !== '/login') {
                  sessionStorage.removeItem('postLoginRedirect');
                  window.location.href = redirectUrl;
                }
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
            console.log('🟡 AuthStore: login fallito', data.error);
            
            set({
              isLoading: false,
              error: data.error || 'Errore durante il login'
            });

            return { success: false, error: data.error };
          }
        } catch (error) {
          console.log('🔴 AuthStore: errore rete login', error.message);
          
          set({
            isLoading: false,
            error: 'Errore di connessione'
          });

          return { success: false, error: 'Errore di connessione' };
        }
      },

      /**
       * 📝 Registrazione utente con creazione team
       */
      registerWithTeam: async (userData) => {
        console.log('🔵 AuthStore: tentativo registrazione con team per', userData.email);
        
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('http://localhost:3001/api/auth/register-with-team', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(userData)
          });

          const data = await response.json();

          if (response.ok && data.success) {
            console.log('🟢 AuthStore: registrazione con team riuscita', data.data.email);
            
            // La registrazione con team include login automatico
            // Verifica la sessione tramite /me
            try {
              const meRes = await fetch('http://localhost:3001/api/auth/me', {
                credentials: 'include'
              });
              if (meRes.ok) {
                const me = await meRes.json();
                set({
                  user: me.user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null
                });
              } else {
                // Fallback: usa user della risposta
                set({
                  user: data.data,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null
                });
              }
            } catch (_) {
              set({
                user: data.data,
                isAuthenticated: true,
                isLoading: false,
                error: null
              });
            }

            return { success: true, data };
          } else {
            console.log('🟡 AuthStore: registrazione con team fallita', data.error);
            
            set({
              isLoading: false,
              error: data.error || 'Errore durante la registrazione'
            });

            return { success: false, error: data.error };
          }
        } catch (error) {
          console.log('🔴 AuthStore: errore rete registrazione con team', error.message);
          
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
        console.log('🔵 AuthStore: logout in corso');
        
        try {
          await fetch('http://localhost:3001/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });
        } catch (error) {
          console.log('🟡 AuthStore: errore logout API', error.message);
          // Continua comunque con il logout locale
        }

        // Reset dello stato locale
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });

        console.log('🟢 AuthStore: logout completato');
      },

      /**
       * 🧹 Pulisci errori
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * 🔍 Verifica autenticazione al caricamento
       */
      checkAuth: async () => {
        console.log('🔵 AuthStore: verifica autenticazione via /me');
        set({ isLoading: true });
        try {
          const res = await fetch('http://localhost:3001/api/auth/me', {
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });
            return true;
          }
        } catch (e) {
          console.log('🟡 AuthStore: errore checkAuth', e.message);
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
        return false;
      }
    }),
    {
      name: 'soccerxpro-auth-v3', // nome per localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
