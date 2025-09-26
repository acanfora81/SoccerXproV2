import { http } from './http';

export function listAudit(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/audit${q ? `?${q}` : ''}`);
}

export function getAuditStats(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/audit/stats${q ? `?${q}` : ''}`);
}

export function getAuditByUser(userId, params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/audit/user/${userId}${q ? `?${q}` : ''}`);
}

export function getAuditByCase(caseId, params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/audit/case/${caseId}${q ? `?${q}` : ''}`);
}

export function getAuditByDocument(documentId, params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/audit/document/${documentId}${q ? `?${q}` : ''}`);
}

export function exportAudit(format = 'csv', params = {}) {
  const q = new URLSearchParams({ ...params, format }).toString();
  return http.get(`/medical/audit/export?${q}`);
}

export function getAuditSummary(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/audit/summary${q ? `?${q}` : ''}`);
}
