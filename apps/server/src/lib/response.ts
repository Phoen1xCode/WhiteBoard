const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

export function jsonOk(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: JSON_HEADERS,
  });
}

export function jsonCreated(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 201,
    headers: JSON_HEADERS,
  });
}

export function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: status,
    headers: JSON_HEADERS,
  });
}

export function jsonNoContent(): Response {
  return new Response(null, {
    status: 204,
  });
}
