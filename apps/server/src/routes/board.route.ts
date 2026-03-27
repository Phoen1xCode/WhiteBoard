import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import {
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
} from "../services/board.service";

export const boardRoute = new Elysia({ prefix: "/api/v1/boards" })
  .use(authPlugin)
  .get("/", ({ user }) => listBoards(user.userId), { auth: true })
  .post(
    "/",
    ({ body, user, set }) => {
      set.status = 201;
      return createBoard(body.title ?? "Untitled Board", user.userId);
    },
    {
      auth: true,
      body: t.Object({ title: t.Optional(t.String()) }),
    },
  )
  .get("/:id", ({ params }) => getBoard(params.id), { auth: true })
  .patch(
    "/:id",
    ({ params, body }) => updateBoard(params.id, body),
    {
      auth: true,
      body: t.Object({ title: t.Optional(t.String()) }),
    },
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      await deleteBoard(params.id);
      set.status = 204;
    },
    { auth: true },
  );
