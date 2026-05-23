import api from "@/lib/api/axios";
import type { Kitchen } from "@/types/kitchens";

export async function fetchKitchens(): Promise<Kitchen[]> {
  const response = await api.get("/kitchens/");
  return response.data;
}

export async function createKitchen(data: {
  name: string;
  description?: string;
  defaultCook?: string;
}): Promise<Kitchen> {
  const response = await api.post("/kitchens/", data);
  return response.data;
}

export async function updateKitchen(
  id: string,
  data: { name: string; description?: string; defaultCook?: string },
): Promise<Kitchen> {
  const response = await api.put(`/kitchens/${id}`, data);
  return response.data;
}

export async function deleteKitchen(id: string): Promise<void> {
  await api.delete(`/kitchens/${id}`);
}
