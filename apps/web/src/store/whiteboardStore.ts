import { create } from "zustand";
import { produce } from "immer";
import type {
  WhiteBoardElement,
  WhiteBoardOperation,
} from "@whiteboard/shared/types";
import { sendOp } from "../lib/socket";

type State = {
  elements: Record<string, WhiteBoardElement>;
};

type Actions = {
  setInitialElements: (elements: WhiteBoardElement[]) => void;
  applyOperation: (
    operation: WhiteBoardOperation,
    options?: { local?: boolean }
  ) => void;
};

export const useWhiteboardStore = create<State & Actions>((set) => ({
  elements: {},

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
            Object.assign(draft.elements[operation.boardId], operation.changes);
            break;
          case "delete":
            delete draft.elements[operation.boardId];
            break;
          case "clear":
            draft.elements = {};
            break;
        }
      })
    );
    if (!local) {
      sendOp(operation);
    }
  },
}));
