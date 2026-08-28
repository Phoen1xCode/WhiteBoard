import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { CircleAlert, Loader2, PenLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api";

export function LoginPage() {
  const router = useRouter();
  const { redirect } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.history.replace(redirect ?? "/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Auth failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-[28px] bg-background p-4">
      <div className="flex items-center gap-[10px]">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-base border-2 border-border bg-primary">
          <PenLine className="h-[18px] w-[18px] text-primary-foreground" />
        </div>
        <span className="text-xl font-heading text-foreground">Whiteboard</span>
      </div>

      <div className="flex w-full max-w-[400px] flex-col gap-[16px] rounded-base border-2 border-border bg-card p-8 shadow-shadow">
        <h1 className="text-2xl font-heading text-foreground">欢迎回来</h1>
        <p className="text-sm text-muted-foreground">登录你的 Whiteboard 账户</p>

        {error && (
          <div className="flex items-center gap-2 rounded-base border-2 border-border bg-destructive px-3 py-2.5">
            <CircleAlert className="size-4 shrink-0 text-destructive-foreground" />
            <span className="text-sm text-destructive-foreground">{error}</span>
          </div>
        )}

        <form className="flex flex-col gap-[16px]" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-primary">
              忘记密码？
            </Link>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="animate-spin" />}
            登录
          </Button>
        </form>

        <div className="flex justify-center gap-[6px] pt-[4px]">
          <span className="text-sm text-muted-foreground">还没有账户？</span>
          <Link to="/signup" className="text-sm font-heading text-primary">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}
