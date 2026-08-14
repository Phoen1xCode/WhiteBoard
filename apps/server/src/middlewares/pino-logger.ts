import { pinoLogger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";

import type { ServerConfig } from "@/config";

export function createPinoLogger(config: Pick<ServerConfig, "logLevel" | "nodeEnv">) {
  const stream = config.nodeEnv === "production" ? undefined : pretty({ colorize: true });

  return pinoLogger({
    pino: pino({ level: config.logLevel }, stream),
    http: {
      onReqBindings: (c) => ({
        req: {
          method: c.req.method,
          url: c.req.path,
        },
      }),
      onResBindings: (c) => ({
        res: { status: c.res.status },
      }),
    },
  });
}
