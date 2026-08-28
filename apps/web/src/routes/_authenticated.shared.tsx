import { createFileRoute } from "@tanstack/react-router";

import { Shared } from "@/pages/dashboard/Shared";

export const Route = createFileRoute("/_authenticated/shared")({
  component: Shared,
});
