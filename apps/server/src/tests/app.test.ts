import { createMiddleware } from "hono/factory";
import { testClient } from "hono/testing";
import { describe, expect, expectTypeOf, it } from "vitest";

import type { BetterAuth } from "@/lib/better-auth";
import type { AuthMiddleware } from "@/middlewares/auth";
import type { AuthService } from "@/services/auth.service";
import type { BoardsService } from "@/services/boards.service";

import { createApp } from "@/app";

function createDocumentedApp() {
  const authMiddleware = createMiddleware(async (c, next) => next()) as AuthMiddleware;

  return createApp({
    auth: { handler: async () => new Response() } as unknown as BetterAuth,
    authService: {} as AuthService,
    authMiddleware,
    boardsService: {} as BoardsService,
    onLogout: () => {},
  });
}

describe("application", () => {
  it("serves all route groups in OpenAPI and keeps the stable 404 shape", async () => {
    const app = createDocumentedApp();
    const client = testClient(app);
    expectTypeOf(client.api.v1.auth.register.$post).toBeFunction();
    expectTypeOf(client.api.v1.boards[":id"].$get).toBeFunction();

    const index = await app.request("/");
    const document = await app.request("/doc");
    const missing = await app.request("/missing");

    expect(index.status).toBe(200);
    expect(await index.json()).toEqual({ message: "WhiteBoard API" });
    expect(document.status).toBe(200);
    expect(await document.json()).toMatchObject({
      openapi: "3.0.0",
      info: { title: "WhiteBoard API" },
      paths: {
        "/": { get: {} },
        "/api/v1/auth/register": { post: {} },
        "/api/v1/boards": { get: {}, post: {} },
        "/api/v1/boards/{id}": {
          get: {
            parameters: [{ name: "id", in: "path", required: true }],
          },
          patch: {},
          delete: {},
        },
      },
    });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Not Found" },
    });
  });
});
