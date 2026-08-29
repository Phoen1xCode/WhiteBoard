import type { WhiteBoardElement, WhiteBoardOperation } from "@whiteboard/shared/types";

import { describe, expect, it } from "vitest";

import { applyOperations, getElementId, parseSnapshotElements } from "@/services/board-state";

const rectangle: WhiteBoardElement = {
  id: "element-1",
  type: "rectangle",
  x: 10,
  y: 20,
  width: 100,
  height: 50,
  strokeColor: "#111111",
  strokeWidth: 2,
};

function operation(value: WhiteBoardOperation): WhiteBoardOperation {
  return value;
}

describe("board state", () => {
  it("parses valid snapshot elements and drops malformed legacy data", () => {
    expect(
      parseSnapshotElements({
        elements: [rectangle, { ...rectangle, id: "" }, null, { type: "unknown" }],
      }),
    ).toEqual([rectangle]);
    expect(parseSnapshotElements(null)).toEqual([]);
    expect(parseSnapshotElements({ elements: "invalid" })).toEqual([]);
  });

  it("extracts the affected element id for each operation type", () => {
    expect(getElementId(operation({ type: "add", boardId: "board-1", element: rectangle }))).toBe(
      rectangle.id,
    );
    expect(
      getElementId(
        operation({ type: "update", boardId: "board-1", elementId: rectangle.id, changes: {} }),
      ),
    ).toBe(rectangle.id);
    expect(
      getElementId(operation({ type: "delete", boardId: "board-1", elementId: rectangle.id })),
    ).toBe(rectangle.id);
    expect(getElementId(operation({ type: "clear", boardId: "board-1" }))).toBeNull();
  });

  it("applies add, update and delete operations without mutating the source snapshot", () => {
    const snapshot = { elements: [rectangle] };
    const circle: WhiteBoardElement = {
      id: "element-2",
      type: "circle",
      x: 30,
      y: 40,
      radius: 10,
      strokeColor: "#222222",
      strokeWidth: 1,
    };

    const result = applyOperations(snapshot, [
      operation({ type: "add", boardId: "board-1", element: circle }),
      operation({
        type: "update",
        boardId: "board-1",
        elementId: rectangle.id,
        changes: { x: 99, fill: "#ffffff" },
      }),
      operation({ type: "delete", boardId: "board-1", elementId: circle.id }),
    ]);

    expect(result.elements).toEqual([{ ...rectangle, x: 99, fill: "#ffffff" }]);
    expect(snapshot.elements).toEqual([rectangle]);
  });

  it("ignores updates for missing elements and clears the complete board", () => {
    const result = applyOperations({ elements: [rectangle] }, [
      operation({
        type: "update",
        boardId: "board-1",
        elementId: "missing",
        changes: { x: 999 },
      }),
      operation({ type: "clear", boardId: "board-1" }),
    ]);

    expect(result).toEqual({ elements: [] });
  });
});
