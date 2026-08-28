import { Link, useNavigate } from "@tanstack/react-router";
import { registerFieldConstraints } from "@whiteboard/shared/schemas";
import { CircleAlert, Loader2, PenLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/lib/api";
import {
  getSignupRequestError,
  validateSignup,
  type SignupErrors,
  type SignupField,
} from "@/lib/signup-validation";
import { cn } from "@/lib/utils";

export function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function clearFieldError(field: SignupField) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRequestError(null);

    const input = { email, username, password };
    const nextErrors = validateSignup(input);
    const firstInvalidField = (Object.keys(nextErrors) as SignupField[])[0];
    if (firstInvalidField) {
      setErrors(nextErrors);
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await register(input.email, input.username, input.password);
      await navigate({ to: "/" });
    } catch (error) {
      const message = getSignupRequestError(error);
      setRequestError(message);
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
        <h1 className="text-2xl font-heading text-foreground">创建账户</h1>

        {requestError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-base border-2 border-border bg-destructive px-3 py-2.5"
          >
            <CircleAlert className="size-4 shrink-0 text-destructive-foreground" />
            <span className="text-sm text-destructive-foreground">{requestError}</span>
          </div>
        )}

        <form className="flex flex-col gap-[16px]" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              required
              minLength={registerFieldConstraints.username.minLength}
              maxLength={registerFieldConstraints.username.maxLength}
              autoComplete="username"
              placeholder="你的昵称"
              value={username}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "username-error" : undefined}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError("username");
              }}
              className={cn(errors.username && "border-destructive")}
            />
            {errors.username && (
              <p id="username-error" role="alert" className="text-xs text-destructive">
                {errors.username}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              className={cn(errors.email && "border-destructive")}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={registerFieldConstraints.password.minLength}
              maxLength={registerFieldConstraints.password.maxLength}
              autoComplete="new-password"
              placeholder={`至少 ${registerFieldConstraints.password.minLength} 位字符`}
              value={password}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              className={cn(errors.password && "border-destructive")}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="text-xs text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="animate-spin" />}
            注册
          </Button>
        </form>

        <div className="flex justify-center gap-[6px] pt-[4px]">
          <span className="text-sm text-muted-foreground">已有账户？</span>
          <Link to="/login" className="text-sm font-heading text-primary">
            直接登录
          </Link>
        </div>
      </div>
    </div>
  );
}
