import { http } from './http';

export function getSettings() {
  return http.get('/medical/settings');
}

export function updateSettings(payload) {
  return http.patch('/medical/settings', payload);
}

export function getRetentionSettings() {
  return http.get('/medical/settings/retention');
}

export function updateRetentionSettings(payload) {
  return http.patch('/medical/settings/retention', payload);
}

export function getClassificationSettings() {
  return http.get('/medical/settings/classification');
}

export function updateClassificationSettings(payload) {
  return http.patch('/medical/settings/classification', payload);
}

export function getConsentSettings() {
  return http.get('/medical/settings/consent');
}

export function updateConsentSettings(payload) {
  return http.patch('/medical/settings/consent', payload);
}

export function getAuditSettings() {
  return http.get('/medical/settings/audit');
}

export function updateAuditSettings(payload) {
  return http.patch('/medical/settings/audit', payload);
}

export function resetSettings() {
  return http.post('/medical/settings/reset');
}

export function exportSettings() {
  return http.get('/medical/settings/export');
}

export function importSettings(file) {
  const formData = new FormData();
  formData.append('file', file);
  return http.post('/medical/settings/import', formData);
}
