// client/src/services/medical/http.js
const base = '/api';

async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(text || `HTTP ${res.status}`);
    err.status = res.status;
    
    // Special handling for consent gating (451)
    if (res.status === 451) {
      err.message = 'Consent required - Access blocked due to missing GDPR consent';
      err.consentRequired = true;
    }
    
    try { 
      err.meta = JSON.parse(text); 
    } catch {} 
    throw err;
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export const http = {
  get: (url) => fetch(base + url, { credentials: 'include' }).then(handle),
  post: (url, body) => fetch(base + url, { 
    method: 'POST', 
    credentials: 'include', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(body) 
  }).then(handle),
  patch: (url, body) => fetch(base + url, { 
    method: 'PATCH', 
    credentials: 'include', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(body) 
  }).then(handle),
  del: (url) => fetch(base + url, { 
    method: 'DELETE', 
    credentials: 'include' 
  }).then(handle),
};
