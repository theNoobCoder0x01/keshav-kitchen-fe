import type {
  RecipeApiItem as Recipe,
  RecipeIngredientBase,
  RecipeIngredientInput,
} from "@/types";
import api from "./axios";

export async function fetchRecipes(): Promise<Recipe[]> {
  try {
    const response = await api.get("/recipes");
    return response.data;
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw new Error("Failed to fetch recipes");
  }
}

export async function fetchRecipeById(id: string): Promise<Recipe> {
  try {
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching recipe with id ${id}:`, error);
    throw new Error("Failed to fetch recipe");
  }
}

export async function createRecipe(data: {
  name: string;
  description?: string;
  instructions?: string;
  preparedQuantity?: number;
  preparedQuantityUnit?: string;
  servingQuantity?: number;
  servingQuantityUnit?: string;
  quantityPerPiece?: number;
  category: string;
  subcategory: string;
  ingredients: (RecipeIngredientInput & { groupId?: string | null })[];
  ingredientGroups?: Array<{
    id?: string;
    name: string;
    sortOrder: number;
  }>;
}) {
  try {
    const response = await api.post("/recipes", data);
    return response.data;
  } catch (error) {
    console.error("Error creating recipe:", error);
    throw new Error("Failed to create recipe");
  }
}

export async function updateRecipe(
  id: string,
  data: {
    name?: string;
    description?: string;
    instructions?: string;
    preparedQuantity?: number;
    preparedQuantityUnit?: string;
    servingQuantity?: number;
    servingQuantityUnit?: string;
    quantityPerPiece?: number;
    category?: string;
    subcategory?: string;
    ingredients?: (RecipeIngredientBase & { groupId?: string | null })[];
    ingredientGroups?: Array<{
      id?: string;
      name: string;
      sortOrder: number;
    }>;
  },
) {
  try {
    const response = await api.patch(`/recipes/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating recipe with id ${id}:`, error);
    throw new Error("Failed to update recipe");
  }
}
