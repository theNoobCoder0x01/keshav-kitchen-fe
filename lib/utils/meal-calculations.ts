import {
  convertToGrams,
  convertFromGrams,
  calculateIngredientCost,
  calculateTotalWeight,
  formatQuantity,
} from "./unit-conversions";

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
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
  }>;
  mealType?: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
}

/**
 * Calculate comprehensive meal metrics with proper unit conversions
 */
export function calculateMealMetrics(
  input: MealCalculationInput,
): MealCalculationResult {
  const { ghan, servingAmount, servingUnit, ingredients } = input;

  // Convert serving amount to grams for standardized calculations
  const servingAmountInGrams = convertToGrams(servingAmount, servingUnit);

  // Calculate ingredient details
  const ingredientCalculations: IngredientCalculation[] = ingredients.map(
    (ingredient) => {
      const weightInGrams = convertToGrams(
        ingredient.quantity,
        ingredient.unit,
      );
      const totalCost = calculateIngredientCost(
        ingredient.quantity,
        ingredient.unit,
        ingredient.costPerUnit,
        ghan,
      );

      return {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        costPerUnit: ingredient.costPerUnit,
        weightInGrams,
        totalCost,
      };
    },
  );

  // Calculate total weight and cost
  const totalWeightGrams = ingredientCalculations.reduce(
    (sum, ing) => sum + ing.weightInGrams,
    0,
  );
  const totalCost = ingredientCalculations.reduce(
    (sum, ing) => sum + ing.totalCost,
    0,
  );

  // Ghan calculations
  // 1 Ghan = total recipe weight (all ingredients combined)
  const ghanWeightGrams = totalWeightGrams;
  const totalGhanWeight = ghanWeightGrams * ghan;

  // Person calculations
  const personsPerGhan =
    servingAmountInGrams > 0 ? ghanWeightGrams / servingAmountInGrams : 0;
  const totalPersons = personsPerGhan * ghan;
  const costPerPerson = totalPersons > 0 ? totalCost / totalPersons : 0;

  // Create display values
  const display = {
    perPersonServing: `${formatQuantity(servingAmount, servingUnit)} ${servingUnit}`,
    costPerPerson: `₹${costPerPerson.toFixed(2)}`,
    personsPerGhan: formatQuantity(personsPerGhan, "persons"),
    totalPersons: formatQuantity(totalPersons, "persons"),
    totalCost: `₹${totalCost.toFixed(2)}`,
    totalWeight: `${formatQuantity(totalWeightGrams / 1000, "kg")} kg`,
  };

  return {
    totalWeightGrams,
    totalCost,
    servingAmountInGrams,
    personsPerGhan,
    totalPersons,
    costPerPerson,
    ghanWeightGrams,
    totalGhanWeight,
    ingredients: ingredientCalculations,
    display,
  };
}

/**
 * Calculate scaling factor for recipe adjustments
 */
export function calculateScalingFactor(
  originalServings: number,
  targetServings: number,
): number {
  if (originalServings <= 0) return 1;
  return targetServings / originalServings;
}

/**
 * Scale recipe ingredients
 */
export function scaleRecipeIngredients(
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
  }>,
  scalingFactor: number,
): Array<{
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
}> {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: ingredient.quantity * scalingFactor,
  }));
}

/**
 * Validate meal calculation inputs
 */
export function validateMealInputs(input: MealCalculationInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (input.ghan <= 0) {
    errors.push("Ghan must be greater than 0");
  }

  if (input.ghan > 100) {
    errors.push("Ghan cannot exceed 100");
  }

  if (input.servingAmount <= 0) {
    errors.push("Serving amount must be greater than 0");
  }

  if (!input.servingUnit) {
    errors.push("Serving unit is required");
  }

  if (!input.ingredients || input.ingredients.length === 0) {
    errors.push("At least one ingredient is required");
  }

  input.ingredients.forEach((ingredient, index) => {
    if (!ingredient.name.trim()) {
      errors.push(`Ingredient ${index + 1}: Name is required`);
    }

    if (ingredient.quantity <= 0) {
      errors.push(`Ingredient ${index + 1}: Quantity must be greater than 0`);
    }

    if (!ingredient.unit) {
      errors.push(`Ingredient ${index + 1}: Unit is required`);
    }

    if (ingredient.costPerUnit < 0) {
      errors.push(`Ingredient ${index + 1}: Cost cannot be negative`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get recommended serving sizes by meal type
 */
export function getRecommendedServingSize(
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
): { amount: number; unit: string } {
  const recommendations = {
    BREAKFAST: { amount: 150, unit: "g" },
    LUNCH: { amount: 250, unit: "g" },
    DINNER: { amount: 300, unit: "g" },
    SNACK: { amount: 75, unit: "g" },
  };

  return recommendations[mealType];
}

/**
 * Calculate nutritional density (cost per 100g)
 */
export function calculateNutritionalDensity(
  totalCost: number,
  totalWeightGrams: number,
): number {
  if (totalWeightGrams <= 0) return 0;
  return (totalCost / totalWeightGrams) * 100; // Cost per 100g
}

/**
 * Generate meal calculation summary
 */
export function generateMealSummary(
  calculation: MealCalculationResult,
  mealType: string,
): string {
  const { display } = calculation;

  return `${mealType} meal summary:
- Serves ${display.totalPersons} people
- ${display.perPersonServing} per person
- ${display.costPerPerson} per person
- Total cost: ${display.totalCost}
- Total weight: ${display.totalWeight}`;
}
