const INTERNAL_URL_BASE = "https://whiteboard.local";

export function getSafeInternalRedirect(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/")) return undefined;

  try {
    const url = new URL(value, INTERNAL_URL_BASE);
    if (url.origin !== INTERNAL_URL_BASE) return undefined;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}
