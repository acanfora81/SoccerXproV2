import { http } from './http';

export function getAnalytics(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/analytics${q ? `?${q}` : ''}`);
}

export function getInjuryAnalytics(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/analytics/injuries${q ? `?${q}` : ''}`);
}

export function getVisitAnalytics(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/analytics/visits${q ? `?${q}` : ''}`);
}

export function getCaseAnalytics(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/analytics/cases${q ? `?${q}` : ''}`);
}

export function getConsentAnalytics(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/analytics/consents${q ? `?${q}` : ''}`);
}

export function getDocumentAnalytics(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/analytics/documents${q ? `?${q}` : ''}`);
}

export function exportAnalytics(format = 'csv', params = {}) {
  const q = new URLSearchParams({ ...params, format }).toString();
  return http.get(`/medical/analytics/export?${q}`);
}
