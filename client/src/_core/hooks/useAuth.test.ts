import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as loginConfig from "@/const";
import { useAuth } from "./useAuth";
import Accounting from "@/pages/Accounting";
import DashboardLayout from "@/components/DashboardLayout";

const mocked = vi.hoisted(() => {
  const me = {
    data: null as unknown,
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  };
  const logout = { error: null, isPending: false, mutateAsync: vi.fn() };
  const query = vi.fn((..._args: unknown[]) => ({ data: undefined, refetch: vi.fn() }));
  const mutate = vi.fn();
  const mutation = vi.fn(() => ({ mutate, isPending: false }));
  return { me, logout, query, mutation, mutate };
});

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { setData: vi.fn(), invalidate: vi.fn() } } }),
    auth: {
      me: { useQuery: () => mocked.me },
      logout: { useMutation: () => mocked.logout },
    },
    accounting: new Proxy({}, {
      get: () => ({ useQuery: mocked.query, useMutation: mocked.mutation }),
    }),
  },
}));

let root: Root;
let container: HTMLDivElement;
let auth: ReturnType<typeof useAuth>;
let inRender: boolean;
let urlSpy: ReturnType<typeof vi.spyOn>;
let location: { origin: string; pathname: string; href: string };
const actualGetLoginUrl = loginConfig.getLoginUrl;

function Harness({ options }: { options?: Parameters<typeof useAuth>[0] }) {
  inRender = true;
  auth = useAuth(options);
  inRender = false;
  return createElement("button", { onClick: auth.login }, "Sign In");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VITE_OAUTH_PORTAL_URL", undefined);
  vi.stubEnv("VITE_APP_ID", undefined);
  mocked.me.data = null;
  mocked.me.isLoading = false;
  mocked.logout.isPending = false;
  location = { origin: "https://admin.example.test", pathname: "/accounting", href: "unchanged" };
  const originalWindow = window;
  vi.stubGlobal("window", new Proxy(originalWindow, {
    get(target, prop) {
      return prop === "location" ? location : Reflect.get(target, prop, target);
    },
  }));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  inRender = false;
  urlSpy = vi.spyOn(loginConfig, "getLoginUrl").mockImplementation(() => {
    expect(inRender).toBe(false);
    return actualGetLoginUrl();
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("lazy useAuth login", () => {
  it("renders an unauthenticated state with absent config without resolving any login URL", async () => {
    await act(async () => root.render(createElement(Harness)));
    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.loading).toBe(false);
    expect(auth.loginError).toBeNull();
    expect(urlSpy).not.toHaveBeenCalled();
    expect(location.href).toBe("unchanged");
  });

  it("turns a sign-in click with absent config into a controlled error without navigation", async () => {
    await act(async () => root.render(createElement(Harness)));
    await act(async () => container.querySelector("button")!.click());
    expect(urlSpy).toHaveBeenCalledOnce();
    expect(auth.loginError).toBe(loginConfig.LOGIN_CONFIGURATION_ERROR_MESSAGE);
    expect(location.href).toBe("unchanged");
    expect(auth.isAuthenticated).toBe(false);
  });

  it("resolves valid configuration only on click and uses the current origin", async () => {
    vi.stubEnv("VITE_OAUTH_PORTAL_URL", "https://portal.example.test");
    vi.stubEnv("VITE_APP_ID", "synthetic-app");
    await act(async () => root.render(createElement(Harness)));
    expect(urlSpy).not.toHaveBeenCalled();
    location.origin = "https://second-admin.example.test";
    await act(async () => container.querySelector("button")!.click());
    const url = new URL(location.href);
    expect(url.searchParams.get("redirectUri")).toBe("https://second-admin.example.test/api/oauth/callback");
    expect(auth.loginError).toBeNull();
  });

  it("handles absent config in an opted-in redirect effect without crashing", async () => {
    await act(async () => root.render(createElement(Harness, { options: { redirectOnUnauthenticated: true } })));
    expect(urlSpy).toHaveBeenCalledOnce();
    expect(auth.loginError).toBe(loginConfig.LOGIN_CONFIGURATION_ERROR_MESSAGE);
    expect(location.href).toBe("unchanged");
  });

  it("resolves valid configuration in the opted-in effect after render", async () => {
    vi.stubEnv("VITE_OAUTH_PORTAL_URL", "https://portal.example.test");
    vi.stubEnv("VITE_APP_ID", "synthetic-app");
    await act(async () => root.render(createElement(Harness, { options: { redirectOnUnauthenticated: true } })));
    expect(urlSpy).toHaveBeenCalledOnce();
    const url = new URL(location.href);
    expect(url.pathname).toBe("/app-auth");
    expect(atob(url.searchParams.get("state")!)).toBe(`${location.origin}/api/oauth/callback`);
    expect(auth.loginError).toBeNull();
  });

  it.each(["loading", "logout pending", "authenticated"])("does not resolve a URL while %s", async state => {
    if (state === "loading") mocked.me.isLoading = true;
    if (state === "logout pending") mocked.logout.isPending = true;
    if (state === "authenticated") mocked.me.data = { id: 1, role: "admin" };
    await act(async () => root.render(createElement(Harness, { options: { redirectOnUnauthenticated: true } })));
    expect(urlSpy).not.toHaveBeenCalled();
    expect(location.href).toBe("unchanged");
  });

  it("honors an explicit redirect path without requiring OAuth configuration", async () => {
    await act(async () => root.render(createElement(Harness, { options: { redirectOnUnauthenticated: true, redirectPath: "/sign-in" } })));
    expect(location.href).toBe("/sign-in");
    expect(urlSpy).not.toHaveBeenCalled();
  });

  it("does not redirect to the same explicit path", async () => {
    await act(async () => root.render(createElement(Harness, { options: { redirectOnUnauthenticated: true, redirectPath: "/accounting" } })));
    expect(location.href).toBe("unchanged");
    expect(urlSpy).not.toHaveBeenCalled();
  });
});

describe("Accounting unauthenticated sign-in panel (all tRPC hooks mocked)", () => {
  it("renders without config, keeps report queries disabled, and displays the click error", async () => {
    await act(async () => root.render(createElement(Accounting)));
    expect(container.textContent).toContain("Authentication Required");
    expect(urlSpy).not.toHaveBeenCalled();
    expect(mocked.query).toHaveBeenCalledTimes(3);
    for (const call of mocked.query.mock.calls) {
      expect(call[1]).toEqual({ enabled: false });
    }
    expect(mocked.mutate).not.toHaveBeenCalled();
    await act(async () => container.querySelector("button")!.click());
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(loginConfig.LOGIN_CONFIGURATION_ERROR_MESSAGE);
    expect(location.href).toBe("unchanged");
    expect(mocked.mutate).not.toHaveBeenCalled();
  });
});

describe("Dashboard unauthenticated sign-in panel", () => {
  it("renders without config and displays the controlled sign-in click error", async () => {
    await act(async () => root.render(createElement(DashboardLayout, { children: "protected content" })));
    expect(container.textContent).toContain("Sign in to continue");
    expect(container.textContent).not.toContain("protected content");
    expect(urlSpy).not.toHaveBeenCalled();
    await act(async () => container.querySelector("button")!.click());
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(loginConfig.LOGIN_CONFIGURATION_ERROR_MESSAGE);
    expect(location.href).toBe("unchanged");
    expect(mocked.mutate).not.toHaveBeenCalled();
  });
});
