import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { UserSettings } from "@/pages/UserSettings";

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-none border-2 border-border px-4 py-2 text-sm font-medium shadow-[2px_2px_0px_0px_var(--border)]";

export function UserSettingsLogoutConfirm() {
  return (
    <div className="relative">
      <UserSettings />

      <div className="fixed inset-0 bg-black/40" aria-hidden />

      <div className="fixed inset-0 flex items-center justify-center">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          className="flex w-[400px] flex-col gap-4 rounded-lg border-2 border-border bg-card p-6 shadow-shadow"
        >
          <h2 id="logout-confirm-title" className="text-lg font-bold text-foreground">
            确认退出登录？
          </h2>
          <p className="text-[13px] leading-[1.6] text-muted-foreground">
            退出后需要重新登录，才能访问你的白板和协作内容。
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className={cn(buttonBase, "bg-background text-foreground")}>
              取消
            </button>
            <button
              type="button"
              className={cn(buttonBase, "bg-destructive text-destructive-foreground")}
            >
              <LogOut className="size-4" />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
