"use client";

import { createContext, useContext } from "react";

import type { Kitchen } from "@/types/kitchens";
import type { MealType } from "@/types/menus";
import type { RecipeApiItem } from "@/types/recipes";

// Shared, page-level data for the Daily Menu Builder. Fetched once on the page
// and provided to every row so a day with many rows does not refetch recipes /
// kitchens per row (the AddMealDialog fetches per-open; the builder must not).
export interface DailyMenuContextValue {
  recipes: RecipeApiItem[];
  kitchens: Kitchen[];
  premiseId: string;
  selectedDate: Date;
  userId: string;
  /** Day-level default kitchen; each row pre-fills with it but may override. */
  defaultKitchenId: string;
  /** Saved person counts for the day, keyed by mealType then personTypeId. */
  personCountsByMealType: Record<string, Record<string, number>>;
}

const DailyMenuContext = createContext<DailyMenuContextValue | null>(null);

export const DailyMenuProvider = DailyMenuContext.Provider;

export function useDailyMenuContext(): DailyMenuContextValue {
  const ctx = useContext(DailyMenuContext);
  if (!ctx) {
    throw new Error(
      "useDailyMenuContext must be used within a DailyMenuProvider",
    );
  }
  return ctx;
}

export type { MealType };
