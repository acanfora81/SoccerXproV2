// client/src/utils/http.js
// Centralized fetch wrapper: credentials included, retry-once on 401 via refresh, optional CSRF header

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export async function apiFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input?.url || '';
  const method = (init.method || 'GET').toUpperCase();
  const retryOn401 = init.retryOn401 !== false; // default true

  const makeRequest = async () => {
    const headers = new Headers(init.headers || {});
    // Attach CSRF token for state-changing requests if available
    if (METHODS_WITH_BODY.has(method)) {
      const csrf = getCookie('csrf_token');
      if (csrf && !headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', csrf);
      if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }
    }

    const response = await fetch(input, {
      ...init,
      headers,
      credentials: 'include'
    });
    return response;
  };

  let res = await makeRequest();

  if (res.status === 401 && retryOn401) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      if (refreshRes.ok) {
        res = await makeRequest();
      }
    } catch (_) {
      // ignore, will return original 401
    }
  }

  return res;
}

export default apiFetch;



