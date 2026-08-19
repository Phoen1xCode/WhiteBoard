import { Loader2, PenLine, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center gap-[28px] p-4">
      <div className="flex items-center gap-[10px]">
        <div className="bg-primary border-border flex h-[34px] w-[34px] items-center justify-center rounded-[6px] border-2">
          <PenLine className="text-primary-foreground h-[18px] w-[18px]" />
        </div>
        <span className="text-foreground text-[20px] font-bold">Whiteboard</span>
      </div>

      <div className="bg-card border-border flex w-full max-w-[400px] flex-col gap-[16px] rounded-lg border-2 p-[32px] shadow-[4px_4px_0px_0px_var(--border)]">
        <h1 className="text-foreground text-[24px] font-bold">创建账户</h1>
        <p className="text-muted-foreground text-[14px]">注册即可免费创建无限白板</p>

        <form className="flex flex-col gap-[16px]" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="username" className="text-foreground text-[14px] font-medium">
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
              className="bg-background border-input text-foreground placeholder:text-muted-foreground rounded-none border-2 px-[12px] py-[10px] text-[14px] outline-none"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="email" className="text-foreground text-[14px] font-medium">
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
              className="bg-background border-input text-foreground placeholder:text-muted-foreground rounded-none border-2 px-[12px] py-[10px] text-[14px] outline-none"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="password" className="text-foreground text-[14px] font-medium">
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
              className="bg-background border-input text-foreground placeholder:text-muted-foreground rounded-none border-2 px-[12px] py-[10px] text-[14px] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground border-border flex w-full items-center justify-center gap-[6px] rounded-none border-2 px-[16px] py-[8px] text-[14px] font-medium shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-50"
          >
            {loading && <Loader2 className="h-[16px] w-[16px] animate-spin" />}
            注册
          </button>
        </form>

        <div className="flex items-center gap-[12px] py-[4px]">
          <div className="bg-border h-[2px] flex-1" />
          <span className="text-muted-foreground text-[12px]">或</span>
          <div className="bg-border h-[2px] flex-1" />
        </div>

        <button
          type="button"
          className="bg-background text-foreground border-border flex w-full items-center justify-center gap-[6px] rounded-none border-2 px-[16px] py-[8px] text-[14px] font-medium shadow-[2px_2px_0px_0px_var(--border)]"
        >
          <Plus className="h-[16px] w-[16px]" />
          使用 GitHub 注册
        </button>

        <div className="flex justify-center gap-[6px] pt-[4px]">
          <span className="text-muted-foreground text-[13px]">已有账户？</span>
          <Link to="/login" className="text-primary text-[13px] font-semibold">
            直接登录
          </Link>
        </div>
      </div>
    </div>
  );
}
