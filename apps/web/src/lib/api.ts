import type { WhiteBoardSnapshot } from "@whiteboard/shared/types";

import { clearSession, getAccessToken, getRefreshToken, saveSession } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export interface BoardListItem {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export interface SafeUser {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SafeUser;
  tokens: TokenPair;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error: { code: string; message: string };
}

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearSession();
    return null;
  }

  const body = await parseJson<ApiSuccess<AuthResult>>(res);
  saveSession(body.data.user, body.data.tokens);
  return body.data.tokens.accessToken;
}

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401 && auth) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      headers.set("Authorization", `Bearer ${nextToken}`);
      res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await parseJson<ApiFailure>(res);
      if (body?.error?.message) message = body.error.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return parseJson<T>(res);
}

export async function register(
  email: string,
  username: string,
  password: string,
): Promise<AuthResult> {
  const body = await request<ApiSuccess<AuthResult>>(
    "/api/v1/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    },
    false,
  );
  saveSession(body.data.user, body.data.tokens);
  return body.data;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const body = await request<ApiSuccess<AuthResult>>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    false,
  );
  saveSession(body.data.user, body.data.tokens);
  return body.data;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    await request("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: refreshToken ?? undefined }),
    });
  } finally {
    clearSession();
  }
}

export async function getMe(): Promise<SafeUser> {
  const body = await request<ApiSuccess<{ user: SafeUser }>>("/api/v1/auth/me");
  return body.data.user;
}

export type BoardSnapshot = WhiteBoardSnapshot & { lastSeq: number };

export async function createBoard(title?: string): Promise<BoardSnapshot> {
  return request<BoardSnapshot>("/api/v1/boards", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function getBoard(id: string): Promise<BoardSnapshot> {
  return request<BoardSnapshot>(`/api/v1/boards/${id}`);
}

export async function listBoards(): Promise<BoardListItem[]> {
  return request<BoardListItem[]>("/api/v1/boards");
}

export async function deleteBoard(id: string): Promise<void> {
  await request<void>(`/api/v1/boards/${id}`, { method: "DELETE" });
}
