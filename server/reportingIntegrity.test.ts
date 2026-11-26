import { afterEach, describe, expect, it, vi } from "vitest";
import { makeReportPeriod, isSelectedPeriodMetric, metricText, REPORT_VERSION, type FullAnalyticsData, type MetricObservation } from "./reportingModel";
import { buildPlainLanguageAnalysis, buildReportSummary, parseReportRequest, servingRevision } from "./reportingSummary";

function fixture(): FullAnalyticsData {
  const period = makeReportPeriod(7, new Date("2026-11-26T18:00:00Z"));
  const empty = { pageviews: null, visitors: null, visits: null, bounces: null, totaltime: null };
  return { weekStart: period.startDate, weekEnd: period.endDate, period, reportVersion: REPORT_VERSION,
    social: { platforms: [], period, fetchedAt: "2026-11-26T18:00:00Z", warnings: [] },
    website: { stats: empty, topPages: [], referrers: [], socialReferrals: {}, fetchedAt: "2026-11-26T18:00:00Z", period, status: "unavailable", warnings: ["TEST FIXTURE: mocked failed read"], scope: "TEST FIXTURE", go: { stats: empty, status: "unavailable", scope: "TEST FIXTURE", warnings: [] } },
  };
}
function observation(overrides: Partial<MetricObservation> = {}): MetricObservation {
  return { key: "views", label: "Views", value: 0, status: "available", scope: "selected_period", periodStart: "2026-11-19", periodEnd: "2026-11-25", timezone: "Etc/GMT+5", asOf: "2026-11-26T18:00:00Z", source: "offline test fixture", note: "TEST FIXTURE; not native evidence", ...overrides };
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
describe("date and evidence integrity", () => {
  it("uses seven complete Manitoba days, not an eight-date rolling interval", () => {
    expect(makeReportPeriod(7, new Date("2026-11-30T11:00:00Z"))).toMatchObject({ startDate: "2026-11-23", endDate: "2026-11-29", days: 7, startAt: Date.parse("2026-11-23T05:00:00Z"), endAt: Date.parse("2026-11-30T05:00:00Z") });
  });
  it("handles the Manitoba midnight boundary and year rollover", () => {
    expect(makeReportPeriod(1, new Date("2027-01-01T04:59:59Z"))).toMatchObject({ startDate: "2026-12-30", endDate: "2026-12-30" });
    expect(makeReportPeriod(1, new Date("2027-01-01T05:00:00Z"))).toMatchObject({ startDate: "2026-12-31", endDate: "2026-12-31" });
  });
  it("honours an explicitly chosen inclusive range", () => {
    expect(makeReportPeriod({ startDate: "2026-11-09", endDate: "2026-11-16" }, new Date("2026-11-26T18:00:00Z"))).toMatchObject({ startDate: "2026-11-09", endDate: "2026-11-16", days: 8 });
  });
  it.each([0, 91, 1.5, NaN, Infinity])("rejects invalid days before any request: %s", days => { expect(() => makeReportPeriod(days)).toThrow(); });
  it("rejects impossible, incomplete, reversed and current-day ranges", () => {
    const now = new Date("2026-11-26T18:00:00Z");
    for (const input of [{ startDate: "2026-02-30", endDate: "2026-03-01" }, { startDate: "2026-11-01" }, { startDate: "2026-11-21", endDate: "2026-11-20" }, { startDate: "2026-11-25", endDate: "2026-11-26" }]) expect(() => makeReportPeriod(input, now)).toThrow();
  });
  it("keeps legacy n8n numeric strings but rejects boolean and empty-day coercion", () => {
    expect(parseReportRequest({ days: "7" }).days).toBe(7);
    for (const days of [true, "", "7x", null]) expect(() => parseReportRequest({ days })).toThrow();
  });
  it("keeps measured zero but refuses missing, stale, mismatched or account metrics", () => {
    const period = fixture().period;
    expect(isSelectedPeriodMetric(observation(), period)).toBe(true);
    expect(metricText(observation())).toBe("0");
    for (const overrides of [{ value: null }, { status: "stale" as const }, { scope: "account_total" as const }, { periodEnd: "2026-11-24" }, { value: NaN }]) expect(isSelectedPeriodMetric(observation(overrides), period)).toBe(false);
    expect(metricText(observation({ value: null, status: "missing" }))).toBe("Unavailable");
  });
  it("does not manufacture mixed totals or turn unavailable Go figures into zero", () => {
    const data = fixture();
    const summary = buildReportSummary(data);
    expect(summary).toMatchObject({ totalReach: null, totalImpressions: null, socialReferrals: null, websiteVisitors: null, goPageviews: null });
    const analysis = buildPlainLanguageAnalysis(data, summary);
    expect(analysis).toContain("does not prove zero visitors or failed marketing");
    expect(analysis).not.toMatch(/new followers|engagement rate|zero engagement/i);
  });
  it("distinguishes explicitly measured Go zero from unmeasured visitors", () => {
    const data = fixture();
    data.website.go = { status: "available", stats: { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 }, scope: "offline TEST FIXTURE", warnings: [] };
    expect(buildReportSummary(data).goPageviews).toBe(0);
    expect(buildPlainLanguageAnalysis(data)).toContain("recorded 0 Go-page views");
  });
  it("does not certify partial or mismatched website counters", () => {
    const data = fixture();
    data.website.status = "partial";
    data.website.stats.visitors = 8;
    data.website.go.status = "partial";
    data.website.go.stats.pageviews = 4;
    expect(buildReportSummary(data)).toMatchObject({ websiteVisitors: null, goPageviews: null });
    data.website.status = "available";
    data.website.go.status = "available";
    data.website.period = { ...data.period, timezone: "UTC" };
    expect(buildReportSummary(data)).toMatchObject({ websiteVisitors: null, goPageviews: null });
  });
  it("does not expose arbitrary environment content as a serving revision", () => {
    vi.stubEnv("RAILWAY_GIT_COMMIT_SHA", "secret-or-invalid-value");
    expect(servingRevision()).toBeNull();
    vi.stubEnv("RAILWAY_GIT_COMMIT_SHA", "a".repeat(40));
    expect(servingRevision()).toBe("a".repeat(40));
  });
});
