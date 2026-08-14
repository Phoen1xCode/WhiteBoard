import type { AppRouteHandler } from "@/lib/types";
import type { BoardsService } from "@/services/boards.service";

import type {
  CreateRoute,
  GetOneRoute,
  ListRoute,
  RemoveRoute,
  UpdateRoute,
} from "./boards.routes";

export function createBoardsHandlers(boardsService: BoardsService) {
  const list: AppRouteHandler<ListRoute> = async (c) => {
    return c.json(await boardsService.listBoards(c.get("user").id), 200);
  };

  const create: AppRouteHandler<CreateRoute> = async (c) => {
    const { title } = c.req.valid("json");
    return c.json(
      await boardsService.createBoard(title ?? "Untitled Board", c.get("user").id),
      201,
    );
  };

  const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
    return c.json(await boardsService.getBoard(c.req.valid("param").id, c.get("user").id), 200);
  };

  const update: AppRouteHandler<UpdateRoute> = async (c) => {
    return c.json(
      await boardsService.updateBoardTitle(
        c.req.valid("param").id,
        c.req.valid("json").title,
        c.get("user").id,
      ),
      200,
    );
  };

  const remove: AppRouteHandler<RemoveRoute> = async (c) => {
    await boardsService.deleteBoard(c.req.valid("param").id, c.get("user").id);
    return c.body(null, 204);
  };

  return { list, create, getOne, update, remove };
}
