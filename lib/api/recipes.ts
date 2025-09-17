import type {
  RecipeApiItem as Recipe,
  RecipeIngredientBase,
  RecipeIngredientInput,
} from "@/types";
import api from "./axios";

export async function fetchRecipes(
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    subcategory?: string;
  },
  signal?: AbortSignal,
): Promise<{
  recipes: Recipe[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.subcategory)
      queryParams.append("subcategory", params.subcategory);

    const response = await api.get(`/recipes/?${queryParams.toString()}`, {
      signal,
    });
    return response.data;
  } catch (error: any) {
    if (error.name === "AbortError" || error.name === "CanceledError") {
      console.log("Fetch recipes request was cancelled");
      throw error;
    }
    console.error("Error fetching recipes:", error);
    throw new Error("Failed to fetch recipes");
  }
}

export async function fetchRecipeById(id: string): Promise<Recipe> {
  try {
    const response = await api.get(`/recipes/${id}/`);
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
  deletedIngredientGroupIds?: string[];
}) {
  try {
    const response = await api.post("/recipes/", data);
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
    deletedIngredientGroupIds?: string[];
  },
) {
  try {
    const response = await api.patch(`/recipes/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating recipe with id ${id}:`, error);
    throw new Error("Failed to update recipe");
  }
}

export async function fetchRecipeFilters(signal?: AbortSignal): Promise<{
  categories: string[];
  subcategories: string[];
}> {
  try {
    const response = await api.get("/recipes/filters/", { signal });
    return response.data;
  } catch (error: any) {
    if (error.name === "AbortError" || error.name === "CanceledError") {
      console.log("Fetch recipe filters request was cancelled");
      throw error;
    }
    console.error("Error fetching recipe filters:", error);
    throw new Error("Failed to fetch recipe filters");
  }
}

export async function fetchAllRecipesForDropdown(
  signal?: AbortSignal,
): Promise<Recipe[]> {
  try {
    // Fetch all recipes without pagination for dropdowns
    const queryParams = new URLSearchParams();
    queryParams.append("page", "1");
    queryParams.append("limit", "10000"); // Large limit to get all recipes

    const response = await api.get(`/recipes/?${queryParams.toString()}`, {
      signal,
    });
    return response.data.recipes;
  } catch (error: any) {
    if (error.name === "AbortError" || error.name === "CanceledError") {
      console.log("Fetch all recipes for dropdown request was cancelled");
      throw error;
    }
    console.error("Error fetching all recipes for dropdown:", error);
    throw new Error("Failed to fetch recipes for dropdown");
  }
}
