import { describe, expect, it } from "vitest";

import { validateSignup } from "@/lib/signup-validation";

describe("validateSignup", () => {
  it("接受共享注册约束内的数据", () => {
    expect(
      validateSignup({
        email: "alice@example.com",
        username: "alice",
        password: "password123",
      }),
    ).toEqual({});
  });

  it("为超长用户名返回中文行内错误", () => {
    expect(
      validateSignup({
        email: "alice@example.com",
        username: "abcdefghijklmnop",
        password: "password123",
      }),
    ).toMatchObject({ username: "用户名最多允许 15 个字符" });
  });

  it("同时报告各字段错误", () => {
    expect(validateSignup({ email: "invalid", username: "ab", password: "short" })).toEqual({
      email: "请输入有效的邮箱地址",
      username: "用户名至少需要 3 个字符",
      password: "密码至少需要 8 个字符",
    });
  });
});
