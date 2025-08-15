export type ApiSuccess<T> = { success: true; message?: string; data: T };
export type ApiError = {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
};

export function respond<T>(
  data: T,
  message?: string,
  init?: number | ResponseInit,
) {
  const status =
    typeof init === "number" ? init : ((init as ResponseInit)?.status ?? 200);
  return Response.json<ApiSuccess<T>>(
    { success: true, message, data },
    { status, ...(typeof init === "object" ? init : {}) },
  );
}

export function respondError(
  message: string,
  init?: number | ResponseInit,
  extras?: Partial<ApiError>,
) {
  const status =
    typeof init === "number" ? init : ((init as ResponseInit)?.status ?? 400);
  return Response.json<ApiError>(
    { success: false, message, ...extras },
    { status, ...(typeof init === "object" ? init : {}) },
  );
}
