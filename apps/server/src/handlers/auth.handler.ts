import { register, login, refreshTokens, logout, getMe, AuthError } from "../services/auth.service";
import { requireAuth } from "../middleware/auth";
import { jsonOk, jsonCreated, jsonError } from "../lib/response";

/**
 * Handles auth routes. Returns null if the route doesn't match.
 */
export async function handleAuthRoute(req: Request, pathname: string): Promise<Response | null> {
  // POST /api/v1/auth/register
  if (req.method === "POST" && pathname === "/api/v1/auth/register") {
    return handleRegister(req);
  }

  // POST /api/v1/auth/login
  if (req.method === "POST" && pathname === "/api/v1/auth/login") {
    return handleLogin(req);
  }

  // POST /api/v1/auth/refresh
  if (req.method === "POST" && pathname === "/api/v1/auth/refresh") {
    return handleRefresh(req);
  }

  // POST /api/v1/auth/logout (requires auth)
  if (req.method === "POST" && pathname === "/api/v1/auth/logout") {
    return handleLogout(req);
  }

  // GET /api/v1/auth/me (requires auth)
  if (req.method === "GET" && pathname === "/api/v1/auth/me") {
    return handleMe(req);
  }

  return null;
}

async function handleRegister(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { email, username, password } = body;

    if (!email || !username || !password) {
      return jsonError(400, "email, username, and password are required");
    }

    const result = await register(email, username, password);
    return jsonCreated(result);
  } catch (err) {
    if (err instanceof AuthError) return jsonError(err.status, err.message);
    throw err;
  }
}

async function handleLogin(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonError(400, "email and password are required");
    }

    const result = await login(email, password);
    return jsonOk(result);
  } catch (err) {
    if (err instanceof AuthError) return jsonError(err.status, err.message);
    throw err;
  }
}

async function handleRefresh(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return jsonError(400, "refreshToken is required");
    }

    const result = await refreshTokens(refreshToken);
    return jsonOk(result);
  } catch (err) {
    if (err instanceof AuthError) return jsonError(err.status, err.message);
    return jsonError(401, "Invalid refresh token");
  }
}

async function handleLogout(req: Request): Promise<Response> {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  await logout(auth.jti);
  return jsonOk({ message: "Logged out" });
}

async function handleMe(req: Request): Promise<Response> {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  try {
    const user = await getMe(auth.userId);
    return jsonOk(user);
  } catch (err) {
    if (err instanceof AuthError) return jsonError(err.status, err.message);
    throw err;
  }
}
