// Percorso: client_v3/src/features/performance/api/performanceApi.js
import apiFetch from '@/utils/apiClient';

export const listPerformance = (params) => apiFetch('/performance', { params });
export const createPerformance = (data) => apiFetch('/performance', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' }});
export const getPerformance = (id) => apiFetch(`/performance/${id}`);
export const deletePerformance = (id) => apiFetch(`/performance/${id}`, { method: 'DELETE' });

export const statsByPlayer = (playerId, params) => apiFetch(`/performance/stats/player/${playerId}`, { params });
export const statsTeam = (params) => apiFetch('/performance/stats/team', { params });
export const playerSessions = (playerId) => apiFetch(`/performance/player/${playerId}/sessions`);
export const playerDossier = (playerId) => apiFetch(`/performance/player/${playerId}/dossier`);
export const comparePlayers = (params) => apiFetch('/performance/compare', { params });

