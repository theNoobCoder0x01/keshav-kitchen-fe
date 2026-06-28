import type { UnitValue } from "./units";

export interface IngredientFormValue {
  id: string | undefined;
  name: string;
  quantity: number;
  unit: UnitValue;
  costPerUnit: number;
  sequenceNumber?: number;
  groupId?: string | null;
  localId?: string;
  selected?: boolean;
}

export interface MealFormValues {
  recipeId: string;
  followRecipe: boolean;
  ghanFactor: number;
  preparedQuantity: number;
  preparedQuantityUnit: UnitValue;
  servingQuantity: number;
  servingQuantityUnit: UnitValue;
  quantityPerPiece?: number;
  ingredients: IngredientFormValue[];
}

// UI form type for recipe dialogs where quantities are entered as strings
export interface RecipeDialogIngredientValue {
  name: string;
  quantity: string;
  unit: UnitValue;
  costPerUnit?: string;
  sequenceNumber?: number;
  localId?: string;
}

// A logical group of ingredients within a meal/menu form (mirrors the
// structure used by the AddMealDialog and the Daily Menu Builder rows).
export interface IngredientGroupFormValue {
  id?: string;
  name: string;
  sortOrder: number;
  ingredients: (IngredientFormValue & { sequenceNumber?: number })[];
}

// Form values for a single Daily Menu Builder row. Mirrors the field set of
// the AddMealDialog ("full planning") but is shared so the row component and
// the payload helpers in lib/utils/menu-payload.ts agree on one shape.
export interface DailyMenuRowFormValues {
  recipeId: string;
  customName: string;
  followRecipe: boolean;
  ghanFactor: number;
  preparedQuantity: number;
  preparedQuantityUnit: UnitValue;
  servingQuantity: number;
  servingQuantityUnit: UnitValue;
  quantityPerPiece?: number;
  kitchenId: string;
  cook: string;
  notes: string;
  recipeCategory: string;
  recipeSubcategory: string;
  menuComponentId?: string;
  ingredientGroups: IngredientGroupFormValue[];
}
