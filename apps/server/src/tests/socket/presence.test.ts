import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireBoardView: vi.fn(),
}));

vi.mock("@/services/boards", () => ({ requireBoardView: mocks.requireBoardView }));

import { HttpError } from "@/lib/errors";
import { boardRoom, presence, userRoom } from "@/socket/presence";

const alice = { id: "user-1", email: "alice@example.com", username: "alice" };
const bob = { id: "user-2", email: "bob@example.com", username: "bob" };
const tracked = [
  { boardId: "board-presence", userId: alice.id, socketId: "socket-1" },
  { boardId: "board-presence", userId: bob.id, socketId: "socket-2" },
];

describe("socket presence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireBoardView.mockResolvedValue({ id: "board-presence" });
  });

  afterEach(() => {
    for (const entry of tracked) presence.leaveBoard(entry);
  });

  it("builds stable room names", () => {
    expect(boardRoom("board-1")).toBe("board:board-1");
    expect(userRoom("user-1")).toBe("user:user-1");
  });

  it("checks board access before exposing and storing presence", async () => {
    mocks.requireBoardView.mockRejectedValue(
      new HttpError(403, "FORBIDDEN", "No permission to access this board"),
    );

    await expect(
      presence.joinBoard({ boardId: "board-presence", user: alice, socketId: "socket-1" }),
    ).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(presence.isPresent("board-presence", "socket-1")).toBe(false);
  });

  it("tracks every socket, lists joined boards and removes empty rooms", async () => {
    const first = await presence.joinBoard({
      boardId: "board-presence",
      user: alice,
      socketId: "socket-1",
    });
    const second = await presence.joinBoard({
      boardId: "board-presence",
      user: bob,
      socketId: "socket-2",
    });

    expect(first.members).toEqual([alice]);
    expect(second.members).toEqual([alice, bob]);
    expect(presence.listPresentBoardIds("socket-1")).toEqual(["board-presence"]);

    expect(
      presence.leaveBoard({
        boardId: "board-presence",
        userId: alice.id,
        socketId: "socket-1",
      }),
    ).toEqual({ boardId: "board-presence", userId: alice.id, socketId: "socket-1" });
    expect(presence.isPresent("board-presence", "socket-1")).toBe(false);
    expect(presence.isPresent("board-presence", "socket-2")).toBe(true);

    presence.leaveBoard({
      boardId: "board-presence",
      userId: bob.id,
      socketId: "socket-2",
    });
    expect(presence.listPresentBoardIds("socket-2")).toEqual([]);
  });
});
