import type { KitchenPersonType } from "@/types/kitchens";

import api from "./axios";

export type KitchenPersonTypePayload = Pick<
  KitchenPersonType,
  "name" | "description" | "sequenceNumber"
>;

export async function fetchKitchenPersonTypes(kitchenId: string) {
  const response = await api.get(`/kitchens/${kitchenId}/person-types/`);
  return response.data as KitchenPersonType[];
}

export async function createKitchenPersonType(
  kitchenId: string,
  data: KitchenPersonTypePayload,
) {
  const response = await api.post(`/kitchens/${kitchenId}/person-types/`, data);
  return response.data as KitchenPersonType;
}

export async function updateKitchenPersonType(
  kitchenId: string,
  personTypeId: string,
  data: KitchenPersonTypePayload,
) {
  const response = await api.put(
    `/kitchens/${kitchenId}/person-types/${personTypeId}/`,
    data,
  );
  return response.data as KitchenPersonType;
}

export async function deleteKitchenPersonType(
  kitchenId: string,
  personTypeId: string,
) {
  const response = await api.delete(
    `/kitchens/${kitchenId}/person-types/${personTypeId}/`,
  );
  return response.data as { success: boolean };
}
