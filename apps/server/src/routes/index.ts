import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { createRouter } from "@/lib/hono";
import { jsonContent } from "@/routes/openapi";

const indexRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Index"],
  responses: {
    200: jsonContent(z.object({ message: z.string() }), "API index"),
  },
});

export const indexRoutes = createRouter().openapi(indexRoute, (c) => {
  return c.json({ message: "WhiteBoard API" }, 200);
});
