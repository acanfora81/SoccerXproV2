// Percorso: client_v3/src/features/contracts/api/contractsApi.js
import apiClient from '@/utils/apiClient';

export const listContracts = (params) => apiClient.get('/contracts', { params });
export const getContract = (id) => apiClient.get(`/contracts/${id}`);
export const createContract = (data) => apiClient.post('/contracts', data);
export const updateContract = (id, data) => apiClient.put(`/contracts/${id}`, data);
export const deleteContract = (id) => apiClient.delete(`/contracts/${id}`);

export const linkContractToPlayer = ({ playerId, contractId }) =>
  apiClient.post('/contracts/link', { playerId, contractId });

export const unlinkContractFromPlayer = (playerId) =>
  apiClient.delete(`/contracts/link/${playerId}`);


