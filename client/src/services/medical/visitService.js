// client/src/services/medical/visitService.js
import { http } from './http';

export function listVisits(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/visits${q ? `?${q}` : ''}`);
}

export function getVisit(id) {
  return http.get(`/medical/visits/${id}`);
}

export function createVisit(payload) {
  return http.post('/medical/visits', payload);
}

export function updateVisit(id, patch) {
  return http.patch(`/medical/visits/${id}`, patch);
}

export function deleteVisit(id) {
  return http.del(`/medical/visits/${id}`);
}

export function getVisitsByDateRange(from, to) {
  return http.get(`/medical/visits?from=${from}&to=${to}`);
}

export function getVisitsToday() {
  const today = new Date().toISOString().split('T')[0];
  return http.get(`/medical/visits?from=${today}&to=${today}`);
}

export function getVisitStats() {
  return http.get('/medical/visits/stats');
}
