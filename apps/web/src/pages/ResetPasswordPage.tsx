import { Link } from "@tanstack/react-router";
import { PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-[28px] bg-background p-4">
      <div className="flex items-center gap-[10px]">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-base border-2 border-border bg-primary">
          <PenLine className="h-[18px] w-[18px] text-primary-foreground" />
        </div>
        <span className="text-xl font-heading text-foreground">Whiteboard</span>
      </div>

      <div className="flex w-full max-w-[400px] flex-col gap-[16px] rounded-base border-2 border-border bg-card p-8 shadow-shadow">
        <h1 className="text-2xl font-heading text-foreground">设置新密码</h1>
        <p className="text-sm text-muted-foreground">输入你的新密码</p>

        <form className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="password">新密码</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="至少 8 位字符"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="confirm-password">确认密码</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="再次输入新密码"
            />
          </div>
          <Button type="submit" className="w-full">
            重置密码
          </Button>
        </form>

        <div className="flex justify-center gap-[6px] pt-[4px]">
          <Link to="/login" className="text-sm font-heading text-primary">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
