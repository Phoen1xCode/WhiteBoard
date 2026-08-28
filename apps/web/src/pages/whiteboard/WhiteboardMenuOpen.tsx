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

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
      <Separator />
    </div>
  );
}

function MenuRow({ icon: Icon, label, shortcut, chevron, highlighted, primary }: MenuItem) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn("h-auto w-full justify-between gap-2 px-2 py-1.5", highlighted && "bg-accent")}
    >
      <span className="flex items-center gap-2">
        <Icon className={cn(primary || highlighted ? "text-primary" : "text-foreground")} />
        <span
          className={cn(
            "text-sm",
            primary || highlighted ? "font-heading text-primary" : "text-foreground",
          )}
        >
          {label}
        </span>
      </span>
      {shortcut && <span className="font-mono text-xs text-foreground opacity-60">{shortcut}</span>}
      {chevron && <ChevronRight />}
    </Button>
  );
}

function MainMenu() {
  return (
    <div className="absolute top-[60px] left-4 flex w-[280px] flex-col rounded-base border-2 border-border bg-popover p-1 text-popover-foreground shadow-shadow">
      {MENU_GROUPS.map((item, index) =>
        item === "divider" ? (
          <MenuDivider key={`divider-${index}`} />
        ) : (
          <MenuRow key={item.label} {...item} />
        ),
      )}
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-sm">主题</span>
        <div className="flex gap-0.5 rounded-base border-2 border-border bg-muted p-0.5">
          {THEME_OPTIONS.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className={cn(
                "flex h-6 w-[26px] items-center justify-center rounded-base focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden",
                active && "bg-primary text-primary-foreground",
              )}
            >
              <Icon className="size-[14px]" />
            </button>
          ))}
        </div>
      </div>
      <div className="px-2 pt-0.5 pb-1.5">
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full justify-between px-2 py-1.5"
        >
          <span className="text-sm">简体中文</span>
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </div>
      <div className="px-2.5 pt-1.5 pb-0.5">
        <span className="text-xs text-muted-foreground">画布背景</span>
      </div>
      <div className="flex gap-2 px-2.5 pt-0.5 pb-2">
        {CANVAS_BG_SWATCHES.map((swatch) => (
          <div key={swatch} className={cn("size-5 rounded-base border-2 border-border", swatch)} />
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
