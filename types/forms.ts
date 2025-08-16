export interface IngredientFormValue {
  id: string | undefined;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
}

export interface MealFormValues {
  recipeId: string;
  followRecipe: boolean;
  ghan: number;
  servingAmount: number;
  servingUnit: string;
  ingredients: IngredientFormValue[];
}

// UI form type for recipe dialogs where quantities are entered as strings
export interface RecipeDialogIngredientValue {
  name: string;
  quantity: string;
  unit: string;
  costPerUnit?: string;
}