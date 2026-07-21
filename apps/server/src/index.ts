import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import http from "http";
import { Server } from "socket.io";
import { createBoardsRouter } from "./routes/boards.ts";
import { createAuthRouter } from "./routes/auth";
import { errorMiddleware } from "./middleware/error";
import { initSocket } from "./sockets/socket";

const app = new Koa();
const authRouter = createAuthRouter();
const router = createBoardsRouter();

app.use(errorMiddleware);
app.use(cors());
app.use(bodyParser());
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());
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
