// Ingredient Group types
export interface IngredientGroup {
  id: string;
  name: string;
  recipeId: string;
  sortOrder: number;
  ingredients?: RecipeIngredientBase[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IngredientGroupInput {
  name: string;
  sortOrder?: number;
}

export interface IngredientGroupApi {
  id: string;
  name: string;
  recipeId: string;
  sortOrder: number;
  ingredients: RecipeIngredientApi[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeIngredientBase {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit?: number | null;
  groupId?: string | null;
  group?: IngredientGroup | null;
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
  ingredientGroups?: IngredientGroupApi[];
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
  ingredientGroups?: IngredientGroup[];
  createdAt?: Date;
  updatedAt?: Date;
  prepTime?: number;
  cookTime?: number;
}

// Helper type for grouped ingredients display
export interface GroupedIngredients {
  [groupName: string]: {
    groupId: string | null;
    sortOrder: number;
    ingredients: RecipeIngredientBase[];
  };
}
