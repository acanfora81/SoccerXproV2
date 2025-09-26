import { http } from './http';

export function listCases(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http.get(`/medical/cases${q ? `?${q}` : ''}`);
}

export function getCase(id) {
  return http.get(`/medical/cases/${id}`);
}

export function createCase(payload) {
  return http.post('/medical/cases', payload);
}

export function updateCase(id, patch) {
  return http.patch(`/medical/cases/${id}`, patch);
}

export function deleteCase(id) {
  return http.del(`/medical/cases/${id}`);
}

export function addDiagnosis(caseId, payload) {
  return http.post(`/medical/cases/${caseId}/diagnoses`, payload);
}

export function updateDiagnosis(caseId, diagnosisId, patch) {
  return http.patch(`/medical/cases/${caseId}/diagnoses/${diagnosisId}`, patch);
}

export function addExam(caseId, payload) {
  return http.post(`/medical/cases/${caseId}/exams`, payload);
}

export function updateExam(caseId, examId, patch) {
  return http.patch(`/medical/cases/${caseId}/exams/${examId}`, patch);
}

export function addTreatment(caseId, payload) {
  return http.post(`/medical/cases/${caseId}/treatments`, payload);
}

export function updateTreatment(caseId, treatmentId, patch) {
  return http.patch(`/medical/cases/${caseId}/treatments/${treatmentId}`, patch);
}

export function getCaseDocuments(caseId) {
  return http.get(`/medical/cases/${caseId}/documents`);
}

export function getCaseAuditLog(caseId) {
  return http.get(`/medical/cases/${caseId}/audit`);
}

export function promoteInjuryToCase(injuryId, payload) {
  return http.post(`/medical/injuries/${injuryId}/promote-to-case`, payload);
}
