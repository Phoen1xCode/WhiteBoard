import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { config } from "../config";

export const corsPlugin = new Elysia({ name: "cors" }).use(
  cors({
    origin: config.CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    // credentials intentionally omitted: CORS_ORIGIN defaults to "*"
    // and browsers reject credentials:true + wildcard origin.
  }),
);
