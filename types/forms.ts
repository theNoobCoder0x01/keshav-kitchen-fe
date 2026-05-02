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
