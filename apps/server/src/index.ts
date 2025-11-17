import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import http from "http";
import { Server } from "socket.io";
import { createBoardsRouter } from "./routes/boards.ts";
import { initSocket } from "./ws/socket";

const app = new Koa();
const router = createBoardsRouter();

app.use(cors());
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

const server = http.createServer(app.callback());

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

initSocket(io);

const PORT = Number(process.env.PORT ?? 3000);
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
