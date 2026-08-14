import { PrismaClient } from "@generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { config } from "@/config";

const adapter = new PrismaPg({ connectionString: config.databaseUrl });

export const db = new PrismaClient({ adapter });
