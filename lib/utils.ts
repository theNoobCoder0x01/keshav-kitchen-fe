import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to at most 3 decimal places, trimming trailing zeros.
 * e.g. 1.5000 → "1.5", 0.1 → "0.1", 1.23456 → "1.235"
 */
export function formatDecimal(value: number, maxDecimals: number = 3): string {
  return parseFloat(value.toFixed(maxDecimals)).toString();
}
