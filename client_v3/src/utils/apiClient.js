/**
 * apiClient.js
 * Wrapper unificato per tutte le chiamate API
 * - Gestisce base URL da .env (VITE_API_BASE_URL)
 * - Include automaticamente cookie/sessione
 * - Converte body in JSON
 * - Restituisce automaticamente JSON se presente
 * - Gestisce errori in modo uniforme
 * - Redirect centralizzato su 401/403 → Login page
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export async function apiFetch(endpoint, options = {}) {
  // Normalizza l'endpoint per evitare duplicazioni di /api quando BASE_URL contiene già /api
  let url;
  if (endpoint.startsWith("http")) {
    url = endpoint;
  } else {
    let normalizedEndpoint = endpoint;
    if (normalizedEndpoint.startsWith("/api/")) {
      normalizedEndpoint = normalizedEndpoint.slice(4); // rimuove "/api"
    } else if (normalizedEndpoint === "/api") {
      normalizedEndpoint = "";
    } else if (normalizedEndpoint.startsWith("api/")) {
      normalizedEndpoint = normalizedEndpoint.slice(3);
    }
    url = `${BASE_URL}${normalizedEndpoint.startsWith("/") ? normalizedEndpoint : `/${normalizedEndpoint}`}`;
  }

  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // per autenticazione con cookie/sessione
  };

  // Converte automaticamente in JSON
  if (options.body && typeof options.body !== "string") {
    config.body = JSON.stringify(options.body);
  } else if (options.body) {
    config.body = options.body;
  }

  // Esegue la richiesta
  const response = await fetch(url, config);

  // Redirect centralizzato su 401/403 → Login page
  if (response.status === 401 || response.status === 403) {
    try {
      const current = `${window.location.pathname}${window.location.search}`;
      sessionStorage.setItem('postLoginRedirect', current);
    } catch (_) {}
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  // Gestione errori base
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch (_) {}
    throw new Error(message);
  }

  // Ritorna JSON se presente, altrimenti testo
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

// Wrapper con metodi HTTP standard
export const apiClient = {
  get: (url, options = {}) => apiFetch(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => apiFetch(url, { ...options, method: 'POST', body }),
  put: (url, body, options = {}) => apiFetch(url, { ...options, method: 'PUT', body }),
  delete: (url, options = {}) => apiFetch(url, { ...options, method: 'DELETE' }),
};

// Export di default per compatibilità
export default apiFetch;