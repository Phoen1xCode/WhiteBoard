import { Plus, Trash2 } from "lucide-react";

import {
  BoardCard,
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";

const boards = [
  { title: "产品脑暴", meta: "2 小时前 · 3 位协作者", previewClass: "bg-[#FEF9C3]" },
  { title: "首页改版草图", meta: "昨天 · 2 位协作者", previewClass: "bg-[#DBEAFE]" },
  { title: "用户旅程图", meta: "3 天前 · 5 位协作者", previewClass: "bg-[#FCE7F3]" },
  { title: "读书笔记", meta: "上周", previewClass: "bg-[#DCFCE7]" },
  { title: "周报大纲", meta: "2 周前", previewClass: "bg-[#F1F5F9]" },
];

export function DeleteConfirm() {
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
        {boards.map((board) => (
          <BoardCard
            key={board.title}
            title={board.title}
            meta={board.meta}
            previewClass={board.previewClass}
          />
        ))}
        <div className="flex min-h-[195px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-border bg-muted p-4">
          <Plus className="size-7 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">新建白板</span>
        </div>
      </div>

      {/* Dimmed backdrop + Delete Dialog */}
      <div className="fixed inset-0 z-40 bg-foreground/50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="flex w-[400px] flex-col gap-3.5 rounded-lg border-2 border-border bg-card p-7 shadow-[4px_4px_0px_0px_var(--border)]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border-2 border-destructive bg-[#FDE7E7]">
              <Trash2 className="size-[18px] text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">删除白板？</h2>
          </div>
          <p className="w-full text-sm leading-normal text-muted-foreground">
            「产品脑暴」将被移入回收站，30 天内可从回收站恢复。
          </p>
          <div className="flex w-full justify-end gap-2.5 pt-1.5">
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-none border-2 border-border bg-background px-4 py-2 shadow-[2px_2px_0px_0px_var(--border)]"
            >
              <span className="text-sm font-medium text-foreground">取消</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-none border-2 border-border bg-destructive px-4 py-2 shadow-[2px_2px_0px_0px_var(--border)]"
            >
              <span className="text-sm font-medium text-destructive-foreground">移入回收站</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
