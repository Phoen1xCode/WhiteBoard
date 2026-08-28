import { createFileRoute } from "@tanstack/react-router";

import { Trash } from "@/pages/dashboard/Trash";

export const Route = createFileRoute("/_authenticated/trash")({
  component: Trash,
});
