import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./_core/env", () => ({ ENV: {
  uploadPostApiKey: "mock-social-credential", facebookPageId: "mock-page",
  umamiEndpoint: "https://mock-analytics.invalid", umamiWebsiteId: "mock-website",
  forgeApiKey: "mock-website-credential",
} }));
vi.mock("./umamiGoConfig", () => ({ umamiGoConfig: () => ({ readApiKey: null, scopeVerified: false, sourceScopeVerified: false }) }));
import {
  combineHostStats, count, normalizeRankedRows, normalizeSocialAnalytics,
  normalizeUmamiStats, safeReferrer, socialReferralCounts, validateDailySeries,
} from "./analyticsCollector";
import { fetchFullAnalytics, fetchSocialAnalytics, fetchWebsiteAnalytics } from "./analytics";
import { isSelectedPeriodMetric, makeReportPeriod, type MetricObservation } from "./reportingModel";
const NOW = new Date("2026-11-26T18:00:00Z");
const PERIOD = makeReportPeriod(7, NOW);
const ASOF = "2026-11-25T22:15:00Z";
function daily(value = 1) {
  return Array.from({ length: 7 }, (_, i) => ({ date: `2026-11-${19 + i}`, value }));
}
function platform(name: string, payload: unknown) {
  return normalizeSocialAnalytics({ [name]: payload }, PERIOD, NOW.toISOString()).platforms.find(p => p.platform === name)!;
}
function metric(name: string, payload: unknown, key: string): MetricObservation {
  return platform(name, payload).metrics.find(m => m.key === key)!;
}
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
const ZERO = { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 };
const POSITIVE = { pageviews: 4, visitors: 3, visits: 3, bounces: 1, totaltime: 9 };
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("complete report periods used by the collector", () => {
  it("defaults to seven complete Manitoba UTC-5 dates and exclusive UTC end", () => {
    const p = makeReportPeriod(undefined, NOW);
    expect(p.startDate).toBe("2026-11-19"); expect(p.endDate).toBe("2026-11-25"); expect(p.days).toBe(7);
    expect(new Date(p.startAt).toISOString()).toBe("2026-11-19T05:00:00.000Z");
    expect(new Date(p.endAt).toISOString()).toBe("2026-11-26T05:00:00.000Z");
  });
  it("uses local rather than UTC today at the midnight boundary", () => {
    expect(makeReportPeriod(1, new Date("2026-11-26T04:59:59Z")).endDate).toBe("2026-11-24");
  });
  it("supports explicit historical inclusive dates", () => {
    const p = makeReportPeriod({ startDate: "2026-11-09", endDate: "2026-11-16" }, NOW);
    expect(p.days).toBe(8); expect(p.endDate).toBe("2026-11-16");
  });
  it.each([0, -1, 1.5, 91, NaN])("rejects invalid numeric days %s", days => expect(() => makeReportPeriod(days, NOW)).toThrow());
  it("rejects partial, invalid, reversed, and current-day requests", () => {
    for (const request of [{ startDate: "2026-11-09" }, { startDate: "2026-02-30", endDate: "2026-03-01" }, { startDate: "2026-11-16", endDate: "2026-11-09" }, { startDate: "2026-11-25", endDate: "2026-11-26" }]) expect(() => makeReportPeriod(request, NOW)).toThrow();
  });
});

describe("native scalar observations", () => {
  it("preserves actual numeric zero versus missing null", () => {
    const p = platform("instagram", { followers: 0, likes: 0, as_of: ASOF });
    expect(p.followers).toBe(0); expect(p.likes).toBe(0); expect(p.comments).toBeNull();
    expect(p.metrics.find(m => m.key === "followers")).toMatchObject({ status: "available", value: 0, scope: "account_total", asOf: ASOF });
    expect(p.metrics.find(m => m.key === "likes")).toMatchObject({ status: "unknown_window", value: 0, scope: "source_period" });
    expect(p.metrics.find(m => m.key === "comments")).toMatchObject({ status: "missing", value: null });
  });
  it.each([NaN, Infinity, -Infinity, -1, "0", "12", null, true, {}, undefined])("does not coerce invalid count %s", value => expect(count(value)).toBeNull());
  it("keeps Instagram views alias and accounts-engaged meanings", () => {
    const p = platform("instagram", { impressions: 127, profileViews: 1, profile_links_taps: 0, as_of: ASOF });
    expect(p.metrics.find(m => m.key === "impressions")).toMatchObject({ label: "Views", value: 127, status: "unknown_window" });
    expect(p.metrics.find(m => m.key === "profileViews")).toMatchObject({ label: "Accounts Engaged", value: 1 });
    expect(p.metrics.find(m => m.key === "profile_links_taps")?.note).toMatch(/not a universal external/);
    expect(p.metrics.every(m => !isSelectedPeriodMetric(m, PERIOD))).toBe(true);
  });
  it("keeps TikTok cumulative likes distinct from period_totals", () => {
    const p = platform("tiktok", { likes: 22, impressions: 5, period_totals: { window_days: 30, likes: 0, views: 1 }, coverage: { posts_total: 9, posts_counted: 9, truncated: false } });
    expect(p.metrics.find(m => m.key === "likes")).toMatchObject({ value: 22, scope: "lifetime", status: "available" });
    expect(p.metrics.find(m => m.key === "period_totals.likes")).toMatchObject({ value: 0, scope: "source_period", status: "unknown_window" });
    expect(p.metrics.find(m => m.key === "impressions")?.label).toBe("Video Views");
  });
  it("marks truncated TikTok period coverage partial", () => {
    expect(metric("tiktok", { period_totals: { likes: 0 }, coverage: { truncated: true } }, "period_totals.likes")).toMatchObject({ status: "partial", value: 0 });
  });
  it("preserves unsupported/missing flags, nonzero quota-stale snapshot, and no freshness fabrication", () => {
    const p = platform("youtube", { followers: 4, impressions: 3068, likes: 0, reach: 0, stale: true, data_source: "snapshot_deltas", missing_reason: "quota", missing: { reach: "not_supported", impressions: "quota", likes: "quota" }, as_of: null });
    expect(p.impressions).toBe(3068); expect(p.reach).toBeNull(); expect(p.likes).toBeNull();
    expect(p.metrics.find(m => m.key === "reach")).toMatchObject({ status: "unsupported", value: null });
    expect(p.metrics.find(m => m.key === "impressions")).toMatchObject({ label: "Video Views", status: "stale", value: 3068, asOf: null });
    expect(p.metrics.find(m => m.key === "likes")).toMatchObject({ status: "missing", value: null });
    expect(p.warnings.join(" ")).toMatch(/quota/);
  });
  it("does not certify numeric placeholders outside available_metrics", () => {
    expect(metric("linkedin", { comments: 8, available_metrics: ["followers", "reach", "impressions"] }, "comments")).toMatchObject({ value: null, status: "missing" });
  });
  it("preserves Pinterest engagement, clicks, saves and monthly views separately", () => {
    const p = platform("pinterest", { impressions: 2976, saves: 10, engagement: 115, pin_clicks: 105, outbound_clicks: 0, monthly_views: 3054, available_metrics: ["impressions", "saves", "pin_clicks", "outbound_clicks"] });
    expect(p.metrics.find(m => m.key === "engagement")).toMatchObject({ value: 115, label: "Engagements" });
    expect(p.metrics.find(m => m.key === "outbound_clicks")).toMatchObject({ value: 0, label: "Outbound Clicks", status: "unknown_window" });
    expect(p.metrics.find(m => m.key === "pin_clicks")?.note).toMatch(/not off-Pinterest/);
    expect(p.metrics.find(m => m.key === "monthly_views")).toMatchObject({ value: 3054, label: "Monthly Views" });
  });
  it("cannot date-certify Facebook scalar headers from days alone", () => {
    const m = metric("facebook", { impressions: 50, period_days: 7 }, "impressions");
    expect(m).toMatchObject({ status: "unknown_window", scope: "source_period", periodStart: null, periodEnd: null });
    expect(m.note).toMatch(/Facebook provider window: 7 days/);
  });
  it("does not leak arbitrary labels, warnings, profile objects, URLs, or tokens", () => {
    const raw = { followers: 1, likes: 1, metric_labels: { likes: "secret-credential https://private.invalid" }, data_source: "secret-credential", warnings: ["secret-credential"], as_of: "secret-credential", profile: { token: "secret-credential" } };
    expect(JSON.stringify(platform("instagram", raw))).not.toContain("secret-credential");
  });
});

describe("daily series integrity and source calendar", () => {
  it("keeps complete additive values on unknown native calendar but never certifies Manitoba", () => {
    const m = metric("pinterest", { metric_type: "impressions", reach_timeseries: daily(2), as_of: ASOF }, "weekly_impressions");
    expect(m).toMatchObject({ value: 14, status: "unknown_window", scope: "source_period", timezone: null, periodStart: PERIOD.startDate, periodEnd: PERIOD.endDate, asOf: ASOF });
    expect(m.note).toMatch(/do not certify Manitoba/); expect(isSelectedPeriodMetric(m, PERIOD)).toBe(false);
  });
  it("certifies complete additive views only with explicit aligned calendar and actual native source", () => {
    const m = metric("tiktok", { metric_type: "views", data_source: "tiktok_api", reach_timeseries: daily(2), timezone: "Etc/GMT+5", as_of: ASOF }, "weekly_views");
    expect(m).toMatchObject({ value: 14, status: "available", scope: "selected_period" });
    expect(isSelectedPeriodMetric(m, PERIOD)).toBe(true);
  });
  it("retains source-period totals but cannot certify aligned dates without actual native provenance", () => {
    const m = metric("tiktok", { metric_type: "views", reach_timeseries: daily(2), timezone: "Etc/GMT+5" }, "weekly_views");
    expect(m).toMatchObject({ value: 14, status: "unknown_window", scope: "source_period" });
    expect(m.note).toMatch(/source\/activity grain not established/);
  });
  it("does not replace native scalar snapshot with selected daily sum", () => {
    const p = platform("pinterest", { impressions: 2976, metric_type: "impressions", reach_timeseries: daily(2) });
    expect(p.impressions).toBe(2976); expect(p.metrics.find(m => m.key === "weekly_impressions")?.value).toBe(14);
  });
  it("never sums unique daily reach into period people", () => {
    const p = platform("instagram", { metric_type: "reach", reach_timeseries: daily(2), timezone: "Etc/GMT+5" });
    expect(p.timeseries).toEqual(daily(2));
    const m = p.metrics.find(m => m.key === "reach_timeseries_selected_dates")!;
    expect(m.value).toBeNull(); expect(m.note).toMatch(/unique reach is not additive/);
  });
  it("filters future/current/source-tail dates and missing dates without zero-imputation", () => {
    const rows = [...daily().slice(0, 6), { date: "2026-11-26", value: 400 }];
    const p = platform("tiktok", { metric_type: "views", reach_timeseries: rows });
    expect(p.timeseries).toHaveLength(6); expect(p.timeseries.every(r => r.date < "2026-11-26")).toBe(true);
    expect(p.metrics.find(m => m.key === "weekly_views")).toMatchObject({ value: null, status: "partial" });
  });
  it.each([
    [...daily(), daily()[0]], [...daily().slice(0, 6), { date: "2026-11-25T00:00:00Z", value: 1 }],
    [{ date: "2026-02-30", value: 1 }], [{ date: "2026-11-20", value: -1 }],
    [{ date: "2026-11-20", value: NaN }], [{ date: "2026-11-20", value: Infinity }],
    [{ date: "2026-11-20", value: "0" }],
  ])("rejects duplicate/mixed/invalid series %#", raw => {
    expect(validateDailySeries(raw)).toMatchObject({ valid: false, rows: [] });
    const p = platform("tiktok", { metric_type: "views", reach_timeseries: raw });
    expect(p.timeseries).toEqual([]); expect(p.metrics.find(m => m.key === "weekly_views")?.value).toBeNull();
  });
  it("does not infer views from unknown-labelled or TikTok placeholder reach series", () => {
    for (const type of [undefined, "unknown", "reach", "impressions"]) {
      const p = platform("tiktok", { metric_type: type, reach_timeseries: daily(0) });
      expect(p.timeseries).toEqual([]); expect(p.metrics.find(m => m.key === "weekly_views")).toBeUndefined();
    }
  });
  it("rejects stale snapshot deltas as actual daily views even with complete dates", () => {
    const m = metric("youtube", { impressions: 3068, metric_type: "views", data_source: "snapshot_deltas", stale: true, reach_timeseries: daily(0), timezone: "Etc/GMT+5" }, "weekly_views");
    expect(m).toMatchObject({ value: null, status: "stale", scope: "source_period" });
  });
  it("does not certify a different known calendar", () => {
    const m = metric("pinterest", { metric_type: "impressions", reach_timeseries: daily(0), timezone: "UTC" }, "weekly_impressions");
    expect(m).toMatchObject({ value: 0, status: "unknown_window", scope: "source_period", timezone: "UTC" });
  });
  it("preserves Facebook actual impressions series separately from unique reach", () => {
    const p = platform("facebook", { metric_type: "reach", reach_timeseries: daily(3), impressions_timeseries: daily(4), period_days: 7 });
    expect(p.metrics.find(m => m.key === "weekly_impressions")).toMatchObject({ value: 28, status: "unknown_window" });
    expect(p.metrics.find(m => m.key === "reach_timeseries_selected_dates")?.value).toBeNull();
  });
});

describe("website normalization and scope", () => {
  it("parses flat and documented nested stats with available zero", () => {
    expect(normalizeUmamiStats(ZERO)).toEqual(ZERO);
    expect(normalizeUmamiStats({ pageviews: { value: 0, prev: 9 }, visitors: { value: 2, prev: 0 } })).toMatchObject({ pageviews: 0, visitors: 2, visits: null });
    expect(normalizeUmamiStats(null)).toMatchObject({ pageviews: null, visitors: null });
  });
  it("does not fabricate deduplicated visitor totals across hosts", () => {
    expect(combineHostStats([POSITIVE, POSITIVE])).toMatchObject({ pageviews: 8, visitors: null, visits: null, bounces: null, totaltime: null });
    expect(combineHostStats([ZERO, ZERO])).toEqual(ZERO);
    expect(combineHostStats([ZERO, normalizeUmamiStats(null)]).pageviews).toBeNull();
  });
  it("normalizes exact referrer domains, excludes spoof suffixes and strips queries/credentials", () => {
    expect(safeReferrer("https://l.instagram.com/path?token=private")).toBe("l.instagram.com");
    expect(safeReferrer("https://private:credential@instagram.com")).toBeNull();
    expect(socialReferralCounts([{ x: "instagram.com.evil.invalid", y: 5 }, { x: "l.instagram.com", y: 2 }], false)).toMatchObject({ instagram: 2, facebook: null });
    expect(normalizeRankedRows([{ x: "/go?token=private", y: 1 }], "path", 10).rows).toEqual([{ x: "/go", y: 1 }]);
  });
  it("uses null for absent referral buckets in partial ranked lists", () => {
    expect(socialReferralCounts([], false)).toMatchObject({ instagram: null, tiktok: null });
    expect(socialReferralCounts([{ x: "instagram.com", y: 0 }], false).instagram).toBe(0);
  });
  it("marks invalid ranked rows partial and never string-concatenates counts", () => {
    expect(normalizeRankedRows([{ x: "instagram.com", y: "3" }, { x: "facebook.com", y: 1 }], "referrer", 50)).toEqual({ valid: false, rows: [{ x: "facebook.com", y: 1 }] });
  });
});

describe("mocked-only read orchestration", () => {
  it("sends Facebook days but never assumes scalar headers are selected dates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ facebook: { impressions: 50, period_days: 7 } }));
    vi.stubGlobal("fetch", fetchMock);
    const data = await fetchSocialAnalytics(7);
    const u = new URL(fetchMock.mock.calls[0][0]);
    expect(u.searchParams.get("days")).toBe("7"); expect(u.searchParams.get("platforms")?.split(",")).toHaveLength(6);
    expect(data.platforms.find(p => p.platform === "facebook")?.metrics.find(m => m.key === "impressions")?.status).toBe("unknown_window");
  });
  it("social outage produces six unavailable platforms without retry or sensitive bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "mock-social-credential https://private.invalid" }, 429));
    vi.stubGlobal("fetch", fetchMock);
    const data = await fetchSocialAnalytics(7);
    expect(fetchMock).toHaveBeenCalledTimes(1); expect(data.platforms).toHaveLength(6);
    expect(data.platforms.every(p => p.followers === null && p.metrics.every(m => m.status === "unavailable"))).toBe(true);
    expect(JSON.stringify(data)).not.toMatch(/mock-social-credential|private.invalid/); expect(data.warnings.join()).toMatch(/429/);
  });
  it("bounds hung fetches with timeout and no retry storm", async () => {
    const fetchMock = vi.fn().mockImplementation(() => new Promise(() => {})); vi.stubGlobal("fetch", fetchMock);
    const pending = fetchSocialAnalytics(7);
    await vi.advanceTimersByTimeAsync(10_001);
    const data = await pending; expect(data.warnings.join()).toMatch(/timed out/); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("website 401 returns unavailable nulls rather than fake zeros; no unauthenticated retry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "mock-website-credential https://private.invalid" }, 401));
    vi.stubGlobal("fetch", fetchMock);
    const data = await fetchWebsiteAnalytics(7);
    expect(fetchMock).toHaveBeenCalledTimes(12); expect(data.status).toBe("unavailable"); expect(data.go.status).toBe("unavailable");
    expect(data.stats.pageviews).toBeNull(); expect(data.go.stats.visitors).toBeNull();
    expect(Object.values(data.socialReferrals).every(v => v === null)).toBe(true);
    expect(data.warnings.join()).toMatch(/401/); expect(JSON.stringify(data)).not.toMatch(/mock-website-credential|private.invalid/);
    expect(fetchMock.mock.calls.every(([, init]) => init.headers.Authorization === "Bearer mock-website-credential")).toBe(true);
  });
  it("queries current documented host/path scopes and exact complete-day range separately", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve(jsonResponse(new URL(url).pathname.endsWith("/stats") ? ZERO : [])));
    vi.stubGlobal("fetch", fetchMock); const data = await fetchWebsiteAnalytics(7);
    const urls = fetchMock.mock.calls.map(([url]) => new URL(url));
    expect(urls).toHaveLength(12);
    expect(new Set(urls.map(u => u.searchParams.get("hostname")))).toEqual(new Set(["app.yfitai.com", "www.yfitai.com", "yfitai.com"]));
    expect(urls.filter(u => u.searchParams.get("path") === "/go")).toHaveLength(3);
    for (const u of urls) {
      expect(u.searchParams.get("startAt")).toBe(String(PERIOD.startAt)); expect(u.searchParams.get("endAt")).toBe(String(PERIOD.endAt - 1));
      expect(u.searchParams.get("timezone")).toBe("Etc/GMT+5"); expect(u.searchParams.get("eventType")).toBe("1"); expect(u.searchParams.get("match")).toBe("all");
      expect(u.searchParams.has("host")).toBe(false); expect(u.searchParams.has("url")).toBe(false);
    }
    expect(urls.filter(u => u.searchParams.get("type") === "path")).toHaveLength(3);
    expect(data.stats).toEqual(ZERO); expect(Object.values(data.go.stats).every(v => v === null)).toBe(true);
    expect(data.go.hosts?.every(h => h.stats.pageviews === 0 && h.stats.visitors === 0 && h.status === "partial")).toBe(true);
    expect(data.status).toBe("partial"); expect(data.go.status).toBe("partial");
    expect(data.go.warnings.join()).toMatch(/acceptance.*unverified/);
    expect(Object.values(data.socialReferrals).every(v => v === null)).toBe(true);
  });
  it("successful metrics and failed stats remain partial without pretending zero visitors", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const u = new URL(url);
      return Promise.resolve(u.pathname.endsWith("/stats") ? jsonResponse({}, 401) : jsonResponse(u.searchParams.get("type") === "referrer" ? [{ x: "https://instagram.com?token=private", y: 3 }] : []));
    }); vi.stubGlobal("fetch", fetchMock);
    const data = await fetchWebsiteAnalytics(7);
    expect(data.status).toBe("partial"); expect(data.stats.visitors).toBeNull(); expect(data.socialReferrals.instagram).toBe(9); expect(data.socialReferrals.facebook).toBeNull();
    expect(JSON.stringify(data)).not.toContain("token=private");
  });
  it("preserves host counts without adding cross-host unique visitors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => Promise.resolve(jsonResponse(new URL(url).pathname.endsWith("/stats") ? POSITIVE : []))));
    const data = await fetchWebsiteAnalytics(7);
    expect(data.stats.pageviews).toBe(12); expect(data.stats.visitors).toBeNull(); expect(data.go.stats.visitors).toBeNull();
    expect(data.go.warnings.join()).toMatch(/app.yfitai.com: pageviews=4, unique visitors=3/);
  });
  it("full collection shares one explicit historical period and version through social outage", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => Promise.resolve(jsonResponse({}, url.includes("upload-post") ? 503 : 401))));
    const data = await fetchFullAnalytics({ startDate: "2026-11-09", endDate: "2026-11-16" });
    expect(data.weekStart).toBe("2026-11-09"); expect(data.weekEnd).toBe("2026-11-16"); expect(data.period.days).toBe(8);
    expect(data.period).toEqual(data.social.period); expect(data.period).toEqual(data.website.period); expect(data.reportVersion).toBe("report-integrity-v2");
    expect(data.social.platforms).toHaveLength(6); expect(data.website.status).toBe("unavailable");
  });
});
