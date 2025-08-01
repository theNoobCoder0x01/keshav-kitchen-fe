// Unit conversion utilities for meal calculations

export interface UnitConversion {
  unit: string;
  toGrams: number; // Conversion factor to grams
  category: "weight" | "volume" | "count";
}

// Unit conversion table - all conversions to grams as base unit
export const UNIT_CONVERSIONS: Record<string, UnitConversion> = {
  // Weight units
  g: { unit: "g", toGrams: 1, category: "weight" },
  kg: { unit: "kg", toGrams: 1000, category: "weight" },

  // Volume units (approximate conversions for cooking)
  ml: { unit: "ml", toGrams: 1, category: "volume" }, // Assuming water density
  L: { unit: "L", toGrams: 1000, category: "volume" },
  tsp: { unit: "tsp", toGrams: 5, category: "volume" }, // 1 tsp ≈ 5ml
  tbsp: { unit: "tbsp", toGrams: 15, category: "volume" }, // 1 tbsp ≈ 15ml
  cup: { unit: "cup", toGrams: 240, category: "volume" }, // 1 cup ≈ 240ml

  // Count units (approximate weight for common ingredients)
  pcs: { unit: "pcs", toGrams: 50, category: "count" }, // Average piece weight
};

/**
 * Convert any unit to grams
 */
export function convertToGrams(quantity: number, unit: string): number {
  const conversion = UNIT_CONVERSIONS[unit];
  if (!conversion) {
    console.warn(`Unknown unit: ${unit}, defaulting to 1:1 conversion`);
    return quantity;
  }
  return quantity * conversion.toGrams;
}

/**
 * Convert grams to any unit
 */
export function convertFromGrams(grams: number, targetUnit: string): number {
  const conversion = UNIT_CONVERSIONS[targetUnit];
  if (!conversion) {
    console.warn(`Unknown unit: ${targetUnit}, defaulting to 1:1 conversion`);
    return grams;
  }
  return grams / conversion.toGrams;
}

/**
 * Convert between any two units
 */
export function convertUnits(
  quantity: number,
  fromUnit: string,
  toUnit: string,
): number {
  if (fromUnit === toUnit) return quantity;

  const grams = convertToGrams(quantity, fromUnit);
  return convertFromGrams(grams, toUnit);
}

/**
 * Get unit category
 */
export function getUnitCategory(
  unit: string,
): "weight" | "volume" | "count" | "unknown" {
  const conversion = UNIT_CONVERSIONS[unit];
  return conversion?.category || "unknown";
}

/**
 * Check if two units are compatible for conversion
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const category1 = getUnitCategory(unit1);
  const category2 = getUnitCategory(unit2);

  // All units can be converted to grams for calculation purposes
  // But we warn about cross-category conversions
  if (
    category1 !== category2 &&
    category1 !== "unknown" &&
    category2 !== "unknown"
  ) {
    console.warn(
      `Converting between different unit categories: ${unit1} (${category1}) to ${unit2} (${category2})`,
    );
  }

  return true;
}

/**
 * Format quantity with appropriate decimal places
 */
export function formatQuantity(quantity: number, unit: string): string {
  // For very small quantities, show more decimal places
  if (quantity < 1) {
    return quantity.toFixed(3);
  }
  // For normal quantities, show 2 decimal places
  if (quantity < 100) {
    return quantity.toFixed(2);
  }
  // For large quantities, show 1 decimal place
  return quantity.toFixed(1);
}

/**
 * Calculate ingredient cost with unit conversion
 */
export function calculateIngredientCost(
  quantity: number,
  unit: string,
  costPerUnit: number,
  ghanFactor: number = 1,
): number {
  // Convert to grams for standardized calculation
  const quantityInGrams = convertToGrams(quantity, unit);

  // Calculate total cost considering ghan factor
  const totalCost =
    (quantityInGrams / convertToGrams(1, unit)) * costPerUnit * ghanFactor;

  return totalCost;
}

/**
 * Calculate total weight of all ingredients in grams
 */
export function calculateTotalWeight(
  ingredients: Array<{
    quantity: number;
    unit: string;
  }>,
): number {
  return ingredients.reduce((total, ingredient) => {
    return total + convertToGrams(ingredient.quantity, ingredient.unit);
  }, 0);
}

/**
 * Estimate serving size based on meal type and ingredients
 */
export function estimateServingSize(
  totalWeightGrams: number,
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
): number {
  // Base serving sizes in grams per person
  const baseServingSizes = {
    BREAKFAST: 150, // Lighter meal
    LUNCH: 250, // Medium meal
    DINNER: 300, // Heavier meal
    SNACK: 75, // Light snack
  };

  const baseServing = baseServingSizes[mealType];

  // If total weight is very different from expected, adjust
  if (totalWeightGrams > 0) {
    // Use the provided total weight as a guide, but don't deviate too much from base
    const ratio = totalWeightGrams / (baseServing * 4); // Assuming recipe for 4 people
    if (ratio > 0.5 && ratio < 2) {
      return Math.round(totalWeightGrams / 4);
    }
  }

  return baseServing;
}
