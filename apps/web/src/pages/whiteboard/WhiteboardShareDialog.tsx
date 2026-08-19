import { ChevronDown, Copy, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { WhiteboardShell } from "@/pages/whiteboard/WhiteboardPage";

const MEMBERS = [
  {
    initial: "李",
    avatarClass: "bg-[#FDA4AF]",
    name: "李雷",
    email: "li.lei@example.com",
    role: "所有者",
    roleClass: "font-semibold text-primary",
  },
  {
    initial: "韩",
    avatarClass: "bg-[#93C5FD]",
    name: "韩梅",
    email: "han.mei@example.com",
    role: "可编辑",
    roleClass: "text-muted-foreground",
  },
  {
    initial: "T",
    avatarClass: "bg-[#86EFAC]",
    name: "Tom",
    email: "tom@example.com",
    role: "可查看",
    roleClass: "text-muted-foreground",
  },
];

function ShareDialog() {
  return (
    <>
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute left-1/2 top-[219px] flex w-[440px] -translate-x-1/2 flex-col gap-4 rounded-lg border-2 border-border bg-card p-6 text-card-foreground shadow-shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">分享白板</h2>
          <button type="button" aria-label="关闭" className="flex items-center justify-center p-2">
            <X className="size-6" />
          </button>
        </div>
        <p className="text-[13px] text-muted-foreground">任何获得链接的人都可以加入实时协作</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 border-2 border-input bg-background px-3 py-2.5">
            <span className="font-mono text-[13px]">whiteboard.app/b/8xK2mP</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 border-2 border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)]"
          >
            <Copy className="size-4" />
            复制
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">链接权限</span>
          <button
            type="button"
            className="flex w-full items-center justify-between border-2 border-input bg-background px-3 py-2.5"
          >
            <span className="text-[13px]">可编辑</span>
            <ChevronDown className="size-[14px] text-muted-foreground" />
          </button>
        </div>
        <div className="h-0.5 w-full bg-border" />
        <span className="text-[13px] font-medium">协作者 · 3</span>
        {MEMBERS.map((member) => (
          <div key={member.name} className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 border-border text-sm font-semibold",
                member.avatarClass,
              )}
            >
              {member.initial}
            </div>
            <div className="flex flex-1 flex-col gap-px">
              <span className="text-[13px] font-semibold">{member.name}</span>
              <span className="text-xs text-muted-foreground">{member.email}</span>
            </div>
            <span className={cn("text-xs", member.roleClass)}>{member.role}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function WhiteboardShareDialog() {
  return (
    <WhiteboardShell>
      <ShareDialog />
    </WhiteboardShell>
  );
}
