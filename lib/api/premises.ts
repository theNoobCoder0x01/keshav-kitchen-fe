import api from "@/lib/api/axios";

export async function fetchPremises() {
  const response = await api.get("/premises/");
  return response.data;
}

export async function createPremise(data: {
  name: string;
  location: string;
  sequenceNumber?: number;
}) {
  const response = await api.post("/premises/", data);
  return response.data;
}

export async function updatePremise(
  id: string,
  data: { name: string; location: string; sequenceNumber?: number },
) {
  const response = await api.put(`/premises/${id}`, data);
  return response.data;
}

export async function deletePremise(id: string) {
  const response = await api.delete(`/premises/${id}`);
  return response.data;
}
