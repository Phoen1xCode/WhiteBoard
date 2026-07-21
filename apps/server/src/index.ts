import http from "http";
import { Server } from "socket.io";

import { createApp } from "./app";
import { initSocket } from "./sockets/socket";

const app = createApp();
const server = http.createServer(app.callback());

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

initSocket(io);

const PORT = Number(process.env.PORT ?? 4000);
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
