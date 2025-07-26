import api from './axios';

export async function fetchRecipes() {
  const response = await api.get('/recipes');
  return response.data;
}

export async function createRecipe(data: any) {
  const response = await api.post('/recipes', data);
  return response.data;
}

export async function updateRecipe(id: string, data: any) {
  const response = await api.put(`/recipes?id=${id}`, data);
  return response.data;
}

export async function deleteRecipe(id: string) {
  const response = await api.delete(`/recipes?id=${id}`);
  return response.data;
}
