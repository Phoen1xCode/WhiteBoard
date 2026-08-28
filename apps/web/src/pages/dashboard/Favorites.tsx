import { Plus } from "lucide-react";

import {
  BoardCard,
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";

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
      </div>
    </DashboardLayout>
  );
}
