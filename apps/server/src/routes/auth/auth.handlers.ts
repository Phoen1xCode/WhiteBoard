import type { AppRouteHandler } from "@/lib/types";
import type { AuthService } from "@/services/auth.service";

import type { LoginRoute, LogoutRoute, MeRoute, RefreshRoute, RegisterRoute } from "./auth.routes";

export function createAuthHandlers({
  authService,
  onLogout,
}: {
  authService: AuthService;
  onLogout: (userId: string) => void;
}) {
  const register: AppRouteHandler<RegisterRoute> = async (c) => {
    return c.json(await authService.register(c.req.valid("json")), 201);
  };

  const login: AppRouteHandler<LoginRoute> = async (c) => {
    return c.json(await authService.login(c.req.valid("json")), 200);
  };

  const refresh: AppRouteHandler<RefreshRoute> = async (c) => {
    return c.json(await authService.refresh(c.req.valid("json").refreshToken), 200);
  };

  const logout: AppRouteHandler<LogoutRoute> = async (c) => {
    const user = c.get("user");
    try {
      await authService.logout(c.get("accessToken"));
    } finally {
      onLogout(user.id);
    }
    return c.json({ loggedOut: true }, 200);
  };

  const me: AppRouteHandler<MeRoute> = async (c) => {
    return c.json({ user: await authService.getMe(c.get("user").id) }, 200);
  };

  return { register, login, refresh, logout, me };
}
