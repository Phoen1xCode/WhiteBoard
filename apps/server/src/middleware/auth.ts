import { verifyAccessToken, type AccessTokenPayload } from "../lib/jwt";
import { isTokenBlacklisted } from "../services/auth.service";

export type AuthContext = AccessTokenPayload;

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}

/**
 * Extracts and verifies JWT from Authorization header.
 * Returns the token payload if valid, null otherwise.
 */
export async function authenticate(req: Request): Promise<AuthContext | null> {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    const blacklisted = await isTokenBlacklisted(payload.jti);
    if (blacklisted) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Requires authentication. Returns 401 Response if not authenticated.
 * Returns AuthContext if authenticated.
 */
export async function requireAuth(
  req: Request,
): Promise<AuthContext | Response> {
  const auth = await authenticate(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return auth;
}
