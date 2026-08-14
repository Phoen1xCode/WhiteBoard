import type {
  CommittedOperationPayload,
  OperationAckPayload,
  OperationReplayResultPayload,
} from "@whiteboard/shared/types/socket";

import type { CommittedOperation, OperationsService } from "@/services/operations.service";
import type { Presence } from "@/services/presence";

import { ApiError } from "@/shared/api-error";

function toCommittedPayload(operation: CommittedOperation): CommittedOperationPayload {
  return {
    id: operation.id,
    boardId: operation.boardId,
    userId: operation.userId,
    seq: operation.seq,
    opType: operation.opType,
    elementId: operation.elementId,
    clientOpId: operation.clientOpId,
    payload: operation.payload,
    createdAt: operation.createdAt,
  };
}

export function createCollaboration({
  presence,
  operationsService,
}: {
  presence: Presence;
  operationsService: OperationsService;
}) {
  async function commitOnBoard(input: {
    boardId: string;
    userId: string;
    socketId: string;
    operation: Parameters<OperationsService["commitOperation"]>[0]["operation"];
    clientOpId?: string | null;
  }): Promise<{ ack: OperationAckPayload; broadcast: CommittedOperationPayload | null }> {
    if (!presence.isPresent(input.boardId, input.socketId)) {
      throw new ApiError(400, "NOT_JOINED", "Join the board before committing");
    }

    const committed = await operationsService.commitOperation({
      boardId: input.boardId,
      operation: input.operation,
      userId: input.userId,
      clientOpId: input.clientOpId ?? null,
    });

    const operationPayload = toCommittedPayload(committed);
    return {
      ack: {
        ok: true,
        clientOpId: committed.clientOpId,
        seq: committed.seq,
        serverTime: new Date().toISOString(),
        operation: operationPayload,
      },
      broadcast: committed.created ? operationPayload : null,
    };
  }

  async function replayOnBoard(input: {
    boardId: string;
    userId: string;
    fromSeq: number;
  }): Promise<OperationReplayResultPayload> {
    const operations = await operationsService.getOperationsAfter(
      input.boardId,
      input.fromSeq,
      input.userId,
    );
    return {
      boardId: input.boardId,
      fromSeq: input.fromSeq,
      operations: operations.map(toCommittedPayload),
    };
  }

  return { commitOnBoard, replayOnBoard };
}

export type Collaboration = ReturnType<typeof createCollaboration>;
