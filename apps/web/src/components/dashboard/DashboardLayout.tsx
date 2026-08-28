import type { ReactNode } from "react";

import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Hexagon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { logout } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export type DashboardNavKey = "boards" | "shared" | "favorites" | "settings" | "trash";

type DashboardRoute = "/" | "/shared" | "/favorites" | "/settings" | "/trash";

interface NavItem {
  key: DashboardNavKey;
  label: string;
  icon: typeof LayoutDashboard;
  to: DashboardRoute;
}

const workspaceNav: NavItem[] = [
  { key: "boards", label: "我的白板", icon: LayoutDashboard, to: "/" },
  { key: "shared", label: "与我协作", icon: Users, to: "/shared" },
  { key: "favorites", label: "收藏", icon: Star, to: "/favorites" },
];

const accountNav: NavItem[] = [
  { key: "settings", label: "用户管理", icon: Settings, to: "/settings" },
  { key: "trash", label: "回收站", icon: Trash2, to: "/trash" },
];

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-base px-2 py-1.5 outline-none hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden",
        active && "bg-sidebar-accent hover:bg-sidebar-accent",
      )}
    >
      <Icon className="size-4 shrink-0 text-sidebar-foreground" />
      <span className="text-sm text-sidebar-foreground">{item.label}</span>
    </Link>
  );
}

function NavSection({
  label,
  items,
  activeNav,
}: {
  label: string;
  items: NavItem[];
  activeNav: DashboardNavKey;
}) {
  return (
    <>
      <div className="flex items-center gap-2 p-2">
        <span className="font-mono text-xs text-muted-foreground">{label}</span>
      </div>
      {items.map((item) => (
        <NavRow key={item.key} item={item} active={item.key === activeNav} />
      ))}
    </>
  );
}

export interface DashboardLayoutProps {
  activeNav: DashboardNavKey;
  userName?: string;
  userEmail?: string;
  children: ReactNode;
}

export function DashboardLayout({
  activeNav,
  userName,
  userEmail,
  children,
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const displayName = userName ?? storedUser?.username ?? "用户";
  const displayEmail = userEmail ?? storedUser?.email ?? "";
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // logout() always clears local session data, even if session revocation fails
    } finally {
      await navigate({ to: "/login", replace: true });
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-4 border-r-2 border-sidebar-border bg-sidebar p-2">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center overflow-hidden rounded-base bg-sidebar-accent">
              <Hexagon className="size-4 text-sidebar-accent-foreground" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-sm font-heading text-sidebar-foreground">Whiteboard</span>
              <span className="font-mono text-xs text-sidebar-foreground">在线写作白板</span>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <nav className="flex flex-1 flex-col gap-0.5 py-1">
          <NavSection label="工作区" items={workspaceNav} activeNav={activeNav} />
          <NavSection label="账户" items={accountNav} activeNav={activeNav} />
        </nav>

        {/* Sidebar Footer */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="打开账户菜单"
              className="flex w-full items-center justify-between rounded-base p-2 text-left outline-none hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <span className="text-sm font-heading text-foreground">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                  <span className="truncate text-sm text-sidebar-foreground">{displayName}</span>
                  <span className="truncate font-mono text-xs text-sidebar-foreground">
                    {displayEmail}
                  </span>
                </div>
              </div>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-60 bg-popover p-2 shadow-shadow"
          >
            <div role="menu" aria-label="账户菜单" className="flex flex-col gap-1">
              <Link
                to="/settings"
                role="menuitem"
                className="flex items-center gap-2 rounded-base px-2 py-2 text-sm outline-none hover:bg-muted focus-visible:bg-muted"
              >
                <Settings className="size-4" />
                用户管理
              </Link>
              <button
                type="button"
                role="menuitem"
                disabled={isLoggingOut}
                onClick={() => void handleLogout()}
                className="flex items-center gap-2 rounded-base px-2 py-2 text-left text-sm text-destructive outline-none hover:bg-muted focus-visible:bg-muted disabled:opacity-60"
              >
                {isLoggingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                退出登录
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </aside>

      <main className="flex min-h-screen flex-1 flex-col gap-6 p-8">{children}</main>
    </div>
  );
}

export interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function DashboardHeader({ title, subtitle, action }: DashboardHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-heading text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export interface BoardCardProps {
  title: string;
  meta: string;
  previewClass: string;
  highlighted?: boolean;
  previewOverlay?: ReactNode;
  onClick?: () => void;
}

export function BoardCard({
  title,
  meta,
  previewClass,
  highlighted = false,
  previewOverlay,
  onClick,
}: BoardCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex cursor-pointer flex-col overflow-hidden rounded-base border-2 border-border bg-card",
        highlighted ? "shadow-shadow" : "shadow-[2px_2px_0px_0px_var(--border)]",
      )}
    >
      <div
        className={cn("relative h-[130px] overflow-hidden border-b-2 border-border", previewClass)}
      >
        <div className="absolute top-6 left-6 size-14 -rotate-[4deg] border-2 border-border bg-secondary-background" />
        <div className="absolute top-[44px] left-[120px] h-[52px] w-20 rotate-[2deg] rounded-full border-2 border-border" />
        {previewOverlay}
      </div>
      <div className="flex flex-col gap-0.5 p-3">
        <span className="text-sm font-heading text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{meta}</span>
      </div>
    </div>
  );
}
