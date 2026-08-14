import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { createRouter } from "@/lib/create-app";
import { jsonContent } from "@/lib/open-api";

const indexRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Index"],
  responses: {
    200: jsonContent(z.object({ message: z.string() }), "API index"),
  },
});

export function createIndexRouter() {
  return createRouter().openapi(indexRoute, (c) => {
    return c.json({ message: "WhiteBoard API" }, 200);
  });
}
