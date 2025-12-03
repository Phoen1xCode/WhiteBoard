import { useEffect } from "react";
import { useWhiteboardStore } from "../store/whiteboardStore";
import type { ShapeType } from "@whiteboard/shared/types";

interface UseKeyboardShortcutsOptions {
  boardId: string;
}

export function useKeyboardShortcuts({ boardId }: UseKeyboardShortcutsOptions) {
  const setCurrentTool = useWhiteboardStore((s) => s.setCurrentTool);
  const deleteSelectedElement = useWhiteboardStore(
    (s) => s.deleteSelectedElement
  );
  const undo = useWhiteboardStore((s) => s.undo);
  const redo = useWhiteboardStore((s) => s.redo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is on input elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Detect if user is on macOS by checking for metaKey
      const ctrlOrCmd = e.metaKey || e.ctrlKey;

      // Undo: Ctrl+Z / Cmd+Z
      if (ctrlOrCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo(boardId);
        return;
      }

      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y
      if (ctrlOrCmd && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo(boardId);
        return;
      }

      // Delete selected element: Delete or Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        const selectedElementId =
          useWhiteboardStore.getState().selectedElementId;
        if (selectedElementId) {
          e.preventDefault();
          deleteSelectedElement(boardId);
        }
        return;
      }

      // Escape: Deselect
      if (e.key === "Escape") {
        e.preventDefault();
        useWhiteboardStore.getState().setSelectedElementId(null);
        return;
      }

      // Tool shortcuts (only when no modifier keys are pressed)
      if (!ctrlOrCmd && !e.altKey && !e.shiftKey) {
        const toolMap: Record<string, ShapeType> = {
          "1": "freehand",
          p: "freehand", // Pen
          "2": "rectangle",
          r: "rectangle",
          "3": "circle",
          c: "circle",
          "4": "line",
          l: "line",
          "5": "eraser",
          e: "eraser",
        };

        const tool = toolMap[e.key.toLowerCase()];
        if (tool) {
          e.preventDefault();
          setCurrentTool(tool);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [boardId, setCurrentTool, deleteSelectedElement, undo, redo]);
}
