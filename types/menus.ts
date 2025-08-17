export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
export type MenuStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

import type { RecipeIngredientBase } from "./recipes";

// Menu Ingredient Group types
export interface MenuIngredientGroup {
  id: string;
  name: string;
  menuId: string;
  sortOrder: number;
  ingredients?: MenuIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuIngredientGroupInput {
  name: string;
  sortOrder?: number;
}

export interface MenuIngredientGroupApi {
  id: string;
  name: string;
  menuId: string;
  sortOrder: number;
  ingredients: MenuIngredientApi[];
  createdAt: Date;
  updatedAt: Date;
}

// Menu Ingredient types with group support
export interface MenuIngredient {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  groupId?: string | null;
  group?: MenuIngredientGroup | null;
}

export interface MenuIngredientApi extends Required<MenuIngredient> {
  id: string;
}

// Helper type for grouped menu ingredients display
export interface GroupedMenuIngredients {
  [groupName: string]: {
    groupId: string | null;
    sortOrder: number;
    ingredients: MenuIngredient[];
  };
}

export interface MenuWithIngredients {
  id: string;
  date: Date;
  mealType: string;
  servings: number;
  ghanFactor: number;
  status: string;
  actualCount?: number;
  notes?: string;
  kitchen: {
    id: string;
    name: string;
  };
  recipe: {
    id: string;
    name: string;
    description?: string;
    ingredients?: RecipeIngredientBase[];
  };
  ingredients?: Required<MenuIngredient>[];
  ingredientGroups?: MenuIngredientGroup[];
}

export interface CombinedIngredient {
  name: string;
  totalQuantity: number;
  unit: string;
  totalCost: number;
  sources: Array<{
    kitchen: string;
    mealType: string;
    recipe: string;
    quantity: number;
    servings: number;
  }>;
}

export interface IngredientCombineOptions {
  combineMealTypes: boolean;
  combineKitchens: boolean;
  selectedMealTypes?: string[];
  selectedKitchens?: string[];
}

export interface MenuReportData {
  type: string;
  date: Date;
  totalQuantity?: number;
  totalMeals?: number;
  breakfastCount?: number;
  lunchCount?: number;
  dinnerCount?: number;
  combinedIngredients?: CombinedIngredient[];
  summary?: {
    totalIngredients: number;
    totalCost: number;
    uniqueIngredients: number;
    mealTypesCombined: boolean;
    kitchensCombined: boolean;
  };
  selectedMealTypes?: string[];
  combineKitchens?: boolean;
  combineMealTypes?: boolean;
  menus: Array<{
    id: string;
    date: Date;
    mealType: string;
    servings: number;
    ghanFactor: number;
    status: string;
    actualCount?: number;
    notes?: string;
    kitchen: { name: string };
    recipe: {
      name: string;
      description?: string;
      ingredients?: Partial<RecipeIngredientBase>[];
    };
    ingredients?: Required<RecipeIngredientBase>[];
  }>;
}
