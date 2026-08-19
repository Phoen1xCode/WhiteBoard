import { PenLine } from "lucide-react";
import { Link } from "react-router-dom";

export function ResetPasswordPage() {
  return (
    <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center gap-[28px] p-4">
      <div className="flex items-center gap-[10px]">
        <div className="bg-primary border-border flex h-[34px] w-[34px] items-center justify-center rounded-[6px] border-2">
          <PenLine className="text-primary-foreground h-[18px] w-[18px]" />
        </div>
        <span className="text-foreground text-[20px] font-bold">Whiteboard</span>
      </div>

      <div className="bg-card border-border flex w-full max-w-[400px] flex-col gap-[16px] rounded-lg border-2 p-[32px] shadow-[4px_4px_0px_0px_var(--border)]">
        <h1 className="text-foreground text-[24px] font-bold">设置新密码</h1>
        <p className="text-muted-foreground text-[14px]">输入你的新密码</p>

        <form className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="password" className="text-foreground text-[14px] font-medium">
              新密码
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="至少 8 位字符"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground rounded-none border-2 px-[12px] py-[10px] text-[14px] outline-none"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="confirm-password" className="text-foreground text-[14px] font-medium">
              确认密码
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="再次输入新密码"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground rounded-none border-2 px-[12px] py-[10px] text-[14px] outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-primary-foreground border-border flex w-full items-center justify-center gap-[6px] rounded-none border-2 px-[16px] py-[8px] text-[14px] font-medium shadow-[2px_2px_0px_0px_var(--border)]"
          >
            重置密码
          </button>
        </form>

        <div className="flex justify-center gap-[6px] pt-[4px]">
          <Link to="/login" className="text-primary text-[13px] font-semibold">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
