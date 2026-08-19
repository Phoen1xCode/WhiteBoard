import type { RouterHistory } from "@tanstack/react-router";

import { createRouter } from "@tanstack/react-router";

import type { RouterContext } from "@/router-context";

import { RoutePending } from "@/components/RouteComponents";
import { isAuthenticated } from "@/lib/auth";
import { routeTree } from "@/routeTree.gen";

interface CreateAppRouterOptions {
  history?: RouterHistory;
  auth?: RouterContext["auth"];
}

export function createAppRouter(options: CreateAppRouterOptions = {}) {
  return createRouter({
    routeTree,
    history: options.history,
    context: {
      auth: options.auth ?? { isAuthenticated },
    },
    defaultPreload: "intent",
    defaultPendingComponent: RoutePending,
    defaultPendingMs: 150,
    scrollRestoration: true,
  });
}

export const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
