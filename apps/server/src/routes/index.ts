import { createRouter } from "@/lib/hono";

export const indexRoutes = createRouter().get("/", (c) => {
  return c.json({ message: "WhiteBoard API" }, 200);
});
