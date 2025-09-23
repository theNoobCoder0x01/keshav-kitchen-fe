import api from "./axios";

import type { IngredientFormValue } from "@/types/forms";
import type { MealType } from "@/types/menus";

export async function fetchMenus(params = {}) {
  const response = await api.get("/menus", { params });
  return response.data;
}

export async function fetchMenu(id: string, params = {}) {
  const response = await api.get(`/menus/${id}`, { params });
  return response.data;
}

export async function fetchMenuStats(epochMs: number, kitchenId?: string) {
  const response = await api.get("/menus/stats/", {
    params: {
      epochMs,
      kitchenId,
    },
  });
  return response.data;
}

export async function createMenu(data: {
  epochMs: number;
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
  ingredientGroups?: Array<{
    id?: string;
    name: string;
    sortOrder: number;
  }>;
  deletedIngredientGroupIds?: string[];
}) {
  const response = await api.post("/menus/", data);
  return response.data;
}

export async function updateMenu(
  id: string,
  data: {
    epochMs?: number;
    mealType?: MealType;
    recipeId?: string;
    kitchenId?: string;
    userId?: string;
    preparedQuantity?: number;
    preparedQuantityUnit?: string;
    servingQuantity?: number;
    servingQuantityUnit?: string;
    quantityPerPiece?: number | null;
    ghanFactor?: number;
    notes?: string;
    ingredients?: IngredientFormValue[];
    menuComponentId?: string;
    ingredientGroups?: Array<{
      id?: string;
      name: string;
      sortOrder: number;
    }>;
    deletedIngredientGroupIds?: string[];
    // Allow any additional fields without breaking callers
    [key: string]: any;
  }
) {
  const response = await api.put(`/menus/?id=${id}`, data);
  return response.data;
}

export async function deleteMenu(id: string) {
  const response = await api.delete(`/menus/?id=${id}`);
  return response.data;
}
