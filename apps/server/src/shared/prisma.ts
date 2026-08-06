import { PrismaClient } from "@generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

import type { ServerConfig } from "@/config";

export function createPrismaClient(config: ServerConfig): PrismaClient {
  const adapter = new PrismaPg({ connectionString: config.databaseUrl });
  return new PrismaClient({ adapter });
}
