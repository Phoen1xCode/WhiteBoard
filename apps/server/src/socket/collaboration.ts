import type {
  CommittedOperationPayload,
  OperationAckPayload,
  OperationReplayResultPayload,
} from "@whiteboard/shared/types/socket";

import type { CommitOperationInput, CommittedOperation } from "@/services/operations";

import { HttpError } from "@/lib/errors";
import { operationsService } from "@/services/operations";
import { presence } from "@/socket/presence";

function toCommittedPayload(operation: CommittedOperation): CommittedOperationPayload {
  const { created: _created, ...payload } = operation;
  return payload;
}

async function commitOnBoard(input: {
  boardId: string;
  userId: string;
  socketId: string;
  operation: CommitOperationInput["operation"];
  clientOpId?: string | null;
}): Promise<{ ack: OperationAckPayload; broadcast: CommittedOperationPayload | null }> {
  if (!presence.isPresent(input.boardId, input.socketId)) {
    throw new HttpError(400, "NOT_JOINED", "Join the board before committing");
  }

  const committed = await operationsService.commitOperation({
    boardId: input.boardId,
    operation: input.operation,
    userId: input.userId,
    clientOpId: input.clientOpId ?? null,
  });

  const operation = toCommittedPayload(committed);
  return {
    ack: {
      ok: true,
      clientOpId: committed.clientOpId,
      seq: committed.seq,
      serverTime: new Date().toISOString(),
      operation,
    },
    broadcast: committed.created ? operation : null,
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

export const collaboration = { commitOnBoard, replayOnBoard };
