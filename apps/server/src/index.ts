import type { Server as HttpServer } from "node:http";

import { serve } from "@hono/node-server";
import { Server } from "socket.io";

import { createApp } from "@/app";
import { initSocket } from "@/sockets/socket";

const app = createApp();
const PORT = Number(process.env.PORT ?? 4000);

const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});

const io = new Server(server as HttpServer, {
  cors: {
    origin: "*",
  },
});

initSocket(io);
