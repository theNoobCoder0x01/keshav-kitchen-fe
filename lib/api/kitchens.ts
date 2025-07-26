import api from './axios';

export async function fetchKitchens() {
  const response = await api.get('/kitchens');
  return response.data;
}

export async function createKitchen(data: { name: string; location: string }) {
  const response = await api.post('/kitchens', data);
  return response.data;
}

export async function updateKitchen(id: string, data: { name: string; location: string }) {
  const response = await api.put(`/kitchens?id=${id}`, data);
  return response.data;
}

export async function deleteKitchen(id: string) {
  const response = await api.delete(`/kitchens?id=${id}`);
  return response.data;
}
