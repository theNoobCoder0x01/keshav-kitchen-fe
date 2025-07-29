import axiosInstance from "./axios";

export async function fetchReports() {
  const response = await axiosInstance.get("/reports");
  return response.data;
}

export async function createReport(data: any) {
  const response = await axiosInstance.post("/reports", data);
  return response.data;
}

export async function updateReport(id: string, data: any) {
  const response = await axiosInstance.put(`/reports?id=${id}`, data);
  return response.data;
}

export async function deleteReport(id: string) {
  const response = await axiosInstance.delete(`/reports?id=${id}`);
  return response.data;
}
