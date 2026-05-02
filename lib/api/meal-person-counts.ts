import type { MealType } from "@/types/menus";

import api from "./axios";

export interface MealPersonCount {
  id: string;
  date: string | Date;
  mealType: MealType;
  kitchenId: string;
  personTypeId: string;
  count: number;
}

export async function fetchMealPersonCounts(
  kitchenId: string,
  params: { epochMs: number; mealType?: MealType },
) {
  const response = await api.get(`/kitchens/${kitchenId}/meal-person-counts/`, {
    params,
  });
  return response.data as MealPersonCount[];
}

export async function saveMealPersonCount(
  kitchenId: string,
  data: {
    epochMs: number;
    mealType: MealType;
    personTypeId: string;
    count: number;
  },
) {
  const response = await api.put(
    `/kitchens/${kitchenId}/meal-person-counts/`,
    data,
  );
  return response.data;
}
