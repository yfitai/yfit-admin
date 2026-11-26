/** Reporting-only collection. No publishing, tracking, database writes, or auth changes. */
import { ENV } from "./_core/env";
import {
  REPORT_VERSION, makeReportPeriod,
  type FullAnalyticsData, type ReportPeriod, type ReportRequest,
  type SocialAnalyticsResult, type WebsiteAnalyticsResult, type UmamiStats,
} from "./reportingModel";
import {
  SOCIAL_PLATFORMS, STAT_KEYS, combineHostStats, emptyStats, normalizeRankedRows,
  normalizeSocialAnalytics, normalizeUmamiStats, socialReferralCounts,
} from "./analyticsCollector";

// Existing callers keep importing these types from analytics.ts; contract has one owner.
export type {
  FullAnalyticsData, MetricObservation, MetricScope, MetricStatus, ReportPeriod, ReportRequest,
  SocialAnalyticsResult, SocialPlatformMetrics, UmamiMetric, UmamiStats, WebsiteAnalyticsResult,
} from "./reportingModel";
export { normalizeSocialAnalytics } from "./analyticsCollector";
export interface UmamiPageviews {
  pageviews: Array<{ x: string; y: number }>;
  sessions: Array<{ x: string; y: number }>;
}

const FETCH_TIMEOUT_MS = 10_000;
type ReadResult = { ok: true; data: unknown } | { ok: false; warning: string };
/** Never include request URLs, headers, provider bodies, or exception text in report evidence. */
async function readJson(url: string, headers: Record<string, string>, operation: string): Promise<ReadResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ReadResult>(resolve => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({ ok: false, warning: `${operation}: read timed out.` });
    }, FETCH_TIMEOUT_MS);
  });
  const request = (async (): Promise<ReadResult> => {
    try {
      const res = await fetch(url, { method: "GET", headers, signal: controller.signal, redirect: "error" });
      if (!res.ok) return { ok: false, warning: `${operation}: HTTP ${res.status}; metrics unavailable.` };
      return { ok: true, data: await res.json() };
    } catch {
      return { ok: false, warning: `${operation}: ${controller.signal.aborted ? "read timed out" : "read failed"}; metrics unavailable.` };
    }
  })();
  try { return await Promise.race([request, timeout]); } finally { if (timer) clearTimeout(timer); }
}

async function collectSocial(period: ReportPeriod): Promise<SocialAnalyticsResult> {
  const fetchedAt = new Date().toISOString();
  if (!ENV.uploadPostApiKey) return normalizeSocialAnalytics(null, period, fetchedAt, "Upload-Post read credential unavailable; no social metrics were fetched.");
  const url = new URL("https://api.upload-post.com/api/analytics/YFIT");
  url.searchParams.set("platforms", SOCIAL_PLATFORMS.join(","));
  url.searchParams.set("page_id", ENV.facebookPageId);
  // Official contract: days controls Facebook only. No universal/custom-date promise.
  url.searchParams.set("days", String(period.days));
  const result = await readJson(url.toString(), { Authorization: `Apikey ${ENV.uploadPostApiKey}` }, "Upload-Post analytics");
  return normalizeSocialAnalytics(result.ok ? result.data : null, period, new Date().toISOString(), result.ok ? undefined : result.warning);
}
export async function fetchSocialAnalytics(input: number | ReportRequest = 7): Promise<SocialAnalyticsResult> {
  return collectSocial(makeReportPeriod(input));
}

const HOSTS = ["app.yfitai.com", "www.yfitai.com", "yfitai.com"] as const;
/**
 * Current documented contract: hostname/path/type=path. Older Umami v2 uses
 * host/url and may silently strip newer filters. Do not certify filter acceptance
 * from HTTP 200 alone. No version probe, unauthenticated fallback or retry.
 * Reference: docs.umami.is/docs/api-reference/get-website-stats.
 */
async function umamiRead(period: ReportPeriod, host: string, kind: "stats" | "pages" | "referrers", go = false): Promise<ReadResult> {
  const operation = `Umami ${go ? "/go " : ""}${kind} (${host})`;
  if (!ENV.forgeApiKey) return { ok: false, warning: `${operation}: existing read credential unavailable.` };
  try {
    const endpoint = ENV.umamiEndpoint.replace(/\/$/, "");
    const url = new URL(`${endpoint}/api/websites/${encodeURIComponent(ENV.umamiWebsiteId)}/${kind === "stats" ? "stats" : "metrics"}`);
    const params: Record<string, string | number> = {
      startAt: period.startAt,
      // Umami SQL uses inclusive BETWEEN; report endAt is exclusive.
      endAt: period.endAt - 1,
      timezone: period.timezone, hostname: host, eventType: 1, match: "all",
    };
    if (go) params.path = "/go";
    if (kind !== "stats") { params.type = kind === "pages" ? "path" : "referrer"; params.limit = kind === "pages" ? 10 : 50; }
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    return await readJson(url.toString(), { Authorization: `Bearer ${ENV.forgeApiKey}` }, operation);
  } catch { return { ok: false, warning: `${operation}: endpoint configuration invalid; metrics unavailable.` }; }
}
function statsRead(result: ReadResult, warnings: string[], label: string): UmamiStats {
  if (!result.ok) { warnings.push(result.warning); return emptyStats(); }
  const stats = normalizeUmamiStats(result.data);
  if (STAT_KEYS.some(key => stats[key] === null)) warnings.push(`${label}: missing or invalid counters are unavailable, not zero.`);
  return stats;
}
function hasAny(stats: UmamiStats): boolean { return STAT_KEYS.some(key => stats[key] !== null); }
function zeroStats(stats: UmamiStats): boolean { return STAT_KEYS.every(key => stats[key] === 0); }
async function collectWebsite(period: ReportPeriod): Promise<WebsiteAnalyticsResult> {
  const hostReads = await Promise.all(HOSTS.map(async host => {
    const [stats, pages, referrers, go] = await Promise.all([
      umamiRead(period, host, "stats"), umamiRead(period, host, "pages"),
      umamiRead(period, host, "referrers"), umamiRead(period, host, "stats", true),
    ]);
    return { host, stats, pages, referrers, go };
  }));
  const warnings: string[] = [];
  const goWarnings: string[] = [];
  const hostStats = hostReads.map(r => statsRead(r.stats, warnings, `Umami stats (${r.host})`));
  const goHostStats = hostReads.map(r => statsRead(r.go, goWarnings, `Umami /go (${r.host})`));
  const stats = combineHostStats(hostStats);
  const goStats = combineHostStats(goHostStats);
  const pathRows = hostReads.map(r => {
    if (!r.pages.ok) { warnings.push(r.pages.warning); return { rows: [], valid: false }; }
    const parsed = normalizeRankedRows(r.pages.data, "path", 10);
    if (!parsed.valid) warnings.push(`Umami ranked pages (${r.host}): invalid rows omitted.`);
    return parsed;
  });
  const refRows = hostReads.map(r => {
    if (!r.referrers.ok) { warnings.push(r.referrers.warning); return { rows: [], valid: false }; }
    const parsed = normalizeRankedRows(r.referrers.data, "referrer", 50);
    if (!parsed.valid) warnings.push(`Umami referrers (${r.host}): invalid rows omitted.`);
    return parsed;
  });
  // Ranked lists remain partial even below the requested cap: provider limits/exhaustion are unverified.
  warnings.push("Referrers are ranked, limited native counts with unverified exhaustion/grain; observed social counts are partial lower bounds, absent domains are unknown, not zero visits. Referrers do not identify exact posts or outbound taps.");
  warnings.push("Documented hostname/path filter requests are implemented, but acceptance by the configured managed proxy is unverified; HTTP 200/zero alone cannot certify a scoped count.");
  goWarnings.push("Dedicated /go hostname/path requests are implemented, but managed-proxy filter acceptance and fresh real native success are unverified. Returned zero is not proof of zero actual /go arrivals.");
  const allReferrers = refRows.flatMap(r => r.rows);
  const socialReferrals = socialReferralCounts(allReferrers, false);
  const topPages = normalizeRankedRows(pathRows.flatMap(r => r.rows), "path", HOSTS.length * 10).rows.sort((a, b) => b.y - a.y).slice(0, 10);
  const referrers = normalizeRankedRows(allReferrers, "referrer", HOSTS.length * 50).rows
    .filter(r => r.x && r.x !== "yfitai.com" && !r.x.endsWith(".yfitai.com"))
    .sort((a, b) => b.y - a.y).slice(0, 10);
  if (stats.pageviews !== 0) warnings.push("Only pageviews are combined across hosts. Cross-host unique visitors, visits, bounces and duration are unavailable without a native deduplicated multi-host query.");
  if (goStats.pageviews !== 0) goWarnings.push("/go queried independently for each host and exact path, not inferred from top pages. Pageviews alone are additive; cross-host unique visitor/session aggregates are not certified.");
  // Preserve useful host-specific actual counters in allowlisted notes until shared contract exposes host details.
  for (let i = 0; i < HOSTS.length; i++) {
    if (hasAny(hostStats[i])) warnings.push(`Observed host ${HOSTS[i]}: pageviews=${hostStats[i].pageviews ?? "unavailable"}, unique visitors=${hostStats[i].visitors ?? "unavailable"}; selected period only, measured/consented traffic.`);
    if (hasAny(goHostStats[i])) goWarnings.push(`Observed /go host ${HOSTS[i]}: pageviews=${goHostStats[i].pageviews ?? "unavailable"}, unique visitors=${goHostStats[i].visitors ?? "unavailable"}; selected period only, measured/consented traffic.`);
  }
  const someWebsiteData = hostStats.some(hasAny) || pathRows.some(r => r.valid) || refRows.some(r => r.valid);
  return {
    stats, topPages, referrers, socialReferrals, period, fetchedAt: new Date().toISOString(),
    status: someWebsiteData ? "partial" : "unavailable", warnings,
    scope: "Measured/consented website traffic only; app.yfitai.com, www.yfitai.com and yfitai.com requested separately without redirect assumptions. Admin/other hosts intended excluded; managed-proxy filter acceptance unverified. Complete Manitoba UTC-5 days. Existing Umami read credential only; no auth fallback. Ranked pages/referrers are partial.",
    go: {
      stats: goStats, status: goHostStats.some(hasAny) ? "partial" : "unavailable",
      scope: "Exact /go path requested separately on app.yfitai.com, www.yfitai.com and yfitai.com without redirect assumptions in selected complete-day UTC-5 window; proxy filter acceptance unverified. Measured/consented arrivals, not native link taps or conversions.", warnings: goWarnings,
    },
  };
}
export async function fetchWebsiteAnalytics(input: number | ReportRequest = 7): Promise<WebsiteAnalyticsResult> {
  return collectWebsite(makeReportPeriod(input));
}
export async function fetchFullAnalytics(input: number | ReportRequest = 7): Promise<FullAnalyticsData> {
  // Resolve once so social and website cannot straddle Manitoba midnight with different periods.
  const period = makeReportPeriod(input);
  const [social, website] = await Promise.all([collectSocial(period), collectWebsite(period)]);
  return { weekStart: period.startDate, weekEnd: period.endDate, period, social, website, reportVersion: REPORT_VERSION };
}
