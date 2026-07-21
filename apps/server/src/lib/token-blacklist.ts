import { connectRedis } from "./redis";

const blacklistKeyPrefix = "jwt:blacklist";

function getBlacklistKey(jti: string): string {
  return `${blacklistKeyPrefix}:${jti}`;
}

function getTtlSeconds(exp?: number): number {
  if (!exp) {
    return 0;
  }

  return Math.max(0, exp - Math.floor(Date.now() / 1000));
}

export async function blacklistToken(jti: string, exp?: number): Promise<void> {
  const ttlSeconds = getTtlSeconds(exp);

  if (ttlSeconds <= 0) {
    return;
  }

  const redis = await connectRedis();
  await redis.set(getBlacklistKey(jti), "1", "EX", ttlSeconds);
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const redis = await connectRedis();
  const result = await redis.exists(getBlacklistKey(jti));

  return result === 1;
}
