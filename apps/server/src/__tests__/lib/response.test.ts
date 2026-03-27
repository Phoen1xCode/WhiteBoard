import { describe, test, expect } from "bun:test";
import {
  jsonOk,
  jsonCreated,
  jsonError,
  jsonNoContent,
} from "../../lib/response";

describe("response helpers", () => {
  test("jsonOk returns 200 with JSON body", async () => {
    const res = jsonOk({ id: 1, name: "test" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(await res.json()).toEqual({ id: 1, name: "test" });
  });

  test("jsonCreated returns 201", async () => {
    const res = jsonCreated({ id: 1 });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 1 });
  });

  test("jsonError returns specified status with error object", async () => {
    const res = jsonError(404, "Not Found");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not Found" });
  });

  test("jsonNoContent returns 204 with no body", () => {
    const res = jsonNoContent();
    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
  });
});
