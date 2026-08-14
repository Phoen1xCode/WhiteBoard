import { Scalar } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "@/lib/types";

import packageJson from "../../package.json" with { type: "json" };

export function configureOpenAPI(app: AppOpenAPI) {
  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
  });

  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      title: "WhiteBoard API",
      version: packageJson.version,
    },
  });

  app.get(
    "/reference",
    Scalar({
      url: "/doc",
      theme: "kepler",
      layout: "classic",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
    }),
  );
}
