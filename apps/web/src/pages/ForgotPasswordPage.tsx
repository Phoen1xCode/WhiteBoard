import { Link } from "@tanstack/react-router";
import { PenLine } from "lucide-react";

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-[28px] bg-background p-4">
      <div className="flex items-center gap-[10px]">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[6px] border-2 border-border bg-primary">
          <PenLine className="h-[18px] w-[18px] text-primary-foreground" />
        </div>
        <span className="text-[20px] font-bold text-foreground">Whiteboard</span>
      </div>

      <div className="flex w-full max-w-[400px] flex-col gap-[16px] rounded-lg border-2 border-border bg-card p-[32px] shadow-[4px_4px_0px_0px_var(--border)]">
        <h1 className="text-[24px] font-bold text-foreground">忘记密码</h1>
        <p className="text-[14px] text-muted-foreground">输入注册邮箱，我们将发送重置链接</p>

        <form className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="email" className="text-[14px] font-medium text-foreground">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="rounded-none border-2 border-input bg-background px-[12px] py-[10px] text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-[6px] rounded-none border-2 border-border bg-primary px-[16px] py-[8px] text-[14px] font-medium text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)]"
          >
            发送重置链接
          </button>
        </form>

        <div className="flex justify-center gap-[6px] pt-[4px]">
          <Link to="/login" className="text-[13px] font-semibold text-primary">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
