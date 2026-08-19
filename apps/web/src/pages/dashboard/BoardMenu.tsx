import { Copy, Ellipsis, Pencil, Plus, Share2, Star, Trash2 } from "lucide-react";

import {
  BoardCard,
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { cn } from "@/lib/utils";

const boards = [
  { title: "产品脑暴", meta: "2 小时前 · 3 位协作者", previewClass: "bg-[#FEF9C3]" },
  { title: "首页改版草图", meta: "昨天 · 2 位协作者", previewClass: "bg-[#DBEAFE]" },
  { title: "用户旅程图", meta: "3 天前 · 5 位协作者", previewClass: "bg-[#FCE7F3]" },
  { title: "读书笔记", meta: "上周", previewClass: "bg-[#DCFCE7]" },
  { title: "周报大纲", meta: "2 周前", previewClass: "bg-[#F1F5F9]" },
];

const menuItems = [
  { icon: Pencil, label: "重命名", active: true },
  { icon: Copy, label: "创建副本", active: false },
  { icon: Star, label: "收藏", active: false },
  { icon: Share2, label: "分享", active: false },
];

function CardMenu() {
  return (
    <div className="absolute top-11 right-3 z-10 flex w-[180px] flex-col rounded-none border-2 border-border bg-popover p-1 shadow-[4px_4px_0px_0px_var(--border)]">
      {menuItems.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded px-2.5 py-[7px]",
            item.active && "bg-muted",
          )}
        >
          <item.icon className="size-[15px] text-foreground" />
          <span className="text-[13px] text-foreground">{item.label}</span>
        </div>
      ))}
      <div className="h-0.5 w-full bg-border" />
      <div className="flex cursor-pointer items-center gap-2 rounded px-2.5 py-[7px]">
        <Trash2 className="size-[15px] text-destructive" />
        <span className="text-[13px] text-destructive">移入回收站</span>
      </div>
    </div>
  );
}

export function BoardMenu() {
  return (
    <DashboardLayout activeNav="boards">
      <DashboardHeader
        title="我的白板"
        subtitle="共 5 个白板，最近更新按时间排序"
        action={
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-none border-2 border-border bg-primary px-4 py-2 shadow-[2px_2px_0px_0px_var(--border)]"
          >
            <Plus className="size-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">新建白板</span>
          </button>
        }
      />

      <div className="grid w-full grid-cols-3 gap-6">
        {boards.map((board, index) => (
          <div key={board.title} className="relative">
            <BoardCard
              title={board.title}
              meta={board.meta}
              previewClass={board.previewClass}
              highlighted={index === 0}
              previewOverlay={
                index === 0 ? (
                  <div className="absolute top-2.5 right-2.5 flex size-[30px] items-center justify-center rounded-md border-2 border-border bg-card shadow-[2px_2px_0px_0px_var(--border)]">
                    <Ellipsis className="size-4 text-foreground" />
                  </div>
                ) : undefined
              }
            />
            {index === 0 && <CardMenu />}
          </div>
        ))}
        <div className="flex min-h-[195px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-border bg-muted p-4">
          <Plus className="size-7 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">新建白板</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
