import { describe, expect, it } from "vitest";

import { getSafeInternalRedirect } from "@/lib/navigation";

describe("getSafeInternalRedirect", () => {
  it("保留站内路径、查询参数和锚点", () => {
    expect(getSafeInternalRedirect("/board/board-1?mode=edit#canvas")).toBe(
      "/board/board-1?mode=edit#canvas",
    );
  });

  it.each(["https://example.com", "//example.com", "javascript:alert(1)", "board/board-1", ""])(
    "拒绝非站内重定向地址 %s",
    (value) => {
      expect(getSafeInternalRedirect(value)).toBeUndefined();
    },
  );
});
