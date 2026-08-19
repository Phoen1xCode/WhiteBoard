import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Minus,
  PenLine,
  Square,
  Squircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { WhiteboardShell } from "@/pages/whiteboard/WhiteboardPage";

const STROKE_COLORS = [
  { swatch: "bg-foreground", selected: true },
  { swatch: "bg-[#E45757]" },
  { swatch: "bg-[#4ADE80]" },
  { swatch: "bg-[#3B82F6]" },
  { swatch: "bg-[#FB923C]" },
];

const FILL_COLORS = [
  { swatch: "bg-transparent", selected: true },
  { swatch: "bg-[#FECDD3]" },
  { swatch: "bg-[#BBF7D0]" },
  { swatch: "bg-[#BFDBFE]" },
  { swatch: "bg-[#FEF08A]" },
];

const STROKE_WIDTHS = [{ line: "h-0.5" }, { line: "h-[3px]", selected: true }, { line: "h-[5px]" }];

const SLOPPINESS_OPTIONS: { icon: LucideIcon; label: string; selected?: boolean }[] = [
  { icon: PenLine, label: "手绘", selected: true },
  { icon: Minus, label: "规整" },
];

const EDGE_OPTIONS: { icon: LucideIcon; label: string; selected?: boolean }[] = [
  { icon: Square, label: "直角" },
  { icon: Squircle, label: "圆角", selected: true },
];

const LAYER_OPTIONS: { icon: LucideIcon; label: string }[] = [
  { icon: ArrowDownToLine, label: "置于底层" },
  { icon: ArrowDown, label: "下移一层" },
  { icon: ArrowUp, label: "上移一层" },
  { icon: ArrowUpToLine, label: "置于顶层" },
];

const HANDLE_POSITIONS = [
  "-left-1.5 -top-1.5",
  "-right-1.5 -top-1.5",
  "-bottom-1.5 -left-1.5",
  "-bottom-1.5 -right-1.5",
];

function SelectionBox() {
  return (
    <div className="absolute left-[490px] top-[280px] h-[200px] w-[320px] border-2 border-ring">
      {HANDLE_POSITIONS.map((position) => (
        <div
          key={position}
          className={cn("absolute size-3 border-2 border-border bg-white", position)}
        />
      ))}
    </div>
  );
}

function PanelLabel({ children }: { children: string }) {
  return <span className="text-[13px] font-semibold">{children}</span>;
}

function Swatch({ swatch, selected }: { swatch: string; selected?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "size-6 rounded-[4px] border-2",
        swatch,
        selected ? "border-ring shadow-[2px_2px_0px_0px_var(--border)]" : "border-border",
      )}
    />
  );
}

function OptionBox({
  selected,
  className,
  children,
}: {
  selected?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-8 w-[52px] items-center justify-center rounded-[6px] border-2 border-border",
        selected ? "bg-secondary" : "bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}

function PropertiesPanel() {
  return (
    <div className="absolute left-4 top-[60px] flex w-[200px] flex-col gap-3.5 rounded-lg border-2 border-border bg-popover p-4 text-popover-foreground shadow-shadow">
      <PanelLabel>描边</PanelLabel>
      <div className="flex gap-2">
        {STROKE_COLORS.map((color) => (
          <Swatch key={color.swatch} {...color} />
        ))}
      </div>
      <PanelLabel>背景</PanelLabel>
      <div className="flex gap-2">
        {FILL_COLORS.map((color) => (
          <Swatch key={color.swatch} {...color} />
        ))}
      </div>
      <PanelLabel>描边宽度</PanelLabel>
      <div className="flex gap-2">
        {STROKE_WIDTHS.map((width) => (
          <OptionBox key={width.line} selected={width.selected}>
            <div className={cn("w-5 bg-foreground", width.line)} />
          </OptionBox>
        ))}
      </div>
      <PanelLabel>边框样式</PanelLabel>
      <div className="flex gap-2">
        <OptionBox selected>
          <div className="h-0.5 w-5 bg-foreground" />
        </OptionBox>
        <OptionBox className="gap-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-0.5 w-1.5 bg-foreground" />
          ))}
        </OptionBox>
        <OptionBox className="gap-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="size-[3px] rounded-full bg-foreground" />
          ))}
        </OptionBox>
      </div>
      <PanelLabel>线条风格</PanelLabel>
      <div className="flex gap-2">
        {SLOPPINESS_OPTIONS.map(({ icon: Icon, label, selected }) => (
          <OptionBox key={label} selected={selected}>
            <Icon className="size-4" />
          </OptionBox>
        ))}
      </div>
      <PanelLabel>边角</PanelLabel>
      <div className="flex gap-2">
        {EDGE_OPTIONS.map(({ icon: Icon, label, selected }) => (
          <OptionBox key={label} selected={selected}>
            <Icon className="size-4" />
          </OptionBox>
        ))}
      </div>
      <PanelLabel>透明度</PanelLabel>
      <div className="flex flex-col gap-1">
        <div className="relative h-4 w-full">
          <div className="absolute left-0 top-[6px] h-1 w-full rounded-[2px] border border-border bg-muted" />
          <div className="absolute left-[110px] top-0 size-4 rounded-full border-2 border-border bg-foreground" />
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-[11px] text-muted-foreground">0</span>
          <span className="font-mono text-[11px] text-muted-foreground">100</span>
        </div>
      </div>
      <PanelLabel>图层</PanelLabel>
      <div className="flex gap-1.5">
        {LAYER_OPTIONS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            className="flex h-8 w-[38px] items-center justify-center rounded-[6px] border-2 border-border bg-muted"
          >
            <Icon className="size-[15px]" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function WhiteboardPropertiesPanel() {
  return (
    <WhiteboardShell>
      <SelectionBox />
      <PropertiesPanel />
    </WhiteboardShell>
  );
}
