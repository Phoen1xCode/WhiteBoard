import { ChevronDown, Copy, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { WhiteboardShell } from "@/pages/whiteboard/WhiteboardPage";

const MEMBERS = [
  {
    initial: "李",
    avatarClass: "bg-[#FDA4AF]",
    name: "李雷",
    email: "li.lei@example.com",
    role: "所有者",
    roleClass: "font-heading text-primary",
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
      <div className="absolute inset-0 bg-overlay" />
      <div className="absolute top-[219px] left-1/2 flex w-[440px] -translate-x-1/2 flex-col gap-4 rounded-base border-2 border-border bg-background p-6 text-foreground shadow-shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading">分享白板</h2>
          <Button type="button" variant="ghost" size="icon" aria-label="关闭">
            <X />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">任何获得链接的人都可以加入实时协作</p>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-base border-2 border-border bg-secondary-background px-3 py-2">
            <span className="font-mono text-sm">whiteboard.app/b/8xK2mP</span>
          </div>
          <Button type="button">
            <Copy />
            复制
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>链接权限</Label>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm font-base focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden"
          >
            <span>可编辑</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        </div>
        <Separator />
        <Label>协作者 · 3</Label>
        {MEMBERS.map((member) => (
          <div key={member.name} className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 border-border text-sm font-heading",
                member.avatarClass,
              )}
            >
              {member.initial}
            </div>
            <div className="flex flex-1 flex-col gap-px">
              <span className="text-sm font-heading">{member.name}</span>
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
