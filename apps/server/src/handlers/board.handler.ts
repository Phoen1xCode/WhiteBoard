import * as boardService from "../services/board.service";
import { BoardError } from "../services/board.service";
import { requireAuth } from "../middleware/auth";
import { jsonOk, jsonCreated, jsonNoContent, jsonError } from "../lib/response";

const BOARD_ROUTE = /^\/api\/v1\/boards\/([^/]+)$/;

/**
 * Handles board routes. Returns null if the route doesn't match.
 */
export async function handleBoardRoute(req: Request, pathname: string): Promise<Response | null> {
  // All board routes require auth
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  try {
    // GET /api/v1/boards — list user's boards
    if (req.method === "GET" && pathname === "/api/v1/boards") {
      const boards = await boardService.listBoards(auth.userId);
      return jsonOk(boards);
    }

    // POST /api/v1/boards — create board
    if (req.method === "POST" && pathname === "/api/v1/boards") {
      const body = (await req.json().catch(() => ({}))) as { title?: string };
      const board = await boardService.createBoard(body.title ?? "Untitled Board", auth.userId);
      return jsonCreated(board);
    }

    // Routes with board ID
    const match = pathname.match(BOARD_ROUTE);
    if (!match) return null;

    const boardId = match[1];

    // GET /api/v1/boards/:id — get board state
    if (req.method === "GET") {
      const board = await boardService.getBoard(boardId);
      return jsonOk(board);
    }

    // PATCH /api/v1/boards/:id — update board metadata
    if (req.method === "PATCH") {
      const body = (await req.json().catch(() => ({}))) as { title?: string };
      const board = await boardService.updateBoard(boardId, body);
      return jsonOk(board);
    }

    // DELETE /api/v1/boards/:id — delete board
    if (req.method === "DELETE") {
      await boardService.deleteBoard(boardId);
      return jsonNoContent();
    }

    return null;
  } catch (err) {
    if (err instanceof BoardError) return jsonError(err.status, err.message);
    throw err;
  }
}
