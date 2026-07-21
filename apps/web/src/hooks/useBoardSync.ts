import type { WhiteBoardOperation } from "@whiteboard/shared/types";

import { useEffect } from "react";

import { getBoard } from "../lib/api";
import {
  connect,
  disconnect,
  failBoardReady,
  offOperation,
  onOperation,
  resetLastConfirmedSeq,
} from "../lib/socket";
import { useWhiteboardStore } from "../store/whiteboardStore";

export function useBoardSync(boardId: string) {
  const setInitialElements = useWhiteboardStore((s) => s.setInitialElements);
  const applyOperation = useWhiteboardStore((s) => s.applyOperation);

  useEffect(() => {
    let mounted = true;
    const handler = (op: WhiteBoardOperation) => {
      applyOperation(op, { local: false });
    };

    onOperation(handler);

    (async () => {
      try {
        const snapshot = await getBoard(boardId);
        if (!mounted) return;
        setInitialElements(snapshot.elements);
        // Snapshot already includes all ops through lastSeq; only replay newer ones.
        resetLastConfirmedSeq(snapshot.lastSeq ?? 0);
        connect(boardId);
      } catch (error) {
        console.error("Failed to sync board:", error);
        failBoardReady(error instanceof Error ? error.message : "Failed to sync board");
      }
    })();

    return () => {
      mounted = false;
      offOperation(handler);
      disconnect(boardId);
    };
  }, [boardId, setInitialElements, applyOperation]);
}
