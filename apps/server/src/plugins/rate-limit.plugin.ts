import { Elysia } from "elysia";
import { createRateLimiter } from "../middleware/rate-limit";

// Initialise once at plugin-load time (not per-request)
const rateLimitFn = createRateLimiter({ windowMs: 60_000, max: 100 });

export const rateLimitPlugin = new Elysia({ name: "rate-limit" }).onBeforeHandle(
  { as: "global" },
  async ({ request, status }) => {
    const result = await rateLimitFn(request);
    if (result !== null) return status(429, "Too Many Requests");
  },
);
