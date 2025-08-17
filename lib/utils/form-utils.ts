/**
 * Utility functions for form handling and validation
 */

/**
 * Trims all string values in an object recursively
 * @param obj - The object to trim
 * @returns A new object with all string values trimmed
 */
export function trimObjectStrings<T extends Record<string, any>>(obj: T): T {
  const trimmed: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      trimmed[key] = value.trim();
    } else if (Array.isArray(value)) {
      trimmed[key] = value.map((item) =>
        typeof item === "string"
          ? item.trim()
          : typeof item === "object" && item !== null
            ? trimObjectStrings(item)
            : item,
      );
    } else if (typeof value === "object" && value !== null) {
      trimmed[key] = trimObjectStrings(value);
    } else {
      trimmed[key] = value;
    }
  }

  return trimmed as T;
}

/**
 * Trims specific fields in an object
 * @param obj - The object to trim
 * @param fieldsToTrim - Array of field names to trim
 * @returns A new object with specified fields trimmed
 */
export function trimSpecificFields<T extends Record<string, any>>(
  obj: T,
  fieldsToTrim: (keyof T)[],
): T {
  const trimmed = { ...obj };

  for (const field of fieldsToTrim) {
    if (typeof trimmed[field] === "string") {
      trimmed[field] = trimmed[field].trim() as T[keyof T];
    }
  }

  return trimmed;
}

/**
 * Trims ingredient arrays specifically for recipe/meal forms
 * @param ingredients - Array of ingredients
 * @returns Array with string fields trimmed
 */
export function trimIngredients<
  T extends { name?: string; unit?: string; [key: string]: any },
>(ingredients: T[]): T[] {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    name: ingredient.name?.trim() || "",
    unit: ingredient.unit?.trim() || "",
  }));
}

/**
 * Validates that a trimmed string is not empty
 * @param value - The string value to validate
 * @param fieldName - Name of the field for error message
 * @returns Error message if invalid, undefined if valid
 */
export function validateTrimmedString(
  value: string,
  fieldName: string,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${fieldName} cannot be empty`;
  }
  return undefined;
}
