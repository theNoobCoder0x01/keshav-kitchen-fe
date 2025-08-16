export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
export type MenuStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

import type { RecipeIngredientBase } from "./recipes";

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
  ingredients?: Required<RecipeIngredientBase>[];
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
