import api from "@/lib/api/axios";

export async function fetchReportData() {
  const response = await api.get("/reports");
  return response.data;
}

export async function createReport(data: any) {
  const response = await api.post("/reports", data);
  return response.data;
}

export async function updateReport(id: string, data: any) {
  const response = await api.put(`/reports?id=${id}`, data);
  return response.data;
}

export async function deleteReport(id: string) {
  const response = await api.delete(`/reports?id=${id}`);
  return response.data;
}
