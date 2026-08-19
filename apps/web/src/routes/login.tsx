import { createFileRoute } from "@tanstack/react-router";

import { getSafeInternalRedirect } from "@/lib/navigation";
import { LoginPage } from "@/pages/LoginPage";

interface LoginRouteSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search): LoginRouteSearch => ({
    redirect: getSafeInternalRedirect(search.redirect),
  }),
  component: LoginPage,
});
