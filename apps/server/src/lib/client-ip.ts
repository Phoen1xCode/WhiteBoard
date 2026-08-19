export const CLIENT_IP_HEADER = "x-whiteboard-client-ip";

export function withClientIp(request: Request, address: string | undefined): Request {
  const headers = new Headers(request.headers);

  if (address) {
    headers.set(CLIENT_IP_HEADER, address);
  } else {
    headers.delete(CLIENT_IP_HEADER);
  }

  return new Request(request, { headers });
}
