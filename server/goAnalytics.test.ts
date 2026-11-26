/** Fictional offline fixtures only. No native analytics evidence, live API, or environment changes. */
import { execFileSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  config: {
    readApiKey: null as string | null,
    scopeVerified: false,
    sourceScopeVerified: false,
  },
  env: {
    forgeApiKey: "fictional-legacy-key",
    umamiEndpoint: "https://fictional-analytics.invalid",
    umamiWebsiteId: "fictional-site",
    uploadPostApiKey: "",
  },
}));
vi.mock("./_core/env", () => ({ ENV: mocks.env }));
vi.mock("./umamiGoConfig", async importOriginal => {
  const actual = await importOriginal<typeof import("./umamiGoConfig")>();
  return {
    umamiGoConfig: (env?: NodeJS.ProcessEnv) =>
      env ? actual.umamiGoConfig(env) : mocks.config,
  };
});
import { fetchWebsiteAnalytics } from "./analytics";
import { umamiGoConfig } from "./umamiGoConfig";
import {
  completeGoStats,
  goCount,
  normalizeGoSources,
  normalizeGoStats,
} from "./goAnalytics";
import {
  GO_HOSTS,
  GO_SOURCES,
  makeReportPeriod,
  REPORT_VERSION,
  type FullAnalyticsData,
} from "./reportingModel";
import {
  buildPlainLanguageAnalysis,
  buildReportSummary,
} from "./reportingSummary";
import { generateWeeklyReport } from "./reportGenerator";
import { buildWeeklyReportEmail } from "./emailReport";

const request = { startDate: "2026-11-16", endDate: "2026-11-22" };
const period = makeReportPeriod(request, new Date("2026-11-26T18:00:00Z"));
const stats = {
  pageviews: 10,
  visitors: 4,
  visits: 5,
  bounces: 1,
  totaltime: 12,
};
const zero = { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 };
const sources = [
  { utm: "facebook", views: 3 },
  { utm: "direct", views: 0 },
];
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
function enable(scope = true, source = true) {
  Object.assign(mocks.config, {
    readApiKey: "fictional-read-key",
    scopeVerified: scope,
    sourceScopeVerified: source,
  });
}
function mockReads(handler?: (url: URL) => Response) {
  const mock = vi.fn(async (url: string) => {
    const u = new URL(url);
    if (handler) return handler(u);
    return response(
      u.pathname.endsWith("/stats")
        ? stats
        : u.pathname.endsWith("/utm/metrics")
          ? sources
          : []
    );
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}
async function data(): Promise<FullAnalyticsData> {
  const website = await fetchWebsiteAnalytics(request);
  return {
    weekStart: period.startDate,
    weekEnd: period.endDate,
    period,
    reportVersion: REPORT_VERSION,
    social: {
      platforms: [],
      period,
      fetchedAt: "2026-11-26T18:00:00Z",
      warnings: [],
    },
    website,
  };
}
beforeEach(() => {
  Object.assign(mocks.config, {
    readApiKey: null,
    scopeVerified: false,
    sourceScopeVerified: false,
  });
  mocks.env.forgeApiKey = "fictional-legacy-key";
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Network forbidden in offline Go tests");
    })
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Go operator gates and read-only orchestration", () => {
  it("parses exact independent true gates and requires a dedicated key without setting environment values", () => {
    expect(umamiGoConfig({})).toEqual({
      readApiKey: null,
      scopeVerified: false,
      sourceScopeVerified: false,
    });
    expect(
      umamiGoConfig({
        YFIT_UMAMI_GO_SCOPE_VERIFIED: "true",
        YFIT_UMAMI_GO_SOURCE_SCOPE_VERIFIED: "true",
      }).scopeVerified
    ).toBe(false);
    expect(
      umamiGoConfig({
        YFIT_UMAMI_READ_API_KEY: "fictional",
        YFIT_UMAMI_GO_SCOPE_VERIFIED: "true",
        YFIT_UMAMI_GO_SOURCE_SCOPE_VERIFIED: "TRUE",
      })
    ).toMatchObject({ scopeVerified: true, sourceScopeVerified: false });
    expect(
      umamiGoConfig({
        YFIT_UMAMI_READ_API_KEY: "fictional",
        YFIT_UMAMI_GO_SCOPE_VERIFIED: "false",
        YFIT_UMAMI_GO_SOURCE_SCOPE_VERIFIED: "true",
      })
    ).toMatchObject({ scopeVerified: false, sourceScopeVerified: true });
  });
  it("default legacy success stays per-host partial, with no UTM or extra query and no combined Go headline", async () => {
    const fetch = mockReads();
    const report = await data();
    expect(fetch).toHaveBeenCalledTimes(12);
    expect(fetch.mock.calls.some(([url]) => url.includes("/utm/"))).toBe(false);
    expect(report.website.go.status).toBe("partial");
    expect(Object.values(report.website.go.stats).every(v => v === null)).toBe(
      true
    );
    expect(
      report.website.go.hosts?.every(
        h => h.status === "partial" && h.stats.visitors === 4
      )
    ).toBe(true);
    expect(buildReportSummary(report)).toMatchObject({
      goPageviews: null,
      goVisitors: null,
    });
  });
  it("no credential means no requests, unavailable null counters, and no auth fallback", async () => {
    mocks.env.forgeApiKey = "";
    const fetch = mockReads();
    const report = await data();
    expect(fetch).not.toHaveBeenCalled();
    expect(report.website.go.status).toBe("unavailable");
    expect(report.website.go.hosts?.every(h => h.stats.visitors === null)).toBe(
      true
    );
  });
  it.each([
    [false, false],
    [false, true],
    [true, false],
  ])(
    "does not call UTM endpoint unless both gates are enabled (%s/%s)",
    async (scope, source) => {
      enable(scope, source);
      const fetch = mockReads();
      const report = await data();
      expect(fetch).toHaveBeenCalledTimes(12);
      expect(report.website.go.sources?.status).toBe("unavailable");
      expect(report.website.go.status).toBe(scope ? "available" : "partial");
    }
  );
  it("uses the exact official UTM route/filters, fixed date bounds and dedicated API key only", async () => {
    enable();
    const fetch = mockReads();
    await data();
    expect(fetch).toHaveBeenCalledTimes(15);
    const utm = fetch.mock.calls.filter(([url]) =>
      new URL(url).pathname.endsWith("/utm/metrics")
    );
    expect(utm).toHaveLength(3);
    for (const [url] of utm) {
      const u = new URL(url);
      expect(u.pathname).toBe("/api/websites/fictional-site/utm/metrics");
      expect(Object.fromEntries(u.searchParams)).toEqual({
        startAt: String(period.startAt),
        endAt: String(period.endAt - 1),
        timezone: "Etc/GMT+5",
        hostname: expect.stringMatching(/^(app\.|www\.)?yfitai\.com$/),
        eventType: "1",
        match: "all",
        path: "/go",
        type: "utm_source",
      });
    }
    for (const [, init] of fetch.mock.calls as unknown as Array<
      [string, RequestInit]
    >) {
      expect(init.method).toBe("GET");
      expect(init.redirect).toBe("error");
      expect(init.headers).toEqual({
        Authorization: "Bearer fictional-read-key",
      });
    }
  });
  it("401 with prepared gates returns null and never falls back to the legacy key or login", async () => {
    enable();
    const fetch = mockReads(() =>
      response({ token: "private-fixture-body" }, 401)
    );
    const report = await data();
    expect(fetch).toHaveBeenCalledTimes(15);
    expect(report.website.go.status).toBe("unavailable");
    expect(report.website.go.sources?.status).toBe("unavailable");
    expect(buildReportSummary(report).goPageviews).toBeNull();
    expect(JSON.stringify(report)).not.toMatch(
      /private-fixture-body|fictional-read-key|fictional-legacy-key/
    );
  });
  it("unsupported UTM endpoint leaves source counts null while verified host stats remain usable", async () => {
    enable();
    const fetch = mockReads(u =>
      response(
        u.pathname.endsWith("/stats") ? stats : [],
        u.pathname.endsWith("/utm/metrics") ? 404 : 200
      )
    );
    const report = await data();
    expect(fetch).toHaveBeenCalledTimes(15);
    expect(report.website.go.status).toBe("available");
    expect(report.website.go.sources?.status).toBe("unavailable");
    expect(
      Object.values(report.website.go.sources!.pageviews).every(v => v === null)
    ).toBe(true);
    expect(report.website.go.sources!.warnings.join()).toContain("404");
  });
});

describe("Go counters and campaign pageview integrity", () => {
  it.each([
    -1,
    0.5,
    "0",
    true,
    null,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])("rejects invalid integer counter %s", value => {
    expect(goCount(value)).toBeNull();
    expect(
      completeGoStats(normalizeGoStats({ ...stats, visitors: value }))
    ).toBe(false);
  });
  it("accepts native nested stats but incomplete counter responses stay partial and cannot form combined headlines", async () => {
    enable();
    mockReads(u =>
      response(
        u.pathname.endsWith("/stats")
          ? { ...stats, visitors: { value: 4 }, visits: undefined }
          : []
      )
    );
    const report = await data();
    expect(
      report.website.go.hosts?.every(
        h =>
          h.status === "partial" &&
          h.stats.visitors === 4 &&
          h.stats.visits === null
      )
    ).toBe(true);
    expect(report.website.go.stats.pageviews).toBeNull();
  });
  it("one failed stats host keeps other verified native host visitors but nulls combined pageviews", async () => {
    enable();
    mockReads(u =>
      response(
        u.pathname.endsWith("/stats") ? stats : sources,
        u.searchParams.get("path") === "/go" &&
          u.pathname.endsWith("/stats") &&
          u.searchParams.get("hostname") === "www.yfitai.com"
          ? 401
          : 200
      )
    );
    const report = await data();
    const summary = buildReportSummary(report);
    expect(summary.goPageviews).toBeNull();
    expect(
      summary.goDetails!.hosts.find(h => h.host === "www.yfitai.com")
    ).toMatchObject({ status: "unavailable", pageviews: null, visitors: null });
    expect(
      summary.goDetails!.hosts.find(h => h.host === "app.yfitai.com")
    ).toMatchObject({ status: "available", visitors: 4 });
  });
  it("all verified zeros retain per-host zero but combined visitors stay null even at zero", async () => {
    enable();
    mockReads(u =>
      response(
        u.pathname.endsWith("/stats")
          ? zero
          : u.pathname.endsWith("/utm/metrics")
            ? [{ utm: "facebook", views: 0 }]
            : []
      )
    );
    const report = await data();
    const summary = buildReportSummary(report);
    expect(report.website.go.stats).toEqual({
      pageviews: 0,
      visitors: null,
      visits: null,
      bounces: null,
      totaltime: null,
    });
    expect(summary.goPageviews).toBe(0);
    expect(summary.goVisitors).toBeNull();
    expect(
      summary.goDetails!.hosts.every(h => h.pageviews === 0 && h.visitors === 0)
    ).toBe(true);
    expect(summary.goDetails!.sourcePageviews.facebook).toBe(0);
    expect(summary.goDetails!.sourcePageviews.instagram).toBeNull();
  });
  it("host visitor overlap never becomes a combined unique count or triggers an unfiltered query", async () => {
    enable();
    const fetch = mockReads();
    const report = await data();
    const summary = buildReportSummary(report);
    expect(summary.goPageviews).toBe(30);
    expect(summary.goVisitors).toBeNull();
    expect(summary.goDetails!.hosts.map(h => h.visitors)).toEqual([4, 4, 4]);
    expect(
      fetch.mock.calls.every(([url]) =>
        GO_HOSTS.includes(
          new URL(url).searchParams.get("hostname") as (typeof GO_HOSTS)[number]
        )
      )
    ).toBe(true);
  });
  it("redacts arbitrary source tags, maps empty/unknown to unattributed and requires explicitly tagged direct", () => {
    const parsed = normalizeGoSources([
      { utm: " Facebook ", views: 2 },
      { utm: "facebook", views: 1 },
      { utm: "direct", views: 0 },
      { utm: "", views: 3 },
      { utm: null, views: 1 },
      { utm: "private-person@example.invalid", views: 5 },
      { utm: "https://private.invalid?token=secret", views: 2 },
    ]);
    expect(parsed.valid).toBe(true);
    expect(parsed.pageviews).toMatchObject({
      facebook: 3,
      direct: 0,
      unknown: 11,
      instagram: null,
    });
    expect(JSON.stringify(parsed)).not.toMatch(/private|token|secret|@/);
    expect(Object.keys(parsed.pageviews)).toEqual([...GO_SOURCES]);
  });
  it.each([
    { utm: "facebook", views: "1" },
    { utm: "facebook", views: -1 },
    { utm: "facebook", views: 1.5 },
    { utm: 3, views: 1 },
    { x: "facebook", y: 1 },
  ])(
    "invalid UTM row %# is partial and never a certified source count",
    row => {
      const parsed = normalizeGoSources([row]);
      expect(parsed.valid).toBe(false);
      expect(Object.values(parsed.pageviews).every(v => v === null)).toBe(true);
    }
  );
  it("empty valid source result is not proof of zero social sources or direct visits", async () => {
    enable();
    mockReads(u => response(u.pathname.endsWith("/stats") ? stats : []));
    const report = await data();
    expect(report.website.go.sources!.status).toBe("available");
    expect(
      Object.values(report.website.go.sources!.pageviews).every(v => v === null)
    ).toBe(true);
  });
  it("partial source host failure nulls every combined source but permits labelled successful host context", async () => {
    enable();
    mockReads(u =>
      response(
        u.pathname.endsWith("/stats")
          ? stats
          : u.pathname.endsWith("/utm/metrics")
            ? sources
            : [],
        u.pathname.endsWith("/utm/metrics") &&
          u.searchParams.get("hostname") === "www.yfitai.com"
          ? 501
          : 200
      )
    );
    const report = await data();
    const summary = buildReportSummary(report);
    expect(summary.goDetails!.sourceStatus).toBe("partial");
    expect(
      Object.values(summary.goDetails!.sourcePageviews).every(v => v === null)
    ).toBe(true);
    const analysis = buildPlainLanguageAnalysis(report);
    expect(analysis).toContain(
      "Per-host context only - incomplete combined coverage"
    );
    expect(analysis).toContain("Facebook: Unavailable pageviews");
    expect(analysis).not.toContain("Instagram: 0");
  });
});

describe("Go PDF/email/summary and historical fixtures", () => {
  it("prominently renders native host visitors and campaign PAGEVIEWS in PDF/email/analysis without arbitrary source text", async () => {
    enable();
    const fetch = mockReads(u =>
      response(
        u.pathname.endsWith("/stats")
          ? stats
          : u.pathname.endsWith("/utm/metrics")
            ? [...sources, { utm: "person@example.invalid", views: 1 }]
            : []
      )
    );
    const report = await data();
    const summary = buildReportSummary(report);
    const calls = fetch.mock.calls.length;
    const analysis = buildPlainLanguageAnalysis(report);
    const html = buildWeeklyReportEmail(
      period.startDate,
      period.endDate,
      summary
    );
    const pdf = await generateWeeklyReport(report, analysis);
    const text = execFileSync("pdftotext", ["-layout", "-", "-"], {
      input: pdf,
      encoding: "utf8",
    });
    for (const output of [html, text, analysis]) {
      expect(output).toContain("Campaign-source PAGEVIEWS for /go");
      expect(output).toContain("app.yfitai.com");
      expect(output).toContain("Unknown/unattributed");
      expect(output).toMatch(/not social outbound clicks or unique people/i);
      expect(output).not.toContain("person@example.invalid");
    }
    expect(text.indexOf("Go /go - recorded arrivals")).toBeLessThan(
      text.indexOf("Selected-period social metrics")
    );
    expect(text).toMatch(/app\.yfitai\.com\s+10\s+4/);
    expect(text).toContain("Cross-host visitors: unavailable");
    expect(html.indexOf("Go /go - recorded arrivals")).toBeLessThan(
      html.indexOf("Website recorded visitors (Umami)")
    );
    expect(fetch).toHaveBeenCalledTimes(calls);
  });
  it("keeps verified per-host sources visible when other hosts omit the bucket, without inventing combined zeros", async () => {
    enable();
    mockReads(u =>
      response(
        u.pathname.endsWith("/stats")
          ? stats
          : u.pathname.endsWith("/utm/metrics") &&
              u.searchParams.get("hostname") === "app.yfitai.com"
            ? sources
            : []
      )
    );
    const report = await data();
    const summary = buildReportSummary(report);
    expect(summary.goDetails!.sourceStatus).toBe("available");
    expect(summary.goDetails!.sourcePageviews.facebook).toBeNull();
    const analysis = buildPlainLanguageAnalysis(report);
    const html = buildWeeklyReportEmail(
      period.startDate,
      period.endDate,
      summary
    );
    const text = execFileSync("pdftotext", ["-layout", "-", "-"], {
      input: await generateWeeklyReport(report, analysis),
      encoding: "utf8",
    });
    for (const output of [html, text, analysis]) {
      expect(output).toContain(
        "Canonical Go measured visitors (app.yfitai.com/go): 4"
      );
      expect(output).toContain("Verified per-host pageviews");
      expect(output).toContain("combined bucket unavailable");
      expect(output).not.toContain("Instagram: 0");
    }
    expect(analysis).toContain("Facebook: Unavailable pageviews");
    expect(analysis).toContain("app.yfitai.com, Facebook: 3 pageviews");
  });
  it("unverified successful Go counters are context only in every format, never headline totals", async () => {
    mockReads();
    const report = await data();
    const summary = buildReportSummary(report);
    const analysis = buildPlainLanguageAnalysis(report);
    const html = buildWeeklyReportEmail(
      period.startDate,
      period.endDate,
      summary
    );
    const text = execFileSync("pdftotext", ["-layout", "-", "-"], {
      input: await generateWeeklyReport(report, analysis),
      encoding: "utf8",
    });
    for (const output of [html, text, analysis]) {
      expect(output).toContain("Combined Go pageviews: Unavailable");
      expect(output).toContain(
        "Canonical Go measured visitors (app.yfitai.com/go): Unavailable"
      );
      expect(output).toContain("Partial/context only - not certified");
    }
  });
  it("source date mismatch suppresses host counts and campaign sources in the summary", async () => {
    enable();
    mockReads();
    const report = await data();
    report.website.period = { ...period, timezone: "UTC" };
    const summary = buildReportSummary(report);
    expect(summary).toMatchObject({ goPageviews: null, goVisitors: null });
    expect(
      summary.goDetails!.hosts.every(
        h => h.pageviews === null && h.visitors === null
      )
    ).toBe(true);
    expect(summary.goDetails!.sourceStatus).toBe("unavailable");
  });
  it("saved historical v2 inputs without optional fields keep legacy behavior and require no migration", async () => {
    mockReads();
    const report = await data();
    delete report.website.go.hosts;
    delete report.website.go.sources;
    report.website.go.status = "available";
    report.website.go.stats = zero;
    const original = JSON.stringify(report);
    const summary = buildReportSummary(report);
    expect(summary).not.toHaveProperty("goDetails");
    expect(summary).toMatchObject({
      reportVersion: REPORT_VERSION,
      goPageviews: 0,
      goVisitors: 0,
      totalReach: null,
    });
    const text = execFileSync("pdftotext", ["-layout", "-", "-"], {
      input: await generateWeeklyReport(
        report,
        buildPlainLanguageAnalysis(report)
      ),
      encoding: "utf8",
    });
    expect(text).toMatch(/Go webpage recorded visits\s+0/);
    expect(
      buildWeeklyReportEmail(period.startDate, period.endDate, summary)
    ).toContain("Go webpage recorded visitors (Umami)");
    expect(JSON.stringify(report)).toBe(original);
  });
});
