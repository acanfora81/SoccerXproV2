// client/src/services/medical/injuryService.js
import { http } from './http';

export function listInjuries(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/injuries${q ? `?${q}` : ''}`);
}

export function getInjury(id) {
  return http.get(`/medical/injuries/${id}`);
}

export function createInjury(payload) {
  return http.post('/medical/injuries', payload);
}

export function updateInjury(id, patch) {
  return http.patch(`/medical/injuries/${id}`, patch);
}

export function deleteInjury(id) {
  return http.del(`/medical/injuries/${id}`);
}

export function promoteToCase(id) {
  return http.post(`/medical/injuries/${id}/promote-to-case`);
}

export function getInjuryStats() {
  return http.get('/medical/injuries/stats');
}
