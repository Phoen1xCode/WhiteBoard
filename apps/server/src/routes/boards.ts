import Router from "@koa/router";
import * as boardsController from "../controllers/boardsController";

export function createBoardsRouter(): Router {
  const router = new Router();
  router.get("/api/v1/boards", boardsController.listBoards);
  router.post("/api/v1/boards", boardsController.createBoard);
  router.get("/api/v1/boards/:id", boardsController.getBoard);
  router.delete("/api/v1/boards/:id", boardsController.deleteBoard);
  return router;
}
