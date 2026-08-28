import { Plus } from "lucide-react";

import {
  BoardCard,
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";

const boards = [
  { title: "营销方案脑暴", meta: "来自 韩梅 · 昨天更新", previewClass: "bg-[#FEF9C3]" },
  { title: "设计评审记录", meta: "来自 Tom · 2 天前更新", previewClass: "bg-[#DBEAFE]" },
  { title: "Q3 Roadmap 讨论", meta: "来自 韩梅 · 上周更新", previewClass: "bg-[#FCE7F3]" },
];

export function Shared() {
  return (
    <DashboardLayout activeNav="shared">
      <DashboardHeader
        title="与我协作"
        subtitle="团队成员分享给你的 3 个白板"
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
