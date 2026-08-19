import type { ReactNode } from "react";

import { ChevronDown, Hexagon, LayoutDashboard, Settings, Star, Trash2, Users } from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardNavKey = "boards" | "shared" | "favorites" | "settings" | "trash";

interface NavItem {
  key: DashboardNavKey;
  label: string;
  icon: typeof LayoutDashboard;
}

const workspaceNav: NavItem[] = [
  { key: "boards", label: "我的白板", icon: LayoutDashboard },
  { key: "shared", label: "与我协作", icon: Users },
  { key: "favorites", label: "收藏", icon: Star },
];

const accountNav: NavItem[] = [
  { key: "settings", label: "用户管理", icon: Settings },
  { key: "trash", label: "回收站", icon: Trash2 },
];

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <div
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-none px-2 py-1.5",
        active && "bg-sidebar-accent",
      )}
    >
      <Icon className="size-4 shrink-0 text-sidebar-foreground" />
      <span className="text-sm text-sidebar-foreground">{item.label}</span>
    </div>
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
        <span className="font-mono text-xs font-medium text-muted-foreground">{label}</span>
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
  onLogout?: () => void;
  children: ReactNode;
}

export function DashboardLayout({
  activeNav,
  userName = "李雷",
  userEmail = "li.lei@example.com",
  onLogout,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-4 border-r-2 border-sidebar-border bg-sidebar p-2">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center overflow-hidden bg-sidebar-accent">
              <Hexagon className="size-4 text-sidebar-accent-foreground" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-sm font-medium text-sidebar-foreground">Whiteboard</span>
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
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-between p-2 text-left"
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <span className="text-sm font-semibold text-foreground">
                {userName.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="flex min-w-0 flex-col justify-center">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </span>
              <span className="truncate font-mono text-xs text-sidebar-foreground">
                {userEmail}
              </span>
            </div>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
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
        <h1 className="text-[28px] font-bold text-foreground">{title}</h1>
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
        "flex cursor-pointer flex-col overflow-hidden rounded-lg border-2 border-border bg-card",
        highlighted
          ? "shadow-[6px_6px_0px_0px_var(--border)]"
          : "shadow-[2px_2px_0px_0px_var(--border)]",
      )}
    >
      <div
        className={cn("relative h-[130px] overflow-hidden border-b-2 border-border", previewClass)}
      >
        <div className="absolute top-6 left-6 size-14 -rotate-[4deg] border-2 border-border bg-white" />
        <div className="absolute top-[44px] left-[120px] h-[52px] w-20 rotate-[2deg] rounded-full border-2 border-foreground" />
        {previewOverlay}
      </div>
      <div className="flex flex-col gap-0.5 p-3">
        <span className="text-[15px] font-semibold text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{meta}</span>
      </div>
    </div>
  );
}
