import { Trash2, TriangleAlert } from "lucide-react";

import {
  BoardCard,
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";

const boards = [
  { title: "旧版 Logo 草图", meta: "3 天前删除", previewClass: "bg-[#FEF9C3]" },
  { title: "废弃的会议记录", meta: "1 周前删除", previewClass: "bg-[#DBEAFE]" },
];

export function TrashEmptyConfirm() {
  return (
    <DashboardLayout activeNav="trash">
      <DashboardHeader
        title="回收站"
        subtitle="删除的白板会保留 30 天，到期后自动清除"
        action={
          <Button type="button" variant="destructive">
            <Trash2 />
            清空回收站
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
      </div>

      {/* Dimmed backdrop + Empty Trash Dialog */}
      <div className="fixed inset-0 z-40 bg-overlay" />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="flex w-[400px] flex-col gap-3.5 rounded-base border-2 border-border bg-card p-7 shadow-shadow">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-base border-2 border-destructive bg-destructive/10">
              <TriangleAlert className="size-[18px] text-destructive" />
            </div>
            <h2 className="text-xl font-heading text-foreground">清空回收站？</h2>
          </div>
          <p className="w-full text-sm leading-normal text-muted-foreground">
            回收站中的所有白板将被永久删除，此操作无法撤销。
          </p>
          <div className="flex w-full justify-end gap-2.5 pt-1.5">
            <Button type="button" variant="outline">
              取消
            </Button>
            <Button type="button" variant="destructive">
              永久删除
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
