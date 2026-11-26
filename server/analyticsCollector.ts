/** Reporting-only normalization. Never retain raw provider/profile objects. */
import type {
  MetricObservation, MetricScope, MetricStatus, ReportPeriod,
  SocialAnalyticsResult, SocialPlatformMetrics, UmamiMetric, UmamiStats,
} from "./reportingModel";

export const SOCIAL_PLATFORMS = ["instagram", "tiktok", "linkedin", "facebook", "youtube", "pinterest"] as const;
const SNAPSHOT_KEYS = ["followers", "reach", "impressions", "likes", "comments", "shares", "saves", "profileViews"] as const;
const EXTRA_KEYS = ["views", "accounts_engaged", "total_interactions", "profile_links_taps", "engagement", "engagements", "pin_clicks", "outbound_clicks", "monthly_views", "watch_time_minutes", "average_view_duration_seconds"] as const;
const SOURCE = "Upload-Post profile analytics";
const SOURCES = new Set(["snapshot_deltas", "pinterest_analytics_api", "youtube_analytics_api", "instagram_insights_api", "facebook_insights_api", "linkedin_analytics_api", "tiktok_api"]);
const REASONS: Record<string, string> = {
  not_supported: "Provider marks this metric not supported.", unsupported: "Provider marks this metric not supported.",
  quota: "Provider reports a quota limitation.", analytics_api_unavailable: "Native analytics API unavailable.",
  missing: "Provider marks this metric missing.", unavailable: "Provider marks this metric unavailable.",
  permission: "Provider reports insufficient permission.", permission_denied: "Provider reports insufficient permission.",
};
export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
/** An explicitly returned numeric zero is valid; null, booleans, strings and bad values are not. */
export function count(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}
function date(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const stamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value ? value : null;
}
function timestamp(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)) ? value : null;
}
function timezone(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 64 || !/^[A-Za-z0-9_+\-/]+$/.test(value)) return null;
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return value; } catch { return null; }
}
const DEFAULT_LABELS: Record<string, string> = {
  followers: "Followers", reach: "Unique Reach", impressions: "Impressions", views: "Views",
  likes: "Likes", comments: "Comments", shares: "Shares", saves: "Saves", profileViews: "Profile Views",
  accounts_engaged: "Accounts Engaged", total_interactions: "Total Interactions", profile_links_taps: "Profile Links Taps",
  engagement: "Engagements", engagements: "Engagements", pin_clicks: "Pin Clicks", outbound_clicks: "Outbound Clicks",
  monthly_views: "Monthly Views", watch_time_minutes: "Watch Time (min)", average_view_duration_seconds: "Avg. View Duration (s)",
};
// Only known native labels may leave the collector; arbitrary provider text is not evidence-safe.
const KNOWN_LABELS = new Set([...Object.values(DEFAULT_LABELS), "Video Views", "Page Impressions", "Content Impressions", "Subscribers", "Profile views", "Accounts engaged"]);
function label(platform: string, key: string, p: Record<string, unknown>): string {
  const native = record(p.metric_labels)[key];
  if (typeof native === "string" && KNOWN_LABELS.has(native)) return native;
  if (key === "impressions" && ["instagram", "youtube", "tiktok"].includes(platform)) return platform === "instagram" ? "Views" : "Video Views";
  if (key === "profileViews" && platform === "instagram") return "Accounts Engaged";
  if (key === "followers" && platform === "youtube") return "Subscribers";
  if (key === "impressions" && platform === "facebook") return "Page Impressions";
  if (key === "impressions" && platform === "linkedin") return "Content Impressions";
  return DEFAULT_LABELS[key] ?? key;
}
function reasonStatus(reason: unknown): MetricStatus | null {
  if (reason === "not_supported" || reason === "unsupported") return "unsupported";
  if (reason !== undefined && reason !== null && reason !== false) return "missing";
  return null;
}
function reasonNote(reason: unknown): string {
  return typeof reason === "string" && REASONS[reason] ? REASONS[reason] : "Provider supplied an availability limitation; arbitrary error text was omitted.";
}
function providerReason(p: Record<string, unknown>, key: string): unknown {
  const missing = record(p.missing);
  if (Object.hasOwn(missing, key)) return missing[key];
  if (Array.isArray(p.missing) && p.missing.includes(key)) return "missing";
  if (p.missing === true) return "missing";
  return undefined;
}
function scalar(platform: string, key: string, p: Record<string, unknown>, absent: boolean, failed: boolean): MetricObservation {
  const nativeValue = count(p[key]);
  let value = nativeValue;
  const reason = providerReason(p, key);
  const limitation = reasonStatus(reason);
  const stock = key === "followers";
  const lifetime = platform === "tiktok" && key === "likes";
  const scope: MetricScope = stock ? "account_total" : lifetime ? "lifetime" : "source_period";
  const periodStart = scope === "source_period" ? date(p.period_start) : null;
  const periodEnd = scope === "source_period" ? date(p.period_end) : null;
  let status: MetricStatus = scope === "source_period" ? "unknown_window" : "available";
  const notes: string[] = [];
  if (stock) notes.push("Current account stock, not new followers or selected-period growth.");
  else if (lifetime) notes.push("Cumulative profile likes, not new weekly likes or per-post engagement.");
  else notes.push("Native scalar snapshot; the selected report dates do not establish its window.");
  if (periodStart && periodEnd) notes.push("Source dates were echoed; timezone/boundary alignment is not certified by these scalar fields.");
  if (platform === "facebook" && count(p.period_days) !== null) notes.push(`Facebook provider window: ${p.period_days} days; days does not establish custom start/end dates or Manitoba alignment.`);
  if (key === "impressions" && ["instagram", "youtube", "tiktok"].includes(platform)) notes.push("Compatibility impressions field is a views alias, not native thumbnail/content impressions.");
  if (key === "profileViews" && platform === "instagram") notes.push("Accounts engaged, not profile visits.");
  if (key === "profile_links_taps") notes.push("Native profile action/button taps; not a universal external website/bio tap count.");
  if (key === "pin_clicks") notes.push("Native Pin clicks/closeup actions; not off-Pinterest outbound visits.");
  if (key === "outbound_clicks") notes.push("Native outbound actions, not observed website arrivals or unique website visitors.");
  if (key === "monthly_views") notes.push("Native monthly-view measure; do not substitute analytics impressions or weekly views.");
  const advertised = Array.isArray(p.available_metrics) ? p.available_metrics : null;
  // Supplementary actual fields (e.g. Pinterest engagement) may not appear in available_metrics.
  if (advertised && !advertised.includes(key) && SNAPSHOT_KEYS.includes(key as typeof SNAPSHOT_KEYS[number]) && !limitation) {
    status = "missing"; value = null; notes.push("Not declared available by provider; numeric placeholders are not certified observations.");
  }
  if (nativeValue === null) { status = "missing"; value = null; notes.push("No finite nonnegative numeric field was supplied."); }
  if (limitation) {
    status = limitation; value = null; notes.push(reasonNote(reason));
    // A nonzero cached snapshot remains visible as stale, never as current quota-success.
    if (limitation === "missing" && p.stale === true && nativeValue !== null && nativeValue > 0) { status = "stale"; value = nativeValue; }
  } else if (p.stale === true && value !== null) { status = "stale"; notes.push("Provider explicitly marks this data stale."); }
  if (p.stale === true) notes.push(reasonNote(p.stale_reason ?? "analytics_api_unavailable"));
  if (absent || failed) { status = "unavailable"; value = null; notes.push("Platform analytics read unavailable."); }
  if (p.unsupported === true || p.status === "unsupported") { status = "unsupported"; value = null; }
  return { key, label: label(platform, key, p), value, status, scope, periodStart, periodEnd,
    timezone: timezone(p.timezone), asOf: timestamp(p.as_of),
    source: `${SOURCE}${typeof p.data_source === "string" && SOURCES.has(p.data_source) ? ` / ${p.data_source}` : ""}`, note: notes.join(" ") };
}

export interface ValidatedSeries { rows: Array<{ date: string; value: number }>; valid: boolean; note: string; }
/** Never repair duplicates, mixed date formats, negative counts, or gaps with invented zeros. */
export function validateDailySeries(raw: unknown): ValidatedSeries {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 366) return { rows: [], valid: false, note: "Daily series absent or invalid." };
  const seen = new Set<string>();
  const rows: ValidatedSeries["rows"] = [];
  for (const item of raw) {
    const p = record(item); const d = date(p.date); const n = count(p.value);
    if (d === null || n === null || seen.has(d)) return { rows: [], valid: false, note: "Daily series rejected: invalid/mixed dates, duplicate dates, or invalid values." };
    seen.add(d); rows.push({ date: d, value: n });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return { rows, valid: true, note: "Validated unique native daily values; no missing days were filled." };
}
function seriesMetric(platform: string, p: Record<string, unknown>, period: ReportPeriod, field: string, type: string, failed: boolean): { metric: MetricObservation; rows: ValidatedSeries["rows"] } {
  const checked = validateDailySeries(p[field]);
  const rows = checked.rows.filter(r => r.date >= period.startDate && r.date <= period.endDate);
  const complete = checked.valid && rows.length === period.days;
  const additive = type === "views" || type === "impressions";
  const snapshot = p.data_source === "snapshot_deltas";
  const nativeSources: Record<string, string> = { youtube: "youtube_analytics_api", pinterest: "pinterest_analytics_api", tiktok: "tiktok_api" };
  const sourceEstablished = (platform === "facebook" && field === "impressions_timeseries") || (typeof nativeSources[platform] === "string" && p.data_source === nativeSources[platform]);
  const zone = timezone(p.timezone);
  // Date-label coverage on an unknown/native calendar is not Manitoba time coverage.
  const aligned = zone === period.timezone || zone === "Etc/GMT+5";
  let status: MetricStatus = !checked.valid ? "missing" : !complete ? "partial" : !aligned || !sourceEstablished ? "unknown_window" : "available";
  let value: number | null = complete && additive && !snapshot ? rows.reduce((sum, r) => sum + r.value, 0) : null;
  if (value !== null && !Number.isFinite(value)) { value = null; status = "missing"; }
  if (!additive) status = complete ? "unsupported" : status;
  if (p.stale === true || snapshot) { status = "stale"; value = null; }
  const baseKey = type === "views" && !Object.hasOwn(p, "views") ? "impressions" : type;
  const limitation = reasonStatus(providerReason(p, baseKey));
  if (limitation) { status = limitation === "missing" && p.stale === true ? "stale" : limitation; value = null; }
  if (failed) { status = "unavailable"; value = null; }
  const metric: MetricObservation = {
    key: additive ? `weekly_${type}` : `${field}_selected_dates`, label: `${label(platform, type, p)} — daily series`, value, status,
    scope: complete && aligned && sourceEstablished && additive && !snapshot ? "selected_period" : "source_period",
    periodStart: rows[0]?.date ?? null, periodEnd: rows.at(-1)?.date ?? null, timezone: zone,
    asOf: timestamp(p.as_of), source: `${SOURCE} / ${field}${snapshot ? " / snapshot_deltas" : ""}`,
    note: `${checked.note} ${rows.length}/${period.days} selected date labels present. ${!aligned ? "Source calendar/timezone unknown or different; these date labels do not certify Manitoba-aligned complete days. " : ""}${!sourceEstablished ? "Native daily source/activity grain not established; source-period values cannot certify actual selected-period activity. " : ""}${!complete ? "No partial-period aggregate or zero imputation. " : ""}${!additive ? "Daily unique reach is not additive: no sum is reported as period unique people. " : ""}${snapshot ? "Snapshot deltas are not guaranteed actual native daily activity. " : ""}General reach_timeseries covers the provider's last 30 days; Facebook uses its days window.`,
  };
  return { metric, rows: checked.valid ? rows : [] };
}
export function normalizeSocialAnalytics(raw: unknown, period: ReportPeriod, fetchedAt: string, outage?: string): SocialAnalyticsResult {
  const root = record(raw);
  const platforms: SocialPlatformMetrics[] = SOCIAL_PLATFORMS.map(platform => {
    const p = record(root[platform]);
    const absent = !Object.hasOwn(root, platform) || Object.keys(p).length === 0;
    const failed = Boolean(outage) || p.success === false || p.error != null || p.status === "unavailable";
    const metrics = [...SNAPSHOT_KEYS, ...EXTRA_KEYS.filter(key => Object.hasOwn(p, key))].map(key => scalar(platform, key, p, absent, failed));
    const warnings: string[] = [];
    if (absent || failed) warnings.push(outage ?? "Platform analytics unavailable; no successful metric read.");
    if (p.stale === true) warnings.push("Provider marks data stale; fetchedAt is retrieval time, not metric freshness.");
    if (p.missing_reason != null) warnings.push(reasonNote(p.missing_reason));
    if (p.warnings != null || p.message != null) warnings.push("Provider supplied a warning; untrusted free text was omitted.");
    if (platform === "linkedin") warnings.push("Organization-page analytics only; provider-selected administered organization identity is not independently verified.");
    const knownType = p.metric_type;
    const supportedTypes: Record<string, string[]> = { instagram: ["reach"], facebook: ["reach"], linkedin: ["reach"], tiktok: ["views"], youtube: ["views"], pinterest: ["impressions"] };
    let timeseries: SocialPlatformMetrics["timeseries"] = [];
    if (typeof knownType === "string" && supportedTypes[platform].includes(knownType)) {
      const series = seriesMetric(platform, p, period, "reach_timeseries", knownType, absent || failed);
      metrics.push(series.metric); timeseries = series.rows;
    } else if (p.reach_timeseries != null) warnings.push("Daily series semantic label not established; series excluded.");
    if (platform === "facebook" && p.impressions_timeseries != null) metrics.push(seriesMetric(platform, p, period, "impressions_timeseries", "impressions", absent || failed).metric);
    if (platform === "tiktok" && Object.keys(record(p.period_totals)).length) {
      const totals = record(p.period_totals); const coverage = record(p.coverage);
      for (const key of ["views", "likes", "comments", "shares"] as const) {
        const m = scalar(platform, key, { ...p, [key]: totals[key], available_metrics: undefined, missing: undefined }, absent, failed);
        const incomplete = coverage.truncated === true || (count(coverage.posts_total) !== null && coverage.posts_counted !== coverage.posts_total);
        metrics.push({ ...m, key: `period_totals.${key}`, scope: "source_period", status: incomplete ? "partial" : m.status === "available" ? "unknown_window" : m.status,
          periodStart: null, periodEnd: null, note: `Distinct native period_totals field; not the scalar account/lifetime snapshot. Provider window_days: ${count(totals.window_days) ?? "unknown"}; exact dates/timezone not guaranteed.${incomplete ? " Provider post coverage is incomplete." : ""}` });
      }
    }
    const snapshots = Object.fromEntries(SNAPSHOT_KEYS.map(key => [key, metrics.find(m => m.key === key)?.value ?? null])) as Pick<SocialPlatformMetrics, typeof SNAPSHOT_KEYS[number]>;
    if (absent || failed) for (const key of SNAPSHOT_KEYS) snapshots[key] = null;
    return { platform, ...snapshots, timeseries, metrics, warnings, source: SOURCE, fetchedAt };
  });
  return { platforms, period, fetchedAt, warnings: outage ? [outage] : ["Native scalar snapshots are not selected-week totals. No mixed-platform reach/views headline sum is valid."] };
}

export const STAT_KEYS = ["pageviews", "visitors", "visits", "bounces", "totaltime"] as const;
export function emptyStats(): UmamiStats { return { pageviews: null, visitors: null, visits: null, bounces: null, totaltime: null }; }
export function normalizeUmamiStats(raw: unknown): UmamiStats {
  const p = record(raw);
  // Both documented flat numbers and Umami v2 { value, prev } responses are understood.
  return Object.fromEntries(STAT_KEYS.map(key => [key, count(typeof p[key] === "object" && p[key] !== null ? record(p[key]).value : p[key])])) as unknown as UmamiStats;
}
export function safePath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  const path = value.split(/[?#]/)[0];
  return path.length <= 250 && /^\/[A-Za-z0-9_./%\-]*$/.test(path) ? path : null;
}
export function safeReferrer(value: unknown): string | null {
  if (value === "") return ""; // Native direct/no-referrer bucket.
  if (typeof value !== "string" || value.length > 512) return null;
  try {
    const u = new URL(value.includes("://") ? value : `https://${value}`);
    if (u.username || u.password || !["https:", "http:"].includes(u.protocol)) return null;
    return /^[a-z0-9.-]+$/i.test(u.hostname) ? u.hostname.toLowerCase() : null;
  } catch { return null; }
}
export function normalizeRankedRows(raw: unknown, kind: "path" | "referrer", limit: number): { rows: UmamiMetric[]; valid: boolean } {
  if (!Array.isArray(raw)) return { rows: [], valid: false };
  const rows: UmamiMetric[] = [];
  let valid = raw.length <= limit;
  for (const item of raw.slice(0, limit)) {
    const r = record(item); const x = kind === "path" ? safePath(r.x) : safeReferrer(r.x); const y = count(r.y);
    if (x === null || y === null) { valid = false; continue; }
    const existing = rows.find(row => row.x === x);
    if (existing) existing.y += y; else rows.push({ x, y });
  }
  return { rows: rows.filter(row => Number.isFinite(row.y)), valid };
}
export const SOCIAL_REFERRER_DOMAINS: Record<string, string[]> = {
  instagram: ["instagram.com"], facebook: ["facebook.com", "fb.com"], linkedin: ["linkedin.com", "lnkd.in"],
  youtube: ["youtube.com", "youtu.be"], tiktok: ["tiktok.com"], pinterest: ["pinterest.com", "pin.it"],
};
export function socialReferralCounts(rows: UmamiMetric[], observedZeroTraffic: boolean): Record<string, number | null> {
  return Object.fromEntries(Object.entries(SOCIAL_REFERRER_DOMAINS).map(([platform, domains]) => {
    const matches = rows.filter(row => domains.some(domain => row.x === domain || row.x.endsWith(`.${domain}`)));
    const sum = matches.reduce((sum, row) => sum + row.y, 0);
    return [platform, matches.length && Number.isFinite(sum) ? sum : observedZeroTraffic ? 0 : null];
  }));
}
/** Only event pageviews are safely additive across separately queried hosts. Unique visitors are not. */
export function combineHostStats(stats: UmamiStats[]): UmamiStats {
  const result = emptyStats();
  if (stats.every(s => s.pageviews !== null)) {
    const sum = stats.reduce((n, s) => n + s.pageviews!, 0);
    result.pageviews = Number.isFinite(sum) ? sum : null;
    if (sum === 0 && stats.every(s => STAT_KEYS.every(key => s[key] === 0))) return { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 };
  }
  return result;
}
