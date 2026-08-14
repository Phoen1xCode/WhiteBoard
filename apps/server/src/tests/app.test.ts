import { testClient } from "hono/testing";
import { describe, expect, expectTypeOf, it } from "vitest";

import { createApp } from "@/app";
import { errorHandler, HttpError } from "@/lib/errors";
import { createRouter } from "@/lib/hono";

describe("application", () => {
  it("serves all route groups and keeps the stable 404 shape", async () => {
    const app = createApp();
    const client = testClient(app);
    expectTypeOf(client.api.v1.auth.register.$post).toBeFunction();
    expectTypeOf(client.api.v1.boards[":id"].$get).toBeFunction();

    const index = await app.request("/");
    const missing = await app.request("/missing");

    expect(index.status).toBe(200);
    expect(await index.json()).toEqual({ message: "WhiteBoard API" });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Not Found" },
    });
  });

  it("maps HttpError and hides internal messages", async () => {
    const app = createRouter();
    app.onError(errorHandler);
    app.get("/missing", () => {
      throw new HttpError(404, "BOARD_NOT_FOUND", "Board not found");
    });
    app.get("/internal", () => {
      throw new HttpError(500, "INTERNAL_SERVER_ERROR", "database details");
    });

    const missing = await app.request("/missing");
    const internal = await app.request("/internal");

    expect(await missing.json()).toEqual({
      error: { code: "BOARD_NOT_FOUND", message: "Board not found" },
    });
    expect(await internal.json()).toEqual({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Internal Server Error" },
    });
  });
});
