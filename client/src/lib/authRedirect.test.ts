import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCClientError } from "@trpc/client";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { toast } from "sonner";
import * as loginConfig from "@/const";
import { redirectToLoginIfUnauthorized } from "./authRedirect";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
let location: { origin: string; href: string };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VITE_OAUTH_PORTAL_URL", undefined);
  vi.stubEnv("VITE_APP_ID", undefined);
  location = { origin: "https://admin.example.test", href: "unchanged" };
  vi.stubGlobal("window", { location });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("global unauthorized redirect", () => {
  it("does not throw or navigate with absent config and displays a fixed safe error", () => {
    const error = new TRPCClientError(UNAUTHED_ERR_MSG);
    expect(() => redirectToLoginIfUnauthorized(error)).not.toThrow();
    expect(location.href).toBe("unchanged");
    expect(toast.error).toHaveBeenCalledWith(loginConfig.LOGIN_CONFIGURATION_ERROR_MESSAGE);
  });

  it("ignores unrelated errors without resolving the login URL", () => {
    const spy = vi.spyOn(loginConfig, "getLoginUrl");
    redirectToLoginIfUnauthorized(new Error(UNAUTHED_ERR_MSG));
    redirectToLoginIfUnauthorized(new TRPCClientError("unrelated synthetic error"));
    expect(spy).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(location.href).toBe("unchanged");
  });

  it("keeps valid config's existing login protocol and origin", () => {
    vi.stubEnv("VITE_OAUTH_PORTAL_URL", "https://portal.example.test");
    vi.stubEnv("VITE_APP_ID", "synthetic-app");
    redirectToLoginIfUnauthorized(new TRPCClientError(UNAUTHED_ERR_MSG));
    const url = new URL(location.href);
    expect(url.pathname).toBe("/app-auth");
    expect(url.searchParams.get("redirectUri")).toBe(`${location.origin}/api/oauth/callback`);
    expect(atob(url.searchParams.get("state")!)).toBe(`${location.origin}/api/oauth/callback`);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
