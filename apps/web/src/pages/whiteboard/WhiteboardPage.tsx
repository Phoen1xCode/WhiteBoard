import type { ReactNode } from "react";

import {
  ArrowRight,
  Circle,
  CircleHelp,
  Eraser,
  Hand,
  Image,
  Menu,
  Minus,
  MousePointer2,
  Pencil,
  Plus,
  Share2,
  Square,
  Type,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusNotification } from "@/pages/whiteboard/StatusNotification";

const TOOLS: { icon: LucideIcon; label: string; active?: boolean }[] = [
  { icon: MousePointer2, label: "选择", active: true },
  { icon: Hand, label: "抓手" },
  { icon: Square, label: "矩形" },
  { icon: Circle, label: "圆形" },
  { icon: ArrowRight, label: "箭头" },
  { icon: Minus, label: "线条" },
  { icon: Pencil, label: "画笔" },
  { icon: Type, label: "文本" },
  { icon: Image, label: "图片" },
  { icon: Eraser, label: "橡皮擦" },
];

const AVATARS = [
  { initial: "李", className: "bg-[#FDA4AF]" },
  { initial: "韩", className: "bg-[#93C5FD]" },
  { initial: "T", className: "bg-[#86EFAC]" },
];

function MenuButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="absolute top-4 left-4 size-9"
      aria-label="菜单"
    >
      <Menu />
    </Button>
  );
}

function Logo() {
  return <span className="absolute top-[26px] left-[68px] text-lg font-heading">Whiteboard</span>;
}

function Toolbar() {
  return (
    <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-base border-2 border-border bg-card p-1.5 text-card-foreground shadow-shadow">
      {TOOLS.map(({ icon: Icon, label, active }) => (
        <Button
          key={label}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          className={cn(
            active &&
              "border-border bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground",
          )}
        >
          <Icon />
        </Button>
      ))}
    </div>
  );
}

function TopRight() {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-3">
      {AVATARS.map((avatar) => (
        <div
          key={avatar.initial}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border-2 border-border text-sm font-heading",
            avatar.className,
          )}
        >
          {avatar.initial}
        </div>
      ))}
      <Button type="button" className="gap-1.5 px-4">
        <Share2 />
        分享
      </Button>
    </div>
  );
}

function ZoomControls() {
  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-base border-2 border-border bg-card px-2 py-1 text-card-foreground shadow-shadow">
      <Button type="button" variant="ghost" size="icon" aria-label="缩小">
        <Minus />
      </Button>
      <span className="font-mono text-sm">100%</span>
      <Button type="button" variant="ghost" size="icon" aria-label="放大">
        <Plus />
      </Button>
    </div>
  );
}

function HelpButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="absolute right-4 bottom-4 size-9"
      aria-label="帮助"
    >
      <CircleHelp />
    </Button>
  );
}

function CanvasContent() {
  return (
    <>
      <p className="absolute top-[180px] left-[200px] text-xl font-heading">
        周五产品脑暴 · 首页改版方向
      </p>
      <div className="absolute top-[250px] left-[200px] size-[180px] rotate-[-4deg] border-2 border-border bg-[#FEF08A] p-[14px] shadow-[2px_2px_0px_0px_var(--border)]">
        <p className="text-sm leading-6 font-base">💡 脑暴：Hero 区先做 3 个方向</p>
      </div>
      <div className="absolute top-[290px] left-[500px] flex h-[180px] w-[300px] rotate-[1deg] items-center justify-center rounded-base border-2 border-foreground">
        <p className="text-base font-base">新版首页结构草图</p>
      </div>
      <div className="absolute top-[280px] left-[930px] h-[150px] w-[210px] rotate-[-2deg] rounded-full border-2 border-foreground" />
      <p className="absolute top-[450px] left-[985px] text-sm font-base text-muted-foreground">
        核心指标
      </p>
    </>
  );
}

export function WhiteboardShell({ children }: { children?: ReactNode }) {
  return (
    <div className="relative h-screen min-h-screen w-full overflow-hidden bg-background text-foreground">
      <CanvasContent />
      <MenuButton />
      <Logo />
      <Toolbar />
      <TopRight />
      <ZoomControls />
      <HelpButton />
      <StatusNotification status="online" className="absolute right-4 bottom-[65px]" />
      {children}
    </div>
  );
}

export function WhiteboardPage() {
  return <WhiteboardShell />;
}
