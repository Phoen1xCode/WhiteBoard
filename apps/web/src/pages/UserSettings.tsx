import {
  Check,
  ChevronDown,
  Hexagon,
  LayoutDashboard,
  Plus,
  Settings,
  Star,
  Trash2,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-none border-2 border-border px-4 py-2 text-sm font-medium shadow-[2px_2px_0px_0px_var(--border)]";

interface NavItem {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

const workspaceNav: NavItem[] = [
  { icon: LayoutDashboard, label: "我的白板" },
  { icon: Users, label: "与我协作" },
  { icon: Star, label: "收藏" },
];

const accountNav: NavItem[] = [
  { icon: Settings, label: "用户管理", active: true },
  { icon: Trash2, label: "回收站" },
];

function SidebarSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <>
      <div className="flex items-center px-2 py-2">
        <span className="flex-1 font-mono text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={cn(
            "flex w-full items-center gap-2 px-2 py-1.5 text-left",
            item.active && "bg-sidebar-accent",
          )}
        >
          <item.icon className="size-4 text-sidebar-foreground" />
          <span className="text-sm text-sidebar-foreground">{item.label}</span>
        </button>
      ))}
    </>
  );
}

function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-4 border-r-2 border-sidebar-border bg-sidebar p-2">
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

      <nav className="flex flex-1 flex-col gap-0.5 py-1">
        <SidebarSection title="工作区" items={workspaceNav} />
        <SidebarSection title="账户" items={accountNav} />
      </nav>

      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-full bg-muted" />
          <div className="flex flex-col justify-center">
            <span className="text-sm font-medium text-sidebar-foreground">李雷</span>
            <span className="font-mono text-xs text-sidebar-foreground">li.lei@example.com</span>
          </div>
        </div>
        <ChevronDown className="size-4 text-muted-foreground" />
      </div>
    </aside>
  );
}

export function UserSettings() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />

      <main className="flex flex-1 flex-col gap-6 p-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold">用户管理</h1>
          <p className="text-sm text-muted-foreground">管理你的账户信息与登录状态</p>
        </header>

        <section className="flex w-[560px] flex-col gap-5 rounded-lg border-2 border-border bg-card p-6 shadow-shadow">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full border-2 border-border bg-[#FDA4AF]">
              <span className="text-2xl font-semibold text-foreground">李</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <button type="button" className={cn(buttonBase, "bg-background text-foreground")}>
                <Upload className="size-4" />
                更换头像
              </button>
              <span className="text-xs text-muted-foreground">支持 PNG / JPG，最大 2MB</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-username" className="font-medium text-foreground">
              用户名
            </Label>
            <Input
              id="settings-username"
              defaultValue="李雷"
              className="rounded-none border-input bg-background px-3 py-2.5 font-normal"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-email" className="font-medium text-foreground">
              邮箱
            </Label>
            <Input
              id="settings-email"
              defaultValue="li.lei@example.com"
              className="rounded-none border-input bg-background px-3 py-2.5 font-normal"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              className={cn(buttonBase, "bg-destructive text-destructive-foreground")}
            >
              <Plus className="size-4" />
              退出登录
            </button>
            <button type="button" className={cn(buttonBase, "bg-primary text-primary-foreground")}>
              <Check className="size-4" />
              保存修改
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
