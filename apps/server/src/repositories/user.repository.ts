import { prisma } from "../lib/prisma";

export function findByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export function findByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export function findById(id: number) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export function create(data: {
  email: string;
  username: string;
  password: string;
}) {
  return prisma.user.create({
    data,
  });
}
