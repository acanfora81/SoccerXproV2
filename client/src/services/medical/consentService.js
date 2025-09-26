import { http } from './http';

export function listConsents(playerId) {
  return http.get(`/medical/consents?playerId=${playerId}`);
}

export function getAllConsents(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/consents${q ? `?${q}` : ''}`);
}

export function getConsent(id) {
  return http.get(`/medical/consents/${id}`);
}

export function createConsent(payload) {
  return http.post('/medical/consents', payload);
}

export function updateConsent(id, patch) {
  return http.patch(`/medical/consents/${id}`, patch);
}

export function grantConsent(id, meta) {
  return http.post(`/medical/consents/${id}/grant`, meta);
}

export function withdrawConsent(id, meta) {
  return http.post(`/medical/consents/${id}/withdraw`, meta);
}

export function renewConsent(id, payload) {
  return http.post(`/medical/consents/${id}/renew`, payload);
}

export function getConsentHistory(id) {
  return http.get(`/medical/consents/${id}/history`);
}

export function getExpiringConsents(days = 30) {
  return http.get(`/medical/consents/expiring?days=${days}`);
}
