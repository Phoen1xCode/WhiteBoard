import { Link } from "@tanstack/react-router";
import { PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-[28px] bg-background p-4">
      <div className="flex items-center gap-[10px]">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-base border-2 border-border bg-primary">
          <PenLine className="h-[18px] w-[18px] text-primary-foreground" />
        </div>
        <span className="text-xl font-heading text-foreground">Whiteboard</span>
      </div>

      <div className="flex w-full max-w-[400px] flex-col gap-[16px] rounded-base border-2 border-border bg-card p-8 shadow-shadow">
        <h1 className="text-2xl font-heading text-foreground">忘记密码</h1>
        <p className="text-sm text-muted-foreground">输入注册邮箱，我们将发送重置链接</p>

        <form className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" />
          </div>
          <Button type="submit" className="w-full">
            发送重置链接
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
