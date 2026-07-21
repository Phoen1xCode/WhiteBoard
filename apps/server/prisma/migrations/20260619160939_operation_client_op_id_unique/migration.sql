-- CreateUniqueIndex
CREATE UNIQUE INDEX "Operation_boardId_clientOpId_key" ON "Operation"("boardId", "clientOpId");
