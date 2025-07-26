import api from './axios';

export async function fetchIngredients() {
  const response = await api.get('/ingredients');
  return response.data;
}

export async function createIngredient(data: { name: string; costPerKg: number; unit: string }) {
  const response = await api.post('/ingredients', data);
  return response.data;
}

export async function updateIngredient(id: string, data: { name: string; costPerKg: number; unit: string }) {
  const response = await api.put(`/ingredients?id=${id}`, data);
  return response.data;
}

export async function deleteIngredient(id: string) {
  const response = await api.delete(`/ingredients?id=${id}`);
  return response.data;
}
