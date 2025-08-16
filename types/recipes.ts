export interface RecipeIngredientBase {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit?: number | null;
}

export interface RecipeListItem {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  cost?: number;
  instructions?: string | null;
  ingredients?: Array<{
    name: string;
    quantity: number | string;
    unit: string;
    costPerUnit?: number | string;
  }>;
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
  ingredients: Array<Required<Omit<RecipeIngredientBase, "costPerUnit">> & { costPerUnit: number | null }>;
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