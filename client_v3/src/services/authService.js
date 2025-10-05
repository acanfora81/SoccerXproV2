const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

console.log('🟢 [AUTH SERVICE] API URL configurato:', API_URL);

class AuthService {
  async login(email, password) {
    console.log('🔵 [API] POST /api/auth/login');
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      let msg = 'Login fallito';
      try { 
        const e = await response.json(); 
        msg = e.error || msg; 
      } catch {}
      console.log('🔴 [API] Login fallito:', msg);
      throw new Error(msg);
    }

    const data = await response.json();
    console.log('🟢 [API] Login risposta ricevuta');
    return data.user;
  }

  async registerWithTeam({ email, password, firstName, lastName, teamName, plan }) {
    console.log('🔵 [API] POST /api/auth/register-with-team');
    
    const response = await fetch(`${API_URL}/api/auth/register-with-team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        teamName,
        plan
      })
    });

    if (!response.ok) {
      let msg = 'Registrazione fallita';
      try { 
        const e = await response.json(); 
        msg = e.error || msg; 
      } catch {}
      console.log('🔴 [API] Registrazione fallita:', msg);
      throw new Error(msg);
    }

    const data = await response.json();
    console.log('🟢 [API] Registrazione completata');
    return data.data;
  }

  async logout() {
    console.log('🔵 [API] POST /api/auth/logout');
    
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      console.log('🔴 [API] Logout fallito');
      throw new Error('Logout fallito');
    }

    console.log('🟢 [API] Logout completato');
  }

  async checkAuth() {
    console.log('🔵 [API] GET /api/auth/me');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, { 
        credentials: 'include' 
      });

      if (!response.ok) {
        console.log('🟡 [API] /me non disponibile o non autenticato');
        return null;
      }

      const data = await response.json();
      console.log('🟢 [API] Auth check valido');
      return data.user;
    } catch (error) {
      console.log('🟡 [API] /me non disponibile o non autenticato');
      return null;
    }
  }

  async refreshToken() {
    console.log('🔵 [API] POST /api/auth/refresh');
    
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Token refresh fallito');
    }

    console.log('🟢 [API] Token rinnovato');
  }
}

export const authService = new AuthService();