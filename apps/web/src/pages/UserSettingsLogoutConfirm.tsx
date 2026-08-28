import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserSettings } from "@/pages/UserSettings";

export function UserSettingsLogoutConfirm() {
  return (
    <div className="relative">
      <UserSettings />

      <div className="fixed inset-0 bg-overlay" aria-hidden />

      <div className="fixed inset-0 flex items-center justify-center">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          className="flex w-[400px] flex-col gap-4 rounded-base border-2 border-border bg-card p-6 shadow-shadow"
        >
          <h2 id="logout-confirm-title" className="text-lg font-heading text-foreground">
            确认退出登录？
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            退出后需要重新登录，才能访问你的白板和协作内容。
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline">
              取消
            </Button>
            <Button type="button" variant="destructive">
              <LogOut />
              退出登录
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
