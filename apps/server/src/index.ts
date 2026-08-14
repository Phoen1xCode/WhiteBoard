import type { Server as HttpServer } from "node:http";

import { serve } from "@hono/node-server";
import { Server } from "socket.io";

import { bootstrap } from "@/bootstrap";
import { loadConfig } from "@/config";

const config = loadConfig();
const { app, attachSocketServer } = bootstrap(config);

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});

const io = new Server(server as HttpServer, {
  cors: { origin: "*" },
});

attachSocketServer(io);
