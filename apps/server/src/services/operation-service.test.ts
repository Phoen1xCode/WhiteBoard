import { describe, expect, it } from "vitest";
import type { WhiteBoardElement, WhiteBoardOperation } from "@whiteboard/shared/types";
import { replayOps, validateOperationPayload } from "./operation-service";

const rect = (id: string, x = 0): WhiteBoardElement => ({
  id,
  type: "rectangle",
  x,
  y: 0,
  width: 10,
  height: 10,
  strokeColor: "#000",
  strokeWidth: 1,
});

describe("replayOps", () => {
  it("applies add/update/delete/clear in order", () => {
    const ops: WhiteBoardOperation[] = [
      { type: "add", boardId: "b1", element: rect("e1") },
      { type: "add", boardId: "b1", element: rect("e2", 5) },
      { type: "update", boardId: "b1", elementId: "e1", changes: { x: 99 } },
      { type: "delete", boardId: "b1", elementId: "e2" },
    ];

    const state = replayOps({ elements: [] }, ops);
    expect(state.elements).toHaveLength(1);
    expect(state.elements[0]?.id).toBe("e1");
    expect(state.elements[0] && "x" in state.elements[0] && state.elements[0].x).toBe(99);

    const cleared = replayOps(state, [{ type: "clear", boardId: "b1" }]);
    expect(cleared.elements).toHaveLength(0);
  });

  it("starts from snapshot elements", () => {
    const state = replayOps(
      { elements: [rect("base", 1)] },
      [{ type: "update", boardId: "b1", elementId: "base", changes: { y: 8 } }]
    );
    expect(state.elements[0]).toMatchObject({ id: "base", x: 1, y: 8 });
  });
});

describe("validateOperationPayload", () => {
  it("accepts valid add and rejects board mismatch", () => {
    const op = validateOperationPayload(
      { type: "add", boardId: "b1", element: rect("e1") },
      "b1"
    );
    expect(op.type).toBe("add");

    expect(() =>
      validateOperationPayload(
        { type: "add", boardId: "other", element: rect("e1") },
        "b1"
      )
    ).toThrow(/boardId mismatch/);
  });
});
