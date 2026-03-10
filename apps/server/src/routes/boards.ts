import * as boardsService from "../services/boardsService";

const ROUTES: [string, RegExp, (req: Request, m: RegExpMatchArray) => Promise<Response>][] = [
  ["GET",    /^\/api\/v1\/boards$/,       handleList],
  ["POST",   /^\/api\/v1\/boards$/,       handleCreate],
  ["GET",    /^\/api\/v1\/boards\/(.+)$/, handleGet],
  ["DELETE", /^\/api\/v1\/boards\/(.+)$/, handleDelete],
];

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  for (const [method, pattern, handler] of ROUTES) {
    if (req.method !== method) continue;
    const match = url.pathname.match(pattern);
    if (match) return handler(req, match);
  }
  return new Response("Not Found", { status: 404 });
}

async function handleList(): Promise<Response> {
  const boards = await boardsService.listBoards();
  return json(
    boards.map((b) => ({
      id: b.id,
      title: b.title,
      updatedAt: b.updatedAt.toISOString(),
      createdAt: b.createdAt.toISOString(),
    }))
  );
}

async function handleCreate(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const board = await boardsService.createBoard(body.title ?? "Untitled Board");
  return json(board, 201);
}

async function handleGet(_req: Request, m: RegExpMatchArray): Promise<Response> {
  const board = await boardsService.getBoard(m[1]);
  if (!board) return json({ error: "Board not found" }, 404);
  return json(board);
}

async function handleDelete(_req: Request, m: RegExpMatchArray): Promise<Response> {
  try {
    await boardsService.deleteBoard(m[1]);
    return new Response(null, { status: 204 });
  } catch {
    return json({ error: "Board not found" }, 404);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
