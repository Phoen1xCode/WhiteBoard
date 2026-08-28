import { AtSign, Mail } from "lucide-react";

import { DashboardHeader, DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredUser } from "@/lib/auth";

export function UserSettings() {
  const user = getStoredUser();
  const userName = user?.username ?? "用户";
  const userEmail = user?.email ?? "";

  return (
    <DashboardLayout activeNav="settings" userName={userName} userEmail={userEmail}>
      <DashboardHeader title="用户管理" subtitle="查看你的账户信息与登录身份" />

      <section className="flex w-full max-w-[560px] flex-col gap-5 rounded-base border-2 border-border bg-card p-6 shadow-shadow">
        <div className="flex items-center gap-4 border-b-2 border-border pb-5">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-border bg-secondary">
            <span className="text-2xl font-heading text-foreground">
              {userName.slice(0, 1).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-heading text-foreground">{userName}</p>
            <p className="truncate text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-username" className="flex items-center gap-2">
            <AtSign className="size-4" />
            用户名
          </Label>
          <Input id="settings-username" value={userName} readOnly />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-email" className="flex items-center gap-2">
            <Mail className="size-4" />
            邮箱
          </Label>
          <Input id="settings-email" type="email" value={userEmail} readOnly />
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          账户菜单中的“退出登录”会撤销当前会话，并清除本机保存的登录信息。
        </p>
      </section>
    </DashboardLayout>
  );
}
