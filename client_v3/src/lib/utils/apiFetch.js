// client_v3/src/lib/utils/apiFetch.js
// Centralized fetch wrapper con gestione autenticazione

const API_BASE_URL = 'http://localhost:3001/api';

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    credentials: 'include', // Invia i cookie HttpOnly per autenticazione
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export default apiFetch;
