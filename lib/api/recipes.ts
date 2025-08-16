import axios from "axios";

import type { RecipeApiItem as Recipe } from "@/types";

export async function fetchRecipes(): Promise<Recipe[]> {
  try {
    const response = await axios.get("/api/recipes");
    return response.data;
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw new Error("Failed to fetch recipes");
  }
}
