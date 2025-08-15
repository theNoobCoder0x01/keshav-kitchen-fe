# API Standardization Plan

## 1) Define the Standard (single source of truth)
Create a small API toolkit (e.g., `lib/api/`):

### 1.1 Response helpers (`lib/api/response.ts`)
```ts
export type ApiSuccess<T> = { success: true; message?: string; data: T };
export type ApiError = { success: false; message: string; code?: string; details?: unknown };

export function respond<T>(data: T, message?: string, init?: number | ResponseInit) {
  const status = typeof init === "number" ? init : (init as ResponseInit)?.status ?? 200;
  return Response.json<ApiSuccess<T>>({ success: true, message, data }, { status, ...(typeof init === "object" ? init : {}) });
}

export function respondError(message: string, init?: number | ResponseInit, extras?: Partial<ApiError>) {
  const status = typeof init === "number" ? init : (init as ResponseInit)?.status ?? 400;
  return Response.json<ApiError>({ success: false, message, ...extras }, { status, ...(typeof init === "object" ? init : {}) });
}
```

### 1.2 Error taxonomy (`lib/api/errors.ts`)
```ts
export const ERR = {
  VALIDATION: "VALIDATION_ERROR",
  AUTH: "AUTH_REQUIRED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL: "INTERNAL",
} as const;
```

### 1.3 Validation & handler wrapper (`lib/api/handler.ts`)
```ts
import { ZodSchema } from "zod";
import { respond, respondError } from "./response";
import { ERR } from "./errors";

type Ctx = { params?: Record<string,string>; searchParams: URLSearchParams; headers: Headers };

export function apiHandler<TBody = unknown, TResult = unknown>(opts: {
  method: "GET"|"POST"|"PUT"|"PATCH"|"DELETE";
  bodySchema?: ZodSchema<TBody>;
  handle: (args: { body: TBody; ctx: Ctx; req: Request }) => Promise<TResult> | TResult;
}) {
  return async (req: Request, ctx: any) => {
    try {
      let body: any = undefined;
      if (opts.bodySchema) {
        const json = await req.json().catch(() => ({}));
        const parsed = opts.bodySchema.safeParse(json);
        if (!parsed.success) {
          return respondError("Invalid request body", 422, { code: ERR.VALIDATION, details: parsed.error.flatten() });
        }
        body = parsed.data;
      }
      const url = new URL(req.url);
      return respond(await opts.handle({ body, ctx: { params: ctx?.params, searchParams: url.searchParams, headers: req.headers }, req }));
    } catch (e: any) {
      return respondError("Something went wrong", 500, { code: ERR.INTERNAL, details: process.env.NODE_ENV === "development" ? e?.stack ?? String(e) : undefined });
    }
  };
}
```

### 1.4 Route template (for Next.js `app/api/**/route.ts`)
```ts
import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { respondError } from "@/lib/api/response";
import { ERR } from "@/lib/api/errors";

const Body = z.object({ /* define inputs */ });

export const POST = apiHandler({
  method: "POST",
  bodySchema: Body,
  async handle({ body, ctx }) {
    return { /* result shape */ };
  },
});
```

## 2) Inventory & Classify All Routes
- List all endpoints and document methods, request/response shapes, status codes, and auth requirements.
- Keep a progress table in `docs/api-audit.md`.

## 3) Map All Call Sites
- Search for API usage (`fetch`, `axios`, etc.) and record them in the audit table.

## 4) Establish Versioning / Migration Strategy
- Choose in-place refactor or versioned API.

## 5) Refactor Routes
For each route:
1. Add validation.
2. Wrap with `apiHandler`.
3. Standardize responses with `respond`/`respondError`.
4. Normalize status codes.
5. Centralize auth checks.
6. Optional logging.

## 6) Update Callers
- Update request shape, response handling, and types for all callers.

## 7) Add Lightweight Tests
- Test success and error responses.
- Type-check exported types.

## 8) Automated Codemods
- Replace direct `NextResponse.json` with `respond`.
- Wrap handlers with `apiHandler`.

## 9) Linting & Consistency Enforcement
- ESLint rule to prevent raw JSON responses.

## 10) Observability & Safety Nets
- Log errors with `code` and `path`.
- Add feature flags if needed.

## 11) Documentation
- Update audit and usage docs.

## 12) Definition of Done
- All routes standardized.
- Callers updated.
- Tests pass.
- Docs updated.
