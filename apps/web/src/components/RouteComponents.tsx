import { Navigate, Outlet } from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";

export function RootRouteLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}

export function NotFoundRedirect() {
  return <Navigate to="/" replace />;
}

export function RoutePending() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      页面加载中...
    </div>
  );
}
