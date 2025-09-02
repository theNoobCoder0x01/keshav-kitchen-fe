// Unit constants for the application
// This file centralizes all unit definitions and ensures consistency across the app

import type { UnitOption } from "@/types";

// Standardized unit options for dropdowns
export const UNIT_OPTIONS: UnitOption[] = [
  // Weight units
  {
    value: "kg",
    label: "Kilograms (kg)",
    category: "weight",
    isDefault: true,
  },
  // { value: "g", label: "Grams (g)", category: "weight", conversionToGrams: 1 },

  // // Volume units
  // {
  //   value: "L",
  //   label: "Liters (L)",
  //   category: "volume",
  //   conversionToGrams: 1000,
  // },
  // {
  //   value: "ml",
  //   label: "Milliliters (ml)",
  //   category: "volume",
  //   conversionToGrams: 1,
  // },
  // {
  //   value: "cup",
  //   label: "Cups (cup)",
  //   category: "volume",
  //   conversionToGrams: 240,
  // },
  // {
  //   value: "tbsp",
  //   label: "Tablespoons (tbsp)",
  //   category: "volume",
  //   conversionToGrams: 15,
  // },
  // {
  //   value: "tsp",
  //   label: "Teaspoons (tsp)",
  //   category: "volume",
  //   conversionToGrams: 5,
  // },

  // Count units
  {
    value: "pcs",
    label: "Pieces (pcs)",
    category: "count",
  },
];

// Get default unit
export const DEFAULT_UNIT =
  UNIT_OPTIONS.find((unit) => unit.isDefault)?.value || "kg";

// Get unit options for specific categories
export const getWeightUnits = () =>
  UNIT_OPTIONS.filter((unit) => unit.category === "weight");
export const getVolumeUnits = () =>
  UNIT_OPTIONS.filter((unit) => unit.category === "volume");
export const getCountUnits = () =>
  UNIT_OPTIONS.filter((unit) => unit.category === "count");

// Get unit by value
export const getUnitByValue = (value: string): UnitOption | undefined => {
  return UNIT_OPTIONS.find((unit) => unit.value === value);
};

// Validate if a unit value is valid
export const isValidUnit = (value: string): boolean => {
  return UNIT_OPTIONS.some((unit) => unit.value === value);
};

// Get conversion factor to grams
export const getConversionToGrams = (unit: string): number => {
  const unitOption = getUnitByValue(unit);
  return 1;
};

// Convert between units
export const convertUnits = (
  quantity: number,
  fromUnit: string,
  toUnit: string
): number => {
  if (fromUnit === toUnit) return quantity;

  const fromGrams = quantity * getConversionToGrams(fromUnit);
  const toConversion = getConversionToGrams(toUnit);

  return fromGrams / toConversion;
};

// Format quantity with appropriate decimal places
export const formatQuantity = (quantity: number, unit: string): string => {
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
};

// Legacy compatibility - map old unit values to new standardized ones
export const normalizeUnit = (unit: string): string => {
  const normalized = unit.toLowerCase().trim();

  // Map common variations to standardized values
  const unitMap: Record<string, string> = {
    kg: "kg",
    kilogram: "kg",
    kilograms: "kg",
    g: "g",
    gram: "g",
    grams: "g",
    l: "L",
    liter: "L",
    litre: "L",
    liters: "L",
    litres: "L",
    ml: "ml",
    milliliter: "ml",
    millilitre: "ml",
    milliliters: "ml",
    millilitres: "ml",
    tbsp: "tbsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    tsp: "tsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    cup: "cup",
    cups: "cup",
    pcs: "pcs",
    pc: "pcs",
    piece: "pcs",
    pieces: "pcs",
  };

  return unitMap[normalized] || DEFAULT_UNIT;
};
