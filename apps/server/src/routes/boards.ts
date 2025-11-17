import Router from "@koa/router";
import * as boardsController from "../controllers/boardsController";

export function createBoardsRouter(): Router {
  const router = new Router();
  router.post("/api/v1/boards", boardsController.createBoard);
  router.get("/api/v1/boards/:id", boardsController.getBoard);
  return router;
}
