import { useEffect } from "react";
import { connect, disconnect, onOperation, offOperation } from "../lib/socket";
import { useWhiteboardStore } from "../store/whiteboardStore";
import { getBoard } from "../lib/api";
import type { WhiteBoardOperation } from "@whiteboard/shared/types";

export function useBoardSync(boardId: string) {
  const setInitialElements = useWhiteboardStore((s) => s.setInitialElements);
  const applyOperation = useWhiteboardStore((s) => s.applyOperation);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const snapshot = await getBoard(boardId);
      if (!mounted) return;
      setInitialElements(snapshot.elements);
    })();

    connect(boardId);
    const handler = (op: WhiteBoardOperation) => {
      applyOperation(op, { local: false });
    };
    onOperation(handler);

    return () => {
      mounted = false;
      offOperation(handler);
      disconnect(boardId);
    };
  }, [boardId, setInitialElements, applyOperation]);
}
