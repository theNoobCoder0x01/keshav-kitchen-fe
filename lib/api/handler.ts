import { ZodSchema } from "zod";
import { ERR } from "./errors";
import { respond, respondError } from "./response";

type Ctx = {
  params?: Record<string, string>;
  searchParams: URLSearchParams;
  headers: Headers;
};

export function apiHandler<TBody = unknown, TResult = unknown>(opts: {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  bodySchema?: ZodSchema<TBody>;
  handle: (args: {
    body: TBody;
    ctx: Ctx;
    req: Request;
  }) => Promise<TResult> | TResult;
}) {
  return async (req: Request, ctx: any) => {
    try {
      let body: any = undefined;
      if (opts.bodySchema) {
        const json = await req.json().catch(() => ({}));
        const parsed = opts.bodySchema.safeParse(json);
        if (!parsed.success) {
          return respondError("Invalid request body", 422, {
            code: ERR.VALIDATION,
            details: parsed.error.flatten(),
          });
        }
        body = parsed.data;
      }
      const url = new URL(req.url);
      return respond(
        await opts.handle({
          body,
          ctx: {
            params: ctx?.params,
            searchParams: url.searchParams,
            headers: req.headers,
          },
          req,
        }),
      );
    } catch (e: any) {
      return respondError("Something went wrong", 500, {
        code: ERR.INTERNAL,
        details:
          process.env.NODE_ENV === "development"
            ? (e?.stack ?? String(e))
            : undefined,
      });
    }
  };
}
