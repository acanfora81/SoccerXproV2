// client/src/services/medical/documentService.js
import { http } from './http';

export async function presignDocument(meta) {
  // meta: { mimeType, sizeBytes, checksumSHA256, classification, retentionUntil, visibility }
  return http.post('/medical/documents/presign', meta);
}

export async function attachDocument(payload) {
  // payload: { teamId, playerId, caseId?, documentType, title?, encryptionKeyId, checksumSHA256 }
  return http.post('/medical/documents/attach', payload);
}

export function listDocuments(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/documents${q ? `?${q}` : ''}`);
}

export function getDocument(id) {
  return http.get(`/medical/documents/${id}`);
}

export function deleteDocument(id) {
  return http.del(`/medical/documents/${id}`);
}

export function getDocumentAccessLog(id) {
  return http.get(`/medical/documents/${id}/access-log`);
}

export function getDocumentsByPlayer(playerId) {
  return http.get(`/medical/documents?playerId=${playerId}`);
}

export function getDocumentsByCase(caseId) {
  return http.get(`/medical/documents?caseId=${caseId}`);
}

export function getDocumentStats() {
  return http.get('/medical/documents/stats');
}
