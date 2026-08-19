import { Plus } from "lucide-react";

import {
  BoardCard,
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";

const boards = [
  { title: "产品脑暴", meta: "2 小时前 · 3 位协作者", previewClass: "bg-[#FEF9C3]" },
  { title: "用户旅程图", meta: "3 天前 · 5 位协作者", previewClass: "bg-[#FCE7F3]" },
];

export function Favorites() {
  return (
    <DashboardLayout activeNav="favorites">
      <DashboardHeader
        title="收藏"
        subtitle="你标星的 2 个白板"
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
      </div>
    </DashboardLayout>
  );
}
