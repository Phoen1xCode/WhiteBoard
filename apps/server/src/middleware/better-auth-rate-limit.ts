import { createMiddleware } from "hono/factory";

import type { AppBindings } from "@/lib/hono";

import { auth } from "@/lib/auth";
import { errorBody } from "@/lib/errors";

export const betterAuthRateLimit = createMiddleware<AppBindings>(async (c, next) => {
  const limited = await auth.handler(
    new Request(c.req.url, {
      method: "GET",
      headers: c.req.raw.headers,
    }),
  );
  if (limited.status !== 429) {
    await next();
    return;
  }

  const retryAfter = limited.headers.get("X-Retry-After");
  if (retryAfter) {
    c.header("Retry-After", retryAfter);
    c.header("X-Retry-After", retryAfter);
  }
  return c.json(errorBody("RATE_LIMITED", "Too many requests"), 429);
});
