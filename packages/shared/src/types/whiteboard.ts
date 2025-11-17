// packages/shared/src/types/whiteboard.ts

export type ShapeType = "freehand" | "rectangle" | "circle" | "line" | "text";

export interface BaseElement {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  strokeColor: string;
  strokeWidth: number;
}

export interface FreehandElement extends BaseElement {
  type: "freehand";
  points: number[];
}

export type WhiteBoardElement = FreehandElement;

export interface WhiteBoard {
  id: string;
  title: string;
  elements: WhiteBoardElement[];
}

export interface WhiteBoardSnapshot {
  id: string;
  title: string;
  elements: WhiteBoardElement[];
  updatedAt: string;
}

export type WhiteBoardOperation =
  | { type: "add"; boardId: string; element: WhiteBoardElement }
  | {
      type: "update";
      boardId: string;
      elementId: string;
      changes: Partial<WhiteBoardElement>;
    }
  | { type: "delete"; boardId: string; elementId: string }
  | { type: "clear"; boardId: string };
