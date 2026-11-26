/** Reporting-only contract. Native metrics retain their labels, scope and availability. */
export type MetricStatus = "available" | "missing" | "unsupported" | "stale" | "partial" | "unknown_window" | "unavailable";
export type MetricScope = "selected_period" | "source_period" | "account_total" | "lifetime";
export interface ReportPeriod {
  startDate: string;
  endDate: string; // Inclusive, unlike endAt.
  startAt: number;
  endAt: number; // Exclusive.
  days: number;
  timezone: string;
  label: string;
}
export interface ReportRequest { days?: number; startDate?: string; endDate?: string; }
export interface MetricObservation {
  key: string;
  label: string;
  value: number | null;
  status: MetricStatus;
  scope: MetricScope;
  periodStart: string | null;
  periodEnd: string | null;
  timezone: string | null;
  asOf: string | null;
  source: string;
  note: string;
}
export interface SocialPlatformMetrics {
  platform: string;
  followers: number | null;
  reach: number | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  profileViews: number | null;
  timeseries: Array<{ date: string; value: number }>;
  metrics: MetricObservation[];
  warnings: string[];
  source: string;
  fetchedAt: string;
}
export interface SocialAnalyticsResult {
  platforms: SocialPlatformMetrics[];
  fetchedAt: string;
  period: ReportPeriod;
  warnings: string[];
}
export interface UmamiStats {
  pageviews: number | null;
  visitors: number | null;
  visits: number | null;
  bounces: number | null;
  totaltime: number | null;
}
export interface UmamiMetric { x: string; y: number; }
export const GO_HOSTS = ["app.yfitai.com", "www.yfitai.com", "yfitai.com"] as const;
export const GO_SOURCES = ["facebook", "instagram", "pinterest", "linkedin", "youtube", "tiktok", "direct", "unknown"] as const;
export type GoSource = typeof GO_SOURCES[number];
export type GoSourceCounts = Record<GoSource, number | null>;
export interface GoHostAnalytics {
  host: typeof GO_HOSTS[number];
  status: "available" | "partial" | "unavailable";
  scopeVerified: boolean;
  stats: UmamiStats;
  warnings: string[];
}
export interface GoSourceAnalytics {
  status: "available" | "partial" | "unavailable";
  scopeVerified: boolean;
  pageviews: GoSourceCounts;
  hosts: Array<{ host: typeof GO_HOSTS[number]; status: "available" | "partial" | "unavailable"; pageviews: GoSourceCounts }>;
  scope: string;
  warnings: string[];
}
export interface GoAnalytics {
  status: "available" | "partial" | "unavailable";
  stats: UmamiStats;
  scope: string;
  warnings: string[];
  // Optional additions preserve saved v2 fixtures. No cross-host native unique query is made.
  hosts?: GoHostAnalytics[];
  sources?: GoSourceAnalytics;
}
export interface WebsiteAnalyticsResult {
  stats: UmamiStats;
  topPages: UmamiMetric[];
  referrers: UmamiMetric[];
  socialReferrals: Record<string, number | null>;
  fetchedAt: string;
  period: ReportPeriod;
  status: "available" | "partial" | "unavailable";
  warnings: string[];
  scope: string;
  go: GoAnalytics;
}
export interface FullAnalyticsData {
  weekStart: string;
  weekEnd: string;
  period: ReportPeriod;
  social: SocialAnalyticsResult;
  website: WebsiteAnalyticsResult;
  reportVersion: string;
}
export interface ReportSummary {
  reportVersion: string;
  verifiedPlatforms: number;
  platformsTotal: number;
  websiteStatus: string;
  totalReach: null; // Different native definitions cannot form one unique audience.
  totalImpressions: null; // Views and thumbnail/Page impressions are not interchangeable.
  websiteVisitors: number | null;
  socialReferrals: number | null;
  goPageviews: number | null;
  goVisitors: number | null;
  coverageNote: string;
  goDetails?: {
    status: GoAnalytics["status"];
    hosts: Array<{ host: GoHostAnalytics["host"]; status: GoHostAnalytics["status"]; pageviews: number | null; visitors: number | null }>;
    sourceStatus: GoSourceAnalytics["status"];
    sourcePageviews: GoSourceCounts;
    sourceHosts: GoSourceAnalytics["hosts"];
    note: string;
  };
}
export const REPORT_VERSION = "report-integrity-v2";
const DAY = 86_400_000;
const MANITOBA_OFFSET = 5 * 60 * 60 * 1000;
function dateValue(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Use dates in YYYY-MM-DD format.");
  const stamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== value) throw new Error("The report date is not valid.");
  return stamp;
}
/** Existing numeric days requests remain supported; all outputs use complete Manitoba days. */
export function makeReportPeriod(input: number | ReportRequest = 7, now = new Date()): ReportPeriod {
  const request = typeof input === "number" ? { days: input } : input;
  if ((request.startDate === undefined) !== (request.endDate === undefined)) throw new Error("Choose both a start date and an end date.");
  const today = new Date(now.getTime() - MANITOBA_OFFSET).toISOString().slice(0, 10);
  let start: number;
  let end: number;
  if (request.startDate !== undefined && request.endDate !== undefined) {
    start = dateValue(request.startDate);
    end = dateValue(request.endDate);
  } else {
    const days = request.days ?? 7;
    if (!Number.isInteger(days) || days < 1 || days > 90) throw new Error("Choose a whole number of days from 1 to 90.");
    end = dateValue(today) - DAY;
    start = end - (days - 1) * DAY;
  }
  const days = (end - start) / DAY + 1;
  if (days < 1 || days > 90) throw new Error("Choose a date range of 1 to 90 days.");
  if (end >= dateValue(today)) throw new Error("Reports use completed days. Choose an end date before today.");
  const startDate = new Date(start).toISOString().slice(0, 10);
  const endDate = new Date(end).toISOString().slice(0, 10);
  return { startDate, endDate, startAt: start + MANITOBA_OFFSET, endAt: end + DAY + MANITOBA_OFFSET, days, timezone: "Etc/GMT+5", label: "Manitoba time (UTC-5); start and end dates included" };
}
export function isSelectedPeriodMetric(metric: MetricObservation, period: ReportPeriod): boolean {
  return metric.status === "available" && metric.scope === "selected_period" && metric.value !== null && Number.isFinite(metric.value) && metric.periodStart === period.startDate && metric.periodEnd === period.endDate;
}
export function metricText(metric: MetricObservation): string {
  if (metric.value === null) return "Unavailable";
  const value = metric.value.toLocaleString("en-CA", { maximumFractionDigits: 2 });
  if (metric.status === "available") return value;
  const labels: Record<MetricStatus, string> = { available: "", missing: "missing", unsupported: "not supported", stale: "stale", partial: "partial", unknown_window: "dates not supplied", unavailable: "unavailable" };
  return `${value} (${labels[metric.status]})`;
}
