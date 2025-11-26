import { create } from "zustand";
import { produce } from "immer";
import type {
  WhiteBoardElement,
  WhiteBoardOperation,
  ShapeType,
} from "@whiteboard/shared/types";
import { sendOp } from "../lib/socket";

type DrawingStyle = {
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  strokeDashArray?: number[];
};

type State = {
  elements: Record<string, WhiteBoardElement>;
  currentTool: ShapeType;
  currentStyle: DrawingStyle;
};

type Actions = {
  setInitialElements: (elements: WhiteBoardElement[]) => void;
  applyOperation: (
    operation: WhiteBoardOperation,
    options?: { local?: boolean }
  ) => void;
  setCurrentTool: (tool: ShapeType) => void;
  setCurrentStyle: (style: Partial<DrawingStyle>) => void;
};

export const useWhiteboardStore = create<State & Actions>((set) => ({
  elements: {},
  currentTool: "freehand",
  currentStyle: {
    strokeColor: "#000000",
    strokeWidth: 2,
    fillColor: undefined,
  },

  setInitialElements: (elements) => {
    set(() => ({
      elements: Object.fromEntries(elements.map((el) => [el.id, el])),
    }));
  },

  applyOperation: (operation, options) => {
    const local = options?.local ?? false;

    set(
      produce((draft: State) => {
        switch (operation.type) {
          case "add":
            draft.elements[operation.element.id] = operation.element;
            break;
          case "update":
            Object.assign(draft.elements[operation.elementId], operation.changes);
            break;
          case "delete":
            delete draft.elements[operation.elementId];
            break;
          case "clear":
            draft.elements = {};
            break;
        }
      })
    );
    if (local) {
      sendOp(operation);
    }
  },

  setCurrentTool: (tool) => {
    set({ currentTool: tool });
  },

  setCurrentStyle: (style) => {
    set(
      produce((draft: State) => {
        Object.assign(draft.currentStyle, style);
      })
    );
  },
}));
