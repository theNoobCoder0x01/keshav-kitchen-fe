import api from './axios';

export async function fetchRecipes() {
  const response = await api.get('/recipes');
  return response.data;
}

export async function createRecipe(data: {
  name: string;
  description?: string;
  instructions?: string;
  servings?: number;
  category: string;
  subcategory: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    costPerUnit?: number;
  }>;
}) {
  const response = await api.post('/recipes', data);
  return response.data;
}

export async function updateRecipe(id: string, data: {
  name?: string;
  description?: string;
  instructions?: string;
  servings?: number;
  category?: string;
  subcategory?: string;
  ingredients?: Array<{
    id?: string;
    name: string;
    quantity: number;
    unit: string;
    costPerUnit?: number;
  }>;
}) {
  try {
    const result = await api.put(`/recipes?id=${id}`, data);
    return result;
  } catch (error: unknown) {
    console.error('API updateRecipe error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update recipe');
  }
}

export async function deleteRecipe(id: string) {
  const response = await api.delete(`/recipes?id=${id}`);
  return response.data;
}

export async function updateRecipeIngredients(id: string, ingredients: any) {
  const response = await api.put(`/recipes/${id}/ingredients`, ingredients);
  return response.data;
}
