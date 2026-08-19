import { describe, expect, it } from "vitest";

import { CLIENT_IP_HEADER, withClientIp } from "@/lib/client-ip";

describe("withClientIp", () => {
  it("overrides an untrusted client-supplied IP header", async () => {
    const request = new Request("http://localhost/api/v1/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [CLIENT_IP_HEADER]: "203.0.113.10",
      },
      body: JSON.stringify({ email: "alice@example.com" }),
    });

    const forwarded = withClientIp(request, "192.0.2.42");

    expect(forwarded.headers.get(CLIENT_IP_HEADER)).toBe("192.0.2.42");
    expect(await forwarded.json()).toEqual({ email: "alice@example.com" });
  });

  it("removes a spoofed header when the socket has no address", () => {
    const request = new Request("http://localhost", {
      headers: { [CLIENT_IP_HEADER]: "203.0.113.10" },
    });

    expect(withClientIp(request, undefined).headers.has(CLIENT_IP_HEADER)).toBe(false);
  });
});
