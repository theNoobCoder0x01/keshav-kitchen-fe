import api from "@/lib/api/axios";

type ReportType = "cook" | "supplier" | "recipes" | "prasad";

export async function fetchReportData({
  type,
  epochMs,
}: {
  type: ReportType;
  epochMs: number;
}) {
  const response = await api.get(`/reports/data/${type}/?epochMs=${epochMs}`);
  return response.data;
}
