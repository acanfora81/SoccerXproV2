/**
 * apiFetch.js
 * Wrapper sicuro per fetch API
 * - Gestisce base URL da .env (VITE_API_BASE_URL)
 * - Include automaticamente cookie/sessione
 * - Converte body in JSON
 * - Restituisce automaticamente JSON se presente
 * - Gestisce errori in modo uniforme
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export default async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

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
