export interface RecipeIngredientBase {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit?: number | null;
}

// Reusable ingredient aliases
export type RecipeIngredientApi = Required<
  Omit<RecipeIngredientBase, "costPerUnit">
> & {
  costPerUnit: number | null;
};
export type RecipeIngredientInput = Omit<RecipeIngredientBase, "id">;

export interface RecipeListItem {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  cost?: number;
  instructions?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeApiItem {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  servings: number | null;
  category: string;
  subcategory: string | null;
  ingredients: RecipeIngredientApi[];
  user: { name: string; email: string };
  _count: { menus: number };
}

export interface RecipeDetailData {
  id: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  servings?: number | null;
  category: string;
  subcategory?: string | null;
  cost?: number;
  ingredients: RecipeIngredientBase[];
  createdAt?: Date;
  updatedAt?: Date;
  prepTime?: number;
  cookTime?: number;
}
