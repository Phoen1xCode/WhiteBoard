import { createRootRouteWithContext } from "@tanstack/react-router";

import type { RouterContext } from "@/router-context";

import { NotFoundRedirect, RootRouteLayout } from "@/components/RouteComponents";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootRouteLayout,
  notFoundComponent: NotFoundRedirect,
});
