import { Elysia } from "elysia";
import { config } from "./config";
import { lifecyclePlugin } from "./plugins/lifecycle.plugin";
import { corsPlugin } from "./plugins/cors.plugin";
import { rateLimitPlugin } from "./plugins/rate-limit.plugin";
import { authPlugin } from "./plugins/auth.plugin";
import { healthRoute } from "./routes/health.route";
import { authRoute } from "./routes/auth.route";
import { boardRoute } from "./routes/board.route";
import { wsRoute } from "./routes/ws.route";
import { AuthError } from "./services/auth.service";
import { BoardError } from "./services/board.service";

const app = new Elysia()
  .use(lifecyclePlugin)
  .use(corsPlugin)
  .use(rateLimitPlugin)
  .use(authPlugin)
  .onError(({ code, error, set }) => {
    if (error instanceof AuthError) {
      set.status = error.status;
      return { error: error.message };
    }
    if (error instanceof BoardError) {
      set.status = error.status;
      return { error: error.message };
    }
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: String(error) };
    }
    set.status = 500;
    console.error("Unhandled error:", error);
    return { error: "Internal Server Error" };
  })
  .use(healthRoute)
  .use(authRoute)
  .use(boardRoute)
  .use(wsRoute)
  .listen(config.PORT);

console.log(`Server running on http://localhost:${app.server?.port}`);
