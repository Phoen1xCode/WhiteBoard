import type { WhiteBoardSnapshot } from "@whiteboard/shared/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export interface BoardListItem {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export async function createBoard(title?: string): Promise<WhiteBoardSnapshot> {
  const res = await fetch(`${API_BASE}/api/v1/boards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create board");
  return res.json();
}

export async function getBoard(id: string): Promise<WhiteBoardSnapshot> {
  const res = await fetch(`${API_BASE}/api/v1/boards/${id}`);
  if (!res.ok) throw new Error("Board not found");
  return res.json();
}

export async function listBoards(): Promise<BoardListItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/boards`);
  if (!res.ok) throw new Error("Failed to fetch boards");
  return res.json();
}

export async function deleteBoard(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/boards/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete board");
}
