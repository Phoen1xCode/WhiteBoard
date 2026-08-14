import { z } from "zod";

export const shapeTypeSchema = z.enum([
  "freehand",
  "rectangle",
  "circle",
  "line",
  "text",
  "select",
  "eraser",
]);

export type ShapeType = z.infer<typeof shapeTypeSchema>;

const baseElementFields = {
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  strokeColor: z.string(),
  strokeWidth: z.number(),
  strokeDashArray: z.array(z.number()).optional(),
};

export const baseElementSchema = z.object({
  ...baseElementFields,
  type: shapeTypeSchema,
});

export type BaseElement = z.infer<typeof baseElementSchema>;

export const freehandElementSchema = z.object({
  ...baseElementFields,
  type: z.literal("freehand"),
  points: z.array(z.number()),
});

export type FreehandElement = z.infer<typeof freehandElementSchema>;

export const rectangleElementSchema = z.object({
  ...baseElementFields,
  type: z.literal("rectangle"),
  width: z.number(),
  height: z.number(),
  fill: z.string().optional(),
});

export type RectangleElement = z.infer<typeof rectangleElementSchema>;

export const circleElementSchema = z.object({
  ...baseElementFields,
  type: z.literal("circle"),
  radius: z.number(),
  fill: z.string().optional(),
});

export type CircleElement = z.infer<typeof circleElementSchema>;

export const lineElementSchema = z.object({
  ...baseElementFields,
  type: z.literal("line"),
  points: z.array(z.number()),
});

export type LineElement = z.infer<typeof lineElementSchema>;

export const whiteBoardElementSchema = z.discriminatedUnion("type", [
  freehandElementSchema,
  rectangleElementSchema,
  circleElementSchema,
  lineElementSchema,
]);

export type WhiteBoardElement = z.infer<typeof whiteBoardElementSchema>;

export const whiteBoardOperationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("add"),
    boardId: z.string().min(1),
    element: whiteBoardElementSchema,
  }),
  z.object({
    type: z.literal("update"),
    boardId: z.string().min(1),
    elementId: z.string().min(1),
    changes: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal("delete"),
    boardId: z.string().min(1),
    elementId: z.string().min(1),
  }),
  z.object({
    type: z.literal("clear"),
    boardId: z.string().min(1),
  }),
]);

/** `changes` is Partial at the type level; runtime schema stays a loose record. */
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

export const whiteBoardSnapshotSchema = z.object({
  id: z.string(),
  title: z.string(),
  elements: z.array(whiteBoardElementSchema),
  updatedAt: z.iso.datetime(),
});

export type WhiteBoardSnapshot = z.infer<typeof whiteBoardSnapshotSchema>;
