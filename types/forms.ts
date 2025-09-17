export interface IngredientFormValue {
  id: string | undefined;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  sequenceNumber?: number;
  groupId?: string | null;
  localId?: string;
}

export interface MealFormValues {
  recipeId: string;
  followRecipe: boolean;
  ghanFactor: number;
  preparedQuantity: number;
  preparedQuantityUnit: string;
  servingQuantity: number;
  servingQuantityUnit: string;
  quantityPerPiece?: number;
  ingredients: IngredientFormValue[];
}

// UI form type for recipe dialogs where quantities are entered as strings
export interface RecipeDialogIngredientValue {
  name: string;
  quantity: string;
  unit: string;
  costPerUnit?: string;
  sequenceNumber: number;
  localId?: string;
}
