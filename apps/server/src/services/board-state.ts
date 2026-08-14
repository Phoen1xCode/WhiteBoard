import type { WhiteBoardElement, WhiteBoardOperation } from "@whiteboard/shared/types";

import { whiteBoardElementSchema } from "@whiteboard/shared/schemas";

export interface BoardState {
  elements: WhiteBoardElement[];
}

export function parseSnapshotElements(snapshot: unknown): WhiteBoardElement[] {
  if (!snapshot || typeof snapshot !== "object" || !("elements" in snapshot)) {
    return [];
  }

  const elements = (snapshot as { elements?: unknown }).elements;
  if (!Array.isArray(elements)) {
    return [];
  }

  return elements.flatMap((element) => {
    const result = whiteBoardElementSchema.safeParse(element);
    return result.success ? [result.data] : [];
  });
}

export function getElementId(operation: WhiteBoardOperation): string | null {
  switch (operation.type) {
    case "add":
      return operation.element.id;
    case "update":
    case "delete":
      return operation.elementId;
    case "clear":
      return null;
  }
}

export function applyOperations(
  snapshot: BoardState,
  operations: WhiteBoardOperation[],
): BoardState {
  const elementsMap: Record<string, WhiteBoardElement> = {};

  for (const element of snapshot.elements) {
    elementsMap[element.id] = element;
  }

  for (const operation of operations) {
    switch (operation.type) {
      case "add":
        elementsMap[operation.element.id] = operation.element;
        break;
      case "update":
        if (elementsMap[operation.elementId]) {
          elementsMap[operation.elementId] = {
            ...elementsMap[operation.elementId],
            ...operation.changes,
          } as WhiteBoardElement;
        }
        break;
      case "delete":
        delete elementsMap[operation.elementId];
        break;
      case "clear":
        for (const key of Object.keys(elementsMap)) {
          delete elementsMap[key];
        }
        break;
    }
  }

  return { elements: Object.values(elementsMap) };
}
