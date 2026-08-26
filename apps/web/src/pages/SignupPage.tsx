import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, PenLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { register } from "@/lib/api";

export function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, username, password);
      await navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-[28px] bg-background p-4">
      <div className="flex items-center gap-[10px]">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[6px] border-2 border-border bg-primary">
          <PenLine className="h-[18px] w-[18px] text-primary-foreground" />
        </div>
        <span className="text-[20px] font-bold text-foreground">Whiteboard</span>
      </div>

      <div className="flex w-full max-w-[400px] flex-col gap-[16px] rounded-lg border-2 border-border bg-card p-[32px] shadow-[4px_4px_0px_0px_var(--border)]">
        <h1 className="text-[24px] font-bold text-foreground">创建账户</h1>

        <form className="flex flex-col gap-[16px]" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="username" className="text-[14px] font-medium text-foreground">
              用户名
            </label>
            <input
              id="username"
              required
              minLength={3}
              autoComplete="username"
              placeholder="你的昵称"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-none border-2 border-input bg-background px-[12px] py-[10px] text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="email" className="text-[14px] font-medium text-foreground">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-none border-2 border-input bg-background px-[12px] py-[10px] text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="password" className="text-[14px] font-medium text-foreground">
              密码
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="至少 8 位字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-none border-2 border-input bg-background px-[12px] py-[10px] text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-[6px] rounded-none border-2 border-border bg-primary px-[16px] py-[8px] text-[14px] font-medium text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-50"
          >
            {loading && <Loader2 className="h-[16px] w-[16px] animate-spin" />}
            注册
          </button>
        </form>

        <div className="flex justify-center gap-[6px] pt-[4px]">
          <span className="text-[13px] text-muted-foreground">已有账户？</span>
          <Link to="/login" className="text-[13px] font-semibold text-primary">
            直接登录
          </Link>
        </div>
      </div>
    </div>
  );
}
