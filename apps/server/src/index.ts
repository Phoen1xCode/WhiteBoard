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
import { errorHandler } from "./lib/error-handler";

const app = new Elysia()
  .use(lifecyclePlugin)
  .use(corsPlugin)
  .use(rateLimitPlugin)
  .use(authPlugin)
  .onError(errorHandler)
  .use(healthRoute)
  .use(authRoute)
  .use(boardRoute)
  .use(wsRoute)
  .listen(config.PORT);

console.log(`Server running on http://localhost:${app.server?.port}`);
