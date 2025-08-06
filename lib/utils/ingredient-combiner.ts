interface MenuWithIngredients {
  id: string;
  date: Date;
  mealType: string;
  servings: number;
  ghanFactor: number;
  status: string;
  actualCount?: number;
  notes?: string;
  kitchen: {
    id: string;
    name: string;
  };
  recipe: {
    id: string;
    name: string;
    description?: string;
    ingredients?: Array<{
      id: string;
      name: string;
      quantity: number;
      unit: string;
      costPerUnit?: number;
    }>;
  };
  ingredients?: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
  }>;
}

interface CombinedIngredient {
  name: string;
  totalQuantity: number;
  unit: string;
  totalCost: number;
  sources: Array<{
    kitchen: string;
    mealType: string;
    recipe: string;
    quantity: number;
    servings: number;
  }>;
}

interface IngredientCombineOptions {
  combineMealTypes: boolean;
  combineKitchens: boolean;
  selectedMealTypes?: string[];
  selectedKitchens?: string[];
}

/**
 * Convert units to a standard unit for combination
 * This is a simple conversion - you may want to expand this based on your needs
 */
function normalizeUnitForCombination(unit: string): string {
  const unitMap: { [key: string]: string } = {
    // Weight conversions to grams
    kg: "g",
    kilogram: "g",
    gram: "g",
    grams: "g",

    // Volume conversions to ml
    l: "ml",
    liter: "ml",
    litre: "ml",
    milliliter: "ml",
    millilitre: "ml",

    // Count units
    piece: "pcs",
    pieces: "pcs",
    pc: "pcs",

    // Keep as is for other units
    cup: "cup",
    cups: "cup",
    tbsp: "tbsp",
    tsp: "tsp",
    pinch: "pinch",
  };

  const normalized = unit.toLowerCase().trim();
  return unitMap[normalized] || normalized;
}

/**
 * Convert quantity to standard unit
 */
function convertToStandardUnit(quantity: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim();

  // Weight conversions to grams
  if (normalizedUnit === "kg" || normalizedUnit === "kilogram") {
    return quantity * 1000;
  }

  // Volume conversions to ml
  if (
    normalizedUnit === "l" ||
    normalizedUnit === "liter" ||
    normalizedUnit === "litre"
  ) {
    return quantity * 1000;
  }

  // Count conversions
  if (normalizedUnit === "piece" || normalizedUnit === "pc") {
    return quantity;
  }

  return quantity; // Keep original for other units
}

/**
 * Combine ingredients by name from multiple menus
 */
export function combineIngredients(
  menus: MenuWithIngredients[],
  options: IngredientCombineOptions = {
    combineMealTypes: false,
    combineKitchens: false,
  },
): CombinedIngredient[] {
  const ingredientMap = new Map<string, CombinedIngredient>();

  for (const menu of menus) {
    // Filter by meal types if specified
    if (options.selectedMealTypes && options.selectedMealTypes.length > 0) {
      if (!options.selectedMealTypes.includes(menu.mealType.toLowerCase())) {
        continue;
      }
    }

    // Filter by kitchens if specified
    if (options.selectedKitchens && options.selectedKitchens.length > 0) {
      if (!options.selectedKitchens.includes(menu.kitchen.id)) {
        continue;
      }
    }

    // Get ingredients from either menu.ingredients or recipe.ingredients
    const ingredients = menu.ingredients || menu.recipe.ingredients || [];

    for (const ingredient of ingredients) {
      const ingredientName = ingredient.name.toLowerCase().trim();
      const standardUnit = normalizeUnitForCombination(ingredient.unit);
      const standardQuantity = convertToStandardUnit(
        ingredient.quantity,
        ingredient.unit,
      );

      // Scale quantity by servings and ghan factor
      const scaledQuantity = standardQuantity * menu.servings * menu.ghanFactor;
      const ingredientCost = (ingredient.costPerUnit || 0) * scaledQuantity;

      // Create a unique key based on combination settings
      let ingredientKey = ingredientName;
      if (!options.combineMealTypes) {
        ingredientKey += `_${menu.mealType}`;
      }
      if (!options.combineKitchens) {
        ingredientKey += `_${menu.kitchen.id}`;
      }

      if (ingredientMap.has(ingredientKey)) {
        const existing = ingredientMap.get(ingredientKey)!;

        // Only combine if units are compatible
        if (existing.unit === standardUnit) {
          existing.totalQuantity += scaledQuantity;
          existing.totalCost += ingredientCost;
          existing.sources.push({
            kitchen: menu.kitchen.name,
            mealType: menu.mealType,
            recipe: menu.recipe.name,
            quantity: ingredient.quantity,
            servings: menu.servings,
          });
        } else {
          // If units don't match, create a separate entry with unit suffix
          const unitSpecificKey = `${ingredientKey}_${standardUnit}`;
          if (ingredientMap.has(unitSpecificKey)) {
            const unitSpecific = ingredientMap.get(unitSpecificKey)!;
            unitSpecific.totalQuantity += scaledQuantity;
            unitSpecific.totalCost += ingredientCost;
            unitSpecific.sources.push({
              kitchen: menu.kitchen.name,
              mealType: menu.mealType,
              recipe: menu.recipe.name,
              quantity: ingredient.quantity,
              servings: menu.servings,
            });
          } else {
            ingredientMap.set(unitSpecificKey, {
              name: ingredient.name,
              totalQuantity: scaledQuantity,
              unit: standardUnit,
              totalCost: ingredientCost,
              sources: [
                {
                  kitchen: menu.kitchen.name,
                  mealType: menu.mealType,
                  recipe: menu.recipe.name,
                  quantity: ingredient.quantity,
                  servings: menu.servings,
                },
              ],
            });
          }
        }
      } else {
        ingredientMap.set(ingredientKey, {
          name: ingredient.name,
          totalQuantity: scaledQuantity,
          unit: standardUnit,
          totalCost: ingredientCost,
          sources: [
            {
              kitchen: menu.kitchen.name,
              mealType: menu.mealType,
              recipe: menu.recipe.name,
              quantity: ingredient.quantity,
              servings: menu.servings,
            },
          ],
        });
      }
    }
  }

  // Convert map to array and sort by ingredient name
  return Array.from(ingredientMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/**
 * Generate a summary of combined ingredients
 */
export function generateIngredientSummary(
  combinedIngredients: CombinedIngredient[],
  options: IngredientCombineOptions,
): {
  totalIngredients: number;
  totalCost: number;
  uniqueIngredients: number;
  mealTypesCombined: boolean;
  kitchensCombined: boolean;
} {
  const uniqueNames = new Set(
    combinedIngredients.map((ing) => ing.name.toLowerCase()),
  );

  return {
    totalIngredients: combinedIngredients.length,
    totalCost: combinedIngredients.reduce((sum, ing) => sum + ing.totalCost, 0),
    uniqueIngredients: uniqueNames.size,
    mealTypesCombined: options.combineMealTypes,
    kitchensCombined: options.combineKitchens,
  };
}

/**
 * Format combined ingredients for different export formats
 */
export function formatCombinedIngredientsForExport(
  combinedIngredients: CombinedIngredient[],
  format: "table" | "detailed" = "table",
): Array<any> {
  if (format === "detailed") {
    return combinedIngredients.map((ingredient) => ({
      name: ingredient.name,
      totalQuantity: Math.round(ingredient.totalQuantity * 100) / 100,
      unit: ingredient.unit,
      totalCost: Math.round(ingredient.totalCost * 100) / 100,
      sources: ingredient.sources
        .map(
          (source) =>
            `${source.kitchen} - ${source.mealType} - ${source.recipe} (${source.quantity} for ${source.servings} servings)`,
        )
        .join("; "),
    }));
  }

  // Simple table format
  return combinedIngredients.map((ingredient) => [
    ingredient.name,
    Math.round(ingredient.totalQuantity * 100) / 100,
    ingredient.unit,
    Math.round(ingredient.totalCost * 100) / 100,
    ingredient.sources.length,
  ]);
}
