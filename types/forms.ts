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