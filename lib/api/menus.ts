import api from "./axios";

export async function fetchMenus(params = {}) {
  const response = await api.get("/menus", { params });
  return response.data;
}

import type { IngredientFormValue } from "@/types/forms";
import type { MealType, MenuStatus } from "@/types/menus";

export async function createMenu(data: {
  date: Date;
  mealType: MealType;
  recipeId: string;
  kitchenId: string;
  userId: string;
  servings: number;
  ghanFactor?: number;
  status?: MenuStatus;
  notes?: string;
  ingredients?: IngredientFormValue[];
}) {
  const response = await api.post("/menus", data);
  return response.data;
}

export async function updateMenu(id: string, data: any) {
  const response = await api.put(`/menus?id=${id}`, data);
  return response.data;
}

export async function deleteMenu(id: string) {
  const response = await api.delete(`/menus?id=${id}`);
  return response.data;
}
