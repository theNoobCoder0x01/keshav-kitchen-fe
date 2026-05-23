import type { MealType } from "@/types/menus";

import api from "./axios";

export interface MealPersonCount {
  id: string;
  date: string | Date;
  mealType: MealType;
  premiseId: string;
  personTypeId: string;
  count: number;
}

export async function fetchMealPersonCounts(
  premiseId: string,
  params: { epochMs: number; mealType?: MealType },
) {
  const response = await api.get(`/premises/${premiseId}/meal-person-counts/`, {
    params,
  });
  return response.data as MealPersonCount[];
}

export async function saveMealPersonCount(
  premiseId: string,
  data: {
    epochMs: number;
    mealType: MealType;
    personTypeId: string;
    count: number;
  },
) {
  const response = await api.put(
    `/premises/${premiseId}/meal-person-counts/`,
    data,
  );
  return response.data;
}
