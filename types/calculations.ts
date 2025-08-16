import type { MealType } from "./menus";
import type { RecipeIngredientBase } from "./recipes";

export type CalculationIngredient = Required<
  Omit<RecipeIngredientBase, "id" | "costPerUnit">
> & {
  costPerUnit: number;
};

export interface IngredientCalculation {
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  weightInGrams: number;
  totalCost: number;
}

export interface MealCalculationResult {
  // Basic calculations
  totalWeightGrams: number;
  totalCost: number;

  // Per person calculations
  servingAmountInGrams: number;
  personsPerGhan: number;
  totalPersons: number;
  costPerPerson: number;

  // Ghan calculations
  ghanWeightGrams: number; // Weight of 1 ghan in grams
  totalGhanWeight: number; // Total weight for all ghans

  // Ingredient breakdown
  ingredients: IngredientCalculation[];

  // Display values (formatted)
  display: {
    perPersonServing: string;
    costPerPerson: string;
    personsPerGhan: string;
    totalPersons: string;
    totalCost: string;
    totalWeight: string;
  };
}

export interface MealCalculationInput {
  ghan: number;
  servingAmount: number;
  servingUnit: string;
  ingredients: CalculationIngredient[];
  mealType?: MealType;
}
