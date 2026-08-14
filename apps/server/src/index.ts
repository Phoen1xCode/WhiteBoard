import type { Server as HttpServer } from "node:http";

import { serve } from "@hono/node-server";
import { Server } from "socket.io";

import { createApp } from "@/app";
import { config } from "@/config";
import { logger } from "@/middleware/logger";
import { registerSocketServer } from "@/socket";

const io = new Server({ cors: { origin: "*" } });
const sockets = registerSocketServer(io);
const app = createApp({ logger, onLogout: sockets.disconnectUserSockets });

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});

io.attach(server as HttpServer);
