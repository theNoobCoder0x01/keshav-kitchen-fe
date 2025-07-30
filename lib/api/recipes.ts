import axios from 'axios';

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  servings: number | null;
  category: string;
  subcategory: string | null;
  ingredients: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    costPerUnit: number | null;
  }>;
  user: {
    name: string;
    email: string;
  };
  _count: {
    menus: number;
  };
}

export async function fetchRecipes(): Promise<Recipe[]> {
  try {
    const response = await axios.get('/api/recipes');
    return response.data;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw new Error('Failed to fetch recipes');
  }
}
