import type { Server as HttpServer } from "node:http";

import { serve } from "@hono/node-server";
import { Server } from "socket.io";

import { createApp } from "@/app";
import { config } from "@/config";
import { withClientIp } from "@/lib/client-ip";
import { logger } from "@/middleware/logger";
import { registerSocketServer } from "@/socket";

const io = new Server({ cors: { origin: "*" } });
const sockets = registerSocketServer(io);
const app = createApp({ logger, onLogout: sockets.disconnectUserSockets });

const server = serve(
  {
    fetch: (request, env) => {
      return app.fetch(withClientIp(request, env.incoming.socket.remoteAddress), env);
    },
    port: config.port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

io.attach(server as HttpServer);
