import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../prisma/generated/client";

import "dotenv/config";

let prismaClient: PrismaClient | null = null;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    if (!prismaClient) {
      prismaClient = createPrismaClient();
    }

    const value = Reflect.get(prismaClient as object, property, receiver);
    return typeof value === "function" ? value.bind(prismaClient) : value;
  },
});
