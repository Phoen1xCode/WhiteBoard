// packages/shared/src/types/whiteboard.ts

export type ShapeType = "freehand" | "rectangle" | "circle" | "line" | "text" | "eraser";

export interface BaseElement {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  strokeColor: string;
  strokeWidth: number;
  strokeDashArray?: number[];
}

// 自由线条
export interface FreehandElement extends BaseElement {
  type: "freehand";
  points: number[];
}

// 矩形
export interface RectangleElement extends BaseElement {
  type: "rectangle";
  width: number;
  height: number;
  fill?: string;
}

// 圆形
export interface CircleElement extends BaseElement {
  type: "circle";
  radius: number;
  fill?: string;
}

// 直线
export interface LineElement extends BaseElement {
  type: "line";
  points: number[]; // [x1, y1, x2, y2]
}

export type WhiteBoardElement =
  | FreehandElement
  | RectangleElement
  | CircleElement
  | LineElement;

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
