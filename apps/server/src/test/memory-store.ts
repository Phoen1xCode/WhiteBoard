/**
 * In-memory stand-ins used when Postgres is unavailable.
 * Tests that need full HTTP/socket stack can swap repositories via these maps
 * only when integration env is missing - prefer real DB when DATABASE_URL points
 * at a live instance.
 */

export function hasLiveDatabase(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return Boolean(url) && !url.includes("invalid") && process.env.RUN_DB_TESTS === "1";
}
