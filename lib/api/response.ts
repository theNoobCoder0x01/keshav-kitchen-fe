import type { ApiError, ApiSuccess } from "@/types/api";

export function respond<T>(
  data: T,
  message?: string,
  init?: number | ResponseInit,
) {
  const status =
    typeof init === "number" ? init : ((init as ResponseInit)?.status ?? 200);
  return Response.json({ success: true, message, data } as ApiSuccess<T>, {
    status,
    ...(typeof init === "object" ? init : {}),
  });
}

export function respondError(
  message: string,
  init?: number | ResponseInit,
  extras?: Partial<ApiError>,
) {
  const status =
    typeof init === "number" ? init : ((init as ResponseInit)?.status ?? 400);
  return Response.json({ success: false, message, ...extras } as ApiError, {
    status,
    ...(typeof init === "object" ? init : {}),
  });
}
