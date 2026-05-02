// Unit conversion utilities for meal calculations
import {
  UNIT_OPTIONS,
  getDefaultUnitForCategory,
  normalizeSupportedUnit,
  normalizeUnit,
} from "@/lib/constants/units";
import type { MealType } from "@/types/menus";
import type {
  AggregatedQuantity,
  QuantityWithUnit,
  UnitCategory,
  UnitConversion,
} from "@/types";

// Unit conversion table - all conversions to grams as base unit
// This is now derived from the centralized UNIT_OPTIONS
export const UNIT_CONVERSIONS: Record<string, UnitConversion> =
  UNIT_OPTIONS.reduce(
    (acc, unit) => {
      acc[unit.value] = {
        unit: unit.value,
        toGrams: unit.conversionToGrams,
        category: unit.category,
      };
      return acc;
    },
    {} as Record<string, UnitConversion>,
  );

/**
 * Convert any unit to grams
 */
export function convertToGrams(quantity: number, unit: string): number {
  const normalizedUnit = normalizeSupportedUnit(unit);
  const conversion = normalizedUnit ? UNIT_CONVERSIONS[normalizedUnit] : null;
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
  const normalizedUnit = normalizeSupportedUnit(targetUnit);
  const conversion = normalizedUnit ? UNIT_CONVERSIONS[normalizedUnit] : null;
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
  const normalizedFromUnit = normalizeUnit(fromUnit);
  const normalizedToUnit = normalizeUnit(toUnit);

  if (normalizedFromUnit === normalizedToUnit) return quantity;
  if (!areUnitsCompatible(normalizedFromUnit, normalizedToUnit)) {
    console.warn(`Skipping incompatible conversion: ${fromUnit} -> ${toUnit}`);
    return quantity;
  }

  const grams = convertToGrams(quantity, normalizedFromUnit);
  return convertFromGrams(grams, toUnit);
}

/**
 * Get unit category
 */
export function getUnitCategory(
  unit: string,
): "weight" | "volume" | "count" | "unknown" {
  const normalizedUnit = normalizeSupportedUnit(unit);
  const conversion = normalizedUnit ? UNIT_CONVERSIONS[normalizedUnit] : null;
  return conversion?.category || "unknown";
}

/**
 * Check if two units are compatible for conversion
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const normalizedUnit1 = normalizeUnit(unit1);
  const normalizedUnit2 = normalizeUnit(unit2);

  if (normalizedUnit1 === normalizedUnit2) {
    return true;
  }

  const category1 = getUnitCategory(unit1);
  const category2 = getUnitCategory(unit2);

  return category1 !== "unknown" && category1 === category2;
}

export function sumCompatibleQuantities(
  quantities: QuantityWithUnit[],
  options?: {
    preferUnit?: string | null;
  },
): AggregatedQuantity | null {
  const normalizedQuantities = quantities
    .map((entry) => ({
      quantity: Number(entry.quantity) || 0,
      unit: normalizeUnit(entry.unit ?? ""),
    }))
    .filter((entry) => entry.quantity !== 0 && entry.unit.length > 0);

  if (normalizedQuantities.length === 0) {
    return null;
  }

  const [first] = normalizedQuantities;
  const allSameUnit = normalizedQuantities.every(
    (entry) => entry.unit === first.unit,
  );

  if (allSameUnit) {
    return {
      quantity: normalizedQuantities.reduce(
        (sum, entry) => sum + entry.quantity,
        0,
      ),
      unit: first.unit,
      category: getUnitCategory(first.unit),
      wasConverted: false,
    };
  }

  const category = getUnitCategory(first.unit);
  const allSameCategory =
    category !== "unknown" &&
    normalizedQuantities.every(
      (entry) => getUnitCategory(entry.unit) === category,
    );

  if (!allSameCategory) {
    return null;
  }

  const preferredUnit = options?.preferUnit
    ? normalizeSupportedUnit(options.preferUnit)
    : null;
  const targetUnit =
    preferredUnit && getUnitCategory(preferredUnit) === category
      ? preferredUnit
      : getDefaultUnitForCategory(category as UnitCategory);

  return {
    quantity: normalizedQuantities.reduce(
      (sum, entry) =>
        sum + convertUnits(entry.quantity, entry.unit, targetUnit),
      0,
    ),
    unit: targetUnit,
    category,
    wasConverted: true,
  };
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
  mealType: MealType,
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
