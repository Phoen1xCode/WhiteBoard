import { pinoLogger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";

import { config } from "@/config";

const stream = config.nodeEnv === "production" ? undefined : pretty({ colorize: true });

export const logger = pinoLogger({
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
