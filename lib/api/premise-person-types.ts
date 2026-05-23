import type { PremisePersonType } from "@/types/premises";

import api from "./axios";

export type PremisePersonTypePayload = Pick<
  PremisePersonType,
  "name" | "description" | "sequenceNumber"
>;

export async function fetchPremisePersonTypes(premiseId: string) {
  const response = await api.get(`/premises/${premiseId}/person-types/`);
  return response.data as PremisePersonType[];
}

export async function createPremisePersonType(
  premiseId: string,
  data: PremisePersonTypePayload,
) {
  const response = await api.post(`/premises/${premiseId}/person-types/`, data);
  return response.data as PremisePersonType;
}

export async function updatePremisePersonType(
  premiseId: string,
  personTypeId: string,
  data: PremisePersonTypePayload,
) {
  const response = await api.put(
    `/premises/${premiseId}/person-types/${personTypeId}/`,
    data,
  );
  return response.data as PremisePersonType;
}

export async function deletePremisePersonType(
  premiseId: string,
  personTypeId: string,
) {
  const response = await api.delete(
    `/premises/${premiseId}/person-types/${personTypeId}/`,
  );
  return response.data as { success: boolean };
}
