import { Plus, Trash2 } from "lucide-react";

import {
  BoardCard,
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";

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
          <Button type="button">
            <Plus />
            新建白板
          </Button>
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
        <div className="flex min-h-[195px] flex-col items-center justify-center gap-2 rounded-base border-2 border-border bg-muted p-4">
          <Plus className="size-7 text-muted-foreground" />
          <span className="text-sm font-base text-muted-foreground">新建白板</span>
        </div>
      </div>

      {/* Dimmed backdrop + Delete Dialog */}
      <div className="fixed inset-0 z-40 bg-overlay" />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="flex w-[400px] flex-col gap-3.5 rounded-base border-2 border-border bg-card p-7 shadow-shadow">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-base border-2 border-destructive bg-destructive/10">
              <Trash2 className="size-[18px] text-destructive" />
            </div>
            <h2 className="text-xl font-heading text-foreground">删除白板？</h2>
          </div>
          <p className="w-full text-sm leading-normal text-muted-foreground">
            「产品脑暴」将被移入回收站，30 天内可从回收站恢复。
          </p>
          <div className="flex w-full justify-end gap-2.5 pt-1.5">
            <Button type="button" variant="outline">
              取消
            </Button>
            <Button type="button" variant="destructive">
              移入回收站
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
