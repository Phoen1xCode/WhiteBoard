import { config } from "../config";

export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": config.CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  return null;
}

export function addCorsHeaders(res: Response): Response {
  const heanders = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders())) heanders.set(k, v);
  return new Response(res.body, { ...res, headers: heanders });
}
