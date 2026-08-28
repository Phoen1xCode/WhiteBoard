import { Trash2 } from "lucide-react";

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

export function Trash() {
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
    </DashboardLayout>
  );
}
