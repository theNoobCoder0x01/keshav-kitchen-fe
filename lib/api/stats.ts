import api from './axios';

export async function fetchStats(params = {}) {
  const response = await api.get('/stats', { params });
  return response.data;
}
