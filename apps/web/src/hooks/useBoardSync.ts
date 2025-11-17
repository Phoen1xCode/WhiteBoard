import { useEffect } from "react";
import { connect, disconnect, onOp, offOp } from "../lib/socket";
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
    onOp(handler);

    return () => {
      mounted = false;
      offOp(handler);
      disconnect(boardId);
    };
  }, [boardId, setInitialElements, applyOperation]);
}
