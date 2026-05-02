export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export enum MealTypeEnum {
  BREAKFAST = "BREAKFAST",
  LUNCH = "LUNCH",
  DINNER = "DINNER",
  SNACK = "SNACK",
}

import type { RecipeIngredientBase } from "./recipes";
import type { UnitValue } from "./units";

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
  unit: UnitValue;
  costPerUnit: number;
  sequenceNumber?: number | null;
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
  preparedQuantity?: number | null;
  preparedQuantityUnit?: UnitValue | null;
  servingQuantity?: number | null;
  servingQuantityUnit?: UnitValue | null;
  quantityPerPiece?: number | null;
  ghanFactor: number;
  notes?: string;
  kitchen: {
    id: string;
    name: string;
  };
  recipe?: {
    id: string;
    name: string;
    description?: string;
    ingredients?: RecipeIngredientBase[];
  } | null;
  ingredients?: Required<MenuIngredient>[];
  ingredientGroups?: MenuIngredientGroup[];
}

export interface CombinedIngredient {
  name: string;
  totalQuantity: number;
  unit: UnitValue;
  totalCost: number;
  sources: Array<{
    kitchen: string;
    mealType: string;
    recipe: string;
    quantity: number;
    servingQuantity?: number | null;
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
    preparedQuantity?: number | null;
    preparedQuantityUnit?: UnitValue | null;
    servingQuantity?: number | null;
    servingQuantityUnit?: UnitValue | null;
    ghanFactor: number;
    notes?: string;
    kitchen: { name: string };
    recipe?: {
      name: string;
      description?: string;
      ingredients?: Partial<RecipeIngredientBase>[];
    } | null;
    ingredients?: Required<RecipeIngredientBase>[];
  }>;
}
