import type { MealCalculationResult } from "@/types/calculations";

/**
 * Generate recipe calculation summary object
 */
export function generateRecipeSummaryObject(
  calculation: any,
  recipeName: string
): {
  recipeName: string;
  preparedQuantity: number;
  preparedUnit: string;
  servingQuantity: number;
  servingUnit: string;
  numberOfServings: number;
  extraQuantity: number;
} {
  const { display } = calculation;

  // Use getCalculatedQuantities for serving logic
  const quantities = getCalculatedQuantities({
    preparedQuantity: display.preparedQuantity ?? 0,
    preparedQuantityUnit: display.preparedQuantityUnit ?? "units",
    servingQuantity: display.servingQuantity ?? 1,
    servingQuantityUnit: display.servingQuantityUnit ?? "units",
    quantityPerPiece: display.quantityPerPiece ?? null,
  });

  return {
    recipeName,
    ...quantities,
    // Add more fields as needed from display
  };
}

/**
 * Generate meal calculation summary
 */
export function generateMealSummary(
  calculation: MealCalculationResult,
  mealType: string
): string {
  const { display } = calculation;

  return `${mealType} meal summary:
- Serves ${display.totalPersons} people
- ${display.perPersonServing} per person
- ${display.costPerPerson} per person
- Total cost: ${display.totalCost}
- Total weight: ${display.totalWeight}`;
}

/**
 *
 */
export const getCalculatedQuantities = ({
  preparedQuantity,
  preparedQuantityUnit,
  servingQuantity,
  servingQuantityUnit,
  quantityPerPiece,
}: {
  preparedQuantity: number | null;
  preparedQuantityUnit: string | null;
  servingQuantity: number | null;
  servingQuantityUnit: string | null;
  quantityPerPiece: number | null;
}) => {
  const preparedQty = preparedQuantity || 0;
  const servingQty = servingQuantity || 1;
  const qtyPerPiece = quantityPerPiece || 1;

  let numberOfServings = 0;
  let extraQuantity = 0;

  // If either preparedQuantityUnit or servingQuantityUnit is 'pcs', use piece logic
  const isPreparedPcs = preparedQuantityUnit === "pcs";
  const isServingPcs = servingQuantityUnit === "pcs";

  if ((isPreparedPcs || isServingPcs) && qtyPerPiece > 0) {
    // Both units are 'pcs' or one of them is 'pcs'
    // preparedQty is total pieces, servingQty is pieces per serving, quantityPerPiece is pieces per item
    // If both are 'pcs', treat preparedQty as total pieces, servingQty as pieces per serving
    // If only one is 'pcs', treat accordingly
    if (isPreparedPcs && isServingPcs) {
      numberOfServings = Math.floor(preparedQty / servingQty);
      extraQuantity = preparedQty - numberOfServings * servingQty;
    } else if (isServingPcs) {
      // preparedQty is weight/volume, servingQty is pieces, quantityPerPiece is weight/volume per piece
      numberOfServings = Math.floor(preparedQty / (servingQty * qtyPerPiece));
      extraQuantity = preparedQty - numberOfServings * servingQty * qtyPerPiece;
    } else if (isPreparedPcs) {
      // preparedQty is pieces, servingQty is weight/volume, quantityPerPiece is weight/volume per piece
      // Total available weight = preparedQty * quantityPerPiece
      numberOfServings = Math.floor((preparedQty * qtyPerPiece) / servingQty);
      extraQuantity = preparedQty * qtyPerPiece - numberOfServings * servingQty;
    }
  } else {
    // Neither unit is 'pcs', use normal logic
    numberOfServings = Math.floor(preparedQty / servingQty);
    extraQuantity = preparedQty - numberOfServings * servingQty;
  }

  return {
    preparedQuantity: preparedQty,
    preparedUnit: preparedQuantityUnit || "units",
    servingQuantity: servingQty,
    servingUnit: servingQuantityUnit || "units",
    numberOfServings,
    extraQuantity,
  };
};
