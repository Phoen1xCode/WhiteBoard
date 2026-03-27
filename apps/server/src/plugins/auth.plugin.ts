import { Elysia } from "elysia";
import { verifyAccessToken, type AccessTokenPayload } from "../lib/jwt";
import { isTokenBlacklisted } from "../services/auth.service";

export const authPlugin = new Elysia({ name: "auth" }).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const header = headers.get("Authorization");
      if (!header?.startsWith("Bearer ")) return status(401, "Unauthorized");

      const token = header.slice(7);
      let payload: AccessTokenPayload;
      try {
        payload = await verifyAccessToken(token);
      } catch {
        return status(401, "Unauthorized");
      }

      const blacklisted = await isTokenBlacklisted(payload.jti);
      if (blacklisted) return status(401, "Token revoked");

      return { user: payload };
    },
  },
});
