import type { RegisterInput } from "@whiteboard/shared/schemas";

import { registerBodySchema, registerFieldConstraints } from "@whiteboard/shared/schemas";

export type SignupField = keyof RegisterInput;
export type SignupErrors = Partial<Record<SignupField, string>>;

function getFieldError(field: SignupField, input: RegisterInput): string {
  if (field === "email") return "请输入有效的邮箱地址";

  const value = input[field];
  const constraints = registerFieldConstraints[field];
  const label = field === "username" ? "用户名" : "密码";

  if (!value) return `请输入${label}`;
  if (value.length < constraints.minLength) {
    return `${label}至少需要 ${constraints.minLength} 个字符`;
  }
  return `${label}最多允许 ${constraints.maxLength} 个字符`;
}

export function validateSignup(input: RegisterInput): SignupErrors {
  const result = registerBodySchema.safeParse(input);
  if (result.success) return {};

  const errors: SignupErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (
      (field === "email" || field === "username" || field === "password") &&
      errors[field] === undefined
    ) {
      errors[field] = getFieldError(field, input);
    }
  }
  return errors;
}

export function getSignupRequestError(error: unknown): string {
  if (!(error instanceof Error)) return "注册失败，请稍后重试";

  if (error.message === "Email already exists") return "该邮箱已注册，请直接登录";
  if (error.message === "Username already exists") return "该用户名已被使用，请更换一个";
  if (error.message === "Too many requests") return "操作过于频繁，请稍后再试";
  return "注册失败，请稍后重试";
}
