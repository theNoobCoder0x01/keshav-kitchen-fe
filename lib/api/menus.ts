import api from "./axios";

import type { IngredientFormValue } from "@/types/forms";
import type { MealType } from "@/types/menus";

export async function fetchMenus(params = {}) {
  const response = await api.get("/menus", { params });
  return response.data;
}

export async function fetchMenuStats(date?: Date, kitchenId?: string) {
  const response = await api.get("/menus/stats", {
    params: {
      date,
      kitchenId,
    },
  });
  return response.data;
}

export async function createMenu(data: {
  date: Date;
  mealType: MealType;
  recipeId: string;
  kitchenId: string;
  userId: string;
  preparedQuantity: number;
  preparedQuantityUnit: string;
  servingQuantity: number;
  servingQuantityUnit: string;
  quantityPerPiece?: number;
  ghanFactor?: number;
  notes?: string;
  ingredients?: IngredientFormValue[];
  menuComponentId?: string;
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
