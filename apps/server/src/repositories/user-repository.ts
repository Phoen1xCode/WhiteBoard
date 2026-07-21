import type { User } from "../../prisma/generated/client";

import { prisma } from "../lib/prisma";

export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  return await prisma.user.create({
    data: input,
  });
}

export async function findUserById(id: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id },
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserByUsername(username: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { username },
  });
}
