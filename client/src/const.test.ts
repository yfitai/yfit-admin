import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLoginUrl,
  LoginConfigurationError,
  LOGIN_CONFIGURATION_ERROR_MESSAGE,
} from "./const";

describe("login URL configuration and existing SDK contract", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_OAUTH_PORTAL_URL", "https://portal.example.test");
    vi.stubEnv("VITE_APP_ID", "synthetic-app");
    vi.stubGlobal("window", { location: { origin: "https://admin.example.test" } });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each([undefined, "", "   ", "undefined", "null"])(
    "rejects absent portal input without leaking its value (%s)",
    portal => {
      vi.stubEnv("VITE_OAUTH_PORTAL_URL", portal);
      expect(getLoginUrl).toThrow(LoginConfigurationError);
      expect(getLoginUrl).toThrow(LOGIN_CONFIGURATION_ERROR_MESSAGE);
    }
  );

  it.each([undefined, "", "   ", "undefined", "null"])(
    "rejects absent app input (%s)",
    appId => {
      vi.stubEnv("VITE_APP_ID", appId);
      expect(getLoginUrl).toThrow(LoginConfigurationError);
    }
  );

  it.each([
    "/relative",
    "invalid-candidate",
    "javascript:synthetic",
    "ftp://portal.example.test",
    "https://synthetic:do-not-leak@portal.example.test",
    "https://portal.example.test?candidate=do-not-leak",
    "https://portal.example.test#candidate",
  ])("rejects malformed/unsafe portal input with a fixed error (%s)", portal => {
    vi.stubEnv("VITE_OAUTH_PORTAL_URL", portal);
    try {
      getLoginUrl();
      throw new Error("Expected configuration rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(LoginConfigurationError);
      expect((error as Error).message).toBe(LOGIN_CONFIGURATION_ERROR_MESSAGE);
      expect((error as Error).message).not.toContain(portal);
    }
  });

  it("preserves /app-auth, query names, base64 state and invocation-time origin", () => {
    const cookieBefore = document.cookie;
    for (const origin of ["https://admin.example.test", "http://localhost:5173"]) {
      vi.stubGlobal("window", { location: { origin } });
      const url = new URL(getLoginUrl());
      const callback = `${origin}/api/oauth/callback`;
      expect(url.origin).toBe("https://portal.example.test");
      expect(url.pathname).toBe("/app-auth");
      expect([...url.searchParams.keys()]).toEqual(["appId", "redirectUri", "state", "type"]);
      expect(url.searchParams.get("appId")).toBe("synthetic-app");
      expect(url.searchParams.get("redirectUri")).toBe(callback);
      expect(atob(url.searchParams.get("state")!)).toBe(callback);
      expect(url.searchParams.get("type")).toBe("signIn");
    }
    expect(document.cookie).toBe(cookieBefore);
  });
});
