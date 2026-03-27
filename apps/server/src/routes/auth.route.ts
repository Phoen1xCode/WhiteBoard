import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import {
  register,
  login,
  refreshTokens,
  logout,
  getMe,
} from "../services/auth.service";

export const authRoute = new Elysia({ prefix: "/api/v1/auth" })
  .use(authPlugin)
  .post(
    "/register",
    ({ body, set }) => {
      set.status = 201;
      return register(body.email, body.username, body.password);
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        username: t.String({ minLength: 1 }),
        password: t.String({ minLength: 8 }),
      }),
    },
  )
  .post(
    "/login",
    ({ body }) => login(body.email, body.password),
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    },
  )
  .post(
    "/refresh",
    ({ body }) => refreshTokens(body.refreshToken),
    {
      body: t.Object({ refreshToken: t.String() }),
    },
  )
  .post("/logout", ({ user }) => logout(user.jti), { auth: true })
  .get("/me", ({ user }) => getMe(user.userId), { auth: true });
