import { prisma } from "../lib/prisma";

export function findById(id: string) {
  return prisma.board.findUnique({
    where: { id },
  });
}

export function findByIdWithOwner(id: string) {
  return prisma.board.findUnique({
    where: { id },
    include: { owner: { select: { id: true, username: true } } },
  });
}

export function findByOwnerId(ownerId: number) {
  return prisma.board.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
  });
}

export function findByUserId(userId: number) {
  return prisma.board.findMany({
    where: {
      OR: [{ ownerId: userId }, { permissions: { some: { userId } } }],
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function create(data: { title: string; ownerId: number }) {
  return prisma.board.create({ data });
}

export function update(id: string, data: { title?: string }) {
  return prisma.board.update({ where: { id }, data });
}

export function remove(id: string) {
  return prisma.board.delete({ where: { id } });
}

export function touch(id: string) {
  return prisma.board.update({
    where: { id },
    data: { updatedAt: new Date() },
  });
}
