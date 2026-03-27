import { describe, test, expect } from "bun:test";
import { replayOps } from "../../services/operation.service";

describe("replayOps", () => {
  test("add operation inserts an element", () => {
    const elements = new Map<string, any>();
    const ops = [
      { opType: "add", elementId: "e1", payload: { id: "e1", type: "rectangle", x: 0, y: 0 } },
    ];
    const result = replayOps(elements, ops);
    expect(result.get("e1")).toEqual({ id: "e1", type: "rectangle", x: 0, y: 0 });
  });

  test("update operation merges changes", () => {
    const elements = new Map<string, any>([
      ["e1", { id: "e1", type: "rectangle", x: 0, y: 0, width: 100 }],
    ]);
    const ops = [
      { opType: "update", elementId: "e1", payload: { x: 50, width: 200 } },
    ];
    const result = replayOps(elements, ops);
    expect(result.get("e1")).toEqual({ id: "e1", type: "rectangle", x: 50, y: 0, width: 200 });
  });

  test("update on non-existent element is a no-op", () => {
    const elements = new Map<string, any>();
    const ops = [
      { opType: "update", elementId: "e1", payload: { x: 50 } },
    ];
    const result = replayOps(elements, ops);
    expect(result.size).toBe(0);
  });

  test("delete operation removes an element", () => {
    const elements = new Map<string, any>([
      ["e1", { id: "e1", type: "rectangle" }],
      ["e2", { id: "e2", type: "circle" }],
    ]);
    const ops = [{ opType: "delete", elementId: "e1", payload: null }];
    const result = replayOps(elements, ops);
    expect(result.has("e1")).toBe(false);
    expect(result.has("e2")).toBe(true);
  });

  test("clear operation removes all elements", () => {
    const elements = new Map<string, any>([
      ["e1", { id: "e1" }],
      ["e2", { id: "e2" }],
    ]);
    const ops = [{ opType: "clear", elementId: null, payload: null }];
    const result = replayOps(elements, ops);
    expect(result.size).toBe(0);
  });

  test("replays sequence of mixed operations in order", () => {
    const elements = new Map<string, any>();
    const ops = [
      { opType: "add", elementId: "e1", payload: { id: "e1", type: "rect", x: 0 } },
      { opType: "add", elementId: "e2", payload: { id: "e2", type: "circle", x: 10 } },
      { opType: "update", elementId: "e1", payload: { x: 99 } },
      { opType: "delete", elementId: "e2", payload: null },
    ];
    const result = replayOps(elements, ops);
    expect(result.size).toBe(1);
    expect(result.get("e1")?.x).toBe(99);
  });
});
