import {
  AtSign,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FolderOpen,
  GitBranch,
  Image,
  LogIn,
  MessageCircle,
  Monitor,
  Moon,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { WhiteboardShell } from "@/pages/whiteboard/WhiteboardPage";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  chevron?: boolean;
  highlighted?: boolean;
  primary?: boolean;
}

const MENU_GROUPS: (MenuItem | "divider")[] = [
  { icon: FolderOpen, label: "打开", shortcut: "⌘O" },
  { icon: Save, label: "保存到..." },
  { icon: Image, label: "导出图片...", shortcut: "⇧⌘E" },
  { icon: Users, label: "实时协作..." },
  { icon: Zap, label: "命令面板", shortcut: "⌘/", highlighted: true },
  { icon: Search, label: "在画布上查找", shortcut: "⌘F" },
  { icon: CircleHelp, label: "帮助", shortcut: "?" },
  { icon: Trash2, label: "重置画布" },
  "divider",
  { icon: Sparkles, label: "Whiteboard Pro" },
  { icon: GitBranch, label: "GitHub" },
  { icon: AtSign, label: "关注我们" },
  { icon: MessageCircle, label: "Discord 群组" },
  { icon: LogIn, label: "Sign up", primary: true },
  "divider",
  { icon: SlidersHorizontal, label: "首选项", chevron: true },
];

const THEME_OPTIONS: { icon: LucideIcon; label: string; active?: boolean }[] = [
  { icon: Sun, label: "浅色", active: true },
  { icon: Moon, label: "深色" },
  { icon: Monitor, label: "系统" },
];

const CANVAS_BG_SWATCHES = [
  "bg-[#FFFFFF]",
  "bg-[#F1F5F9]",
  "bg-[#FEF9C3]",
  "bg-[#FCE7F3]",
  "bg-[#DCFCE7]",
  "bg-[#F5F5F4]",
];

function MenuDivider() {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="h-0.5 w-full bg-border" />
    </div>
  );
}

function MenuRow({ icon: Icon, label, shortcut, chevron, highlighted, primary }: MenuItem) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between gap-2 px-2 py-1.5",
        highlighted && "bg-accent",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon
          className={cn("size-4", primary || highlighted ? "text-primary" : "text-foreground")}
        />
        <span
          className={cn(
            "text-sm",
            primary || highlighted ? "font-semibold text-primary" : "text-foreground",
          )}
        >
          {label}
        </span>
      </span>
      {shortcut && <span className="font-mono text-xs text-foreground opacity-60">{shortcut}</span>}
      {chevron && <ChevronRight className="size-4" />}
    </button>
  );
}

function MainMenu() {
  return (
    <div className="absolute left-4 top-[60px] flex w-[280px] flex-col border-2 border-border bg-popover p-1 text-popover-foreground shadow-shadow">
      {MENU_GROUPS.map((item, index) =>
        item === "divider" ? (
          <MenuDivider key={`divider-${index}`} />
        ) : (
          <MenuRow key={item.label} {...item} />
        ),
      )}
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-sm">主题</span>
        <div className="flex gap-0.5 rounded-[6px] border-2 border-border bg-muted p-0.5">
          {THEME_OPTIONS.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className={cn(
                "flex h-6 w-[26px] items-center justify-center rounded-[4px]",
                active && "bg-primary text-primary-foreground",
              )}
            >
              <Icon className="size-[14px]" />
            </button>
          ))}
        </div>
      </div>
      <div className="px-2 pb-1.5 pt-0.5">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-[6px] border-2 border-border bg-card px-2 py-1.5"
        >
          <span className="text-sm">简体中文</span>
          <ChevronDown className="size-[14px] text-muted-foreground" />
        </button>
      </div>
      <div className="px-2.5 pb-0.5 pt-1.5">
        <span className="text-xs text-muted-foreground">画布背景</span>
      </div>
      <div className="flex gap-2 px-2.5 pb-2 pt-0.5">
        {CANVAS_BG_SWATCHES.map((swatch) => (
          <div key={swatch} className={cn("size-5 rounded-[4px] border-2 border-border", swatch)} />
        ))}
      </div>
    </div>
  );
}

export function WhiteboardMenuOpen() {
  return (
    <WhiteboardShell>
      <MainMenu />
    </WhiteboardShell>
  );
}
