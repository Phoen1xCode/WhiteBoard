// @vitest-environment happy-dom

import { createMemoryHistory } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { createAppRouter } from "@/router";

function createTestRouter(path: string, authenticated: boolean) {
  return createAppRouter({
    history: createMemoryHistory({ initialEntries: [path] }),
    auth: { isAuthenticated: () => authenticated },
  });
}

describe("app router", () => {
  it("将未登录用户重定向到登录页并保留目标地址", async () => {
    const router = createTestRouter("/board/board-1", false);

    await router.load();

    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toEqual({ redirect: "/board/board-1" });
  });

  it("允许已登录用户进入受保护页面", async () => {
    const router = createTestRouter("/", true);

    await router.load();

    expect(router.state.location.pathname).toBe("/");
    expect(router.state.matches.at(-1)?.routeId).toBe("/_authenticated/");
  });

  it("以类型安全的动态参数匹配白板路由", async () => {
    const router = createTestRouter("/board/board-1", true);

    await router.load();

    const boardMatch = router.state.matches.find(
      (match) => match.routeId === "/_authenticated/board/$boardId",
    );
    expect(boardMatch?.params).toMatchObject({ boardId: "board-1" });
  });
});
