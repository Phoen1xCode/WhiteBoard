import { createFileRoute } from "@tanstack/react-router";

import { Favorites } from "@/pages/dashboard/Favorites";

export const Route = createFileRoute("/_authenticated/favorites")({
  component: Favorites,
});
