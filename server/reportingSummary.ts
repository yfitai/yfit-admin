import { z } from "zod";
import { GO_HOSTS, isSelectedPeriodMetric, makeReportPeriod, type FullAnalyticsData, type ReportSummary } from "./reportingModel";
import { combinedGoStats, combineGoSources, completeGoStats, emptyGoSources, goCount } from "./goAnalytics";
import { goReportLines } from "./goReportPresentation";

export const reportRequestSchema = z.object({
  days: z.preprocess(value => typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value, z.number().int().min(1).max(90).default(7)),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(value => (value.startDate === undefined) === (value.endDate === undefined), { message: "Choose both a start date and an end date." });

export function parseReportRequest(value: unknown) {
  const request = reportRequestSchema.parse(value ?? {});
  makeReportPeriod(request); // Validate calendar dates and completed-day boundaries before any fetch.
  return request;
}

export function servingRevision(): string | null {
  const revision = process.env.RAILWAY_GIT_COMMIT_SHA;
  return revision && /^[a-f0-9]{7,40}$/i.test(revision) ? revision : null;
}

export function buildReportSummary(data: FullAnalyticsData): ReportSummary {
  const verifiedPlatforms = data.social.platforms.filter(platform => platform.metrics.some(metric =>
    ["views", "impressions", "weekly_views", "weekly_impressions"].includes(metric.key) && isSelectedPeriodMetric(metric, data.period)
  )).length;
  const websiteDatesMatch = data.website.period.startDate === data.period.startDate && data.website.period.endDate === data.period.endDate && data.website.period.startAt === data.period.startAt && data.website.period.endAt === data.period.endAt && data.website.period.timezone === data.period.timezone;
  const go = data.website.go;
  const completeHosts = go.hosts?.length === GO_HOSTS.length && GO_HOSTS.every(host => go.hosts!.filter(h => h.host === host).length === 1);
  const preparedPageviews = completeHosts && websiteDatesMatch ? combinedGoStats(go.hosts!).pageviews : null;
  const goDetails: ReportSummary["goDetails"] = go.hosts ? {
    status: preparedPageviews !== null ? "available" : websiteDatesMatch && go.hosts.some(h => h.status !== "unavailable") ? "partial" : "unavailable",
    hosts: GO_HOSTS.map(host => {
      const h = go.hosts!.find(h => h.host === host);
      const usable = websiteDatesMatch && h && h.status !== "unavailable";
      return { host, status: !usable ? "unavailable" : h.scopeVerified && h.status === "available" && completeGoStats(h.stats) ? "available" : "partial",
        pageviews: usable ? goCount(h.stats.pageviews) : null, visitors: usable ? goCount(h.stats.visitors) : null };
    }),
    sourceStatus: !websiteDatesMatch || !go.sources ? "unavailable" : go.sources.scopeVerified && go.sources.status === "available" && go.sources.hosts.length === GO_HOSTS.length && GO_HOSTS.every(host => go.sources!.hosts.filter(h => h.host === host && h.status === "available").length === 1) ? "available" : go.sources.status === "unavailable" ? "unavailable" : "partial",
    sourcePageviews: emptyGoSources(),
    sourceHosts: websiteDatesMatch && go.sources ? GO_HOSTS.map(host => {
      const h = go.sources!.hosts.find(h => h.host === host);
      return { host, status: !h || h.status === "unavailable" ? "unavailable" : go.sources!.scopeVerified && h.status === "available" ? "available" : "partial",
        pageviews: h && h.status !== "unavailable" ? Object.fromEntries(Object.keys(emptyGoSources()).map(source => [source, goCount(h.pageviews[source as keyof typeof h.pageviews])])) as typeof h.pageviews : emptyGoSources() };
    }) : [],
    note: "Exact /go; selected complete Manitoba days (UTC-5). Measured/consented traffic only. Native measured visitors are per host, may overlap, and are never summed across hosts. Campaign-source counts are pageviews, not social outbound clicks or unique people; do not add them to visitors. Direct requires an explicit direct tag; empty/other tags are Unknown/unattributed. Absent source buckets are unavailable, not zero.",
  } : undefined;
  if (goDetails && go.hosts?.some(h => !h.scopeVerified)) goDetails.note += " Prepared only: Go scope is unverified; returned successes remain context, not certified counts.";
  if (goDetails && !go.sources?.scopeVerified) goDetails.note += " Prepared only: UTM reads require the dedicated server read credential and both independent operator verification gates.";
  if (goDetails?.sourceStatus === "available") goDetails.sourcePageviews = combineGoSources(goDetails.sourceHosts);
  // Ranked domain-referrer rows are not a complete count of social clicks or unique visitors.
  return {
    reportVersion: data.reportVersion,
    verifiedPlatforms,
    platformsTotal: data.social.platforms.length,
    websiteStatus: data.website.status,
    totalReach: null,
    totalImpressions: null,
    websiteVisitors: data.website.status === "available" && websiteDatesMatch ? data.website.stats.visitors : null,
    socialReferrals: null,
    goPageviews: go.hosts ? preparedPageviews : go.status === "available" && websiteDatesMatch ? goCount(go.stats.pageviews) : null,
    goVisitors: go.hosts ? null : go.status === "available" && websiteDatesMatch ? goCount(go.stats.visitors) : null,
    coverageNote: `${verifiedPlatforms} of ${data.social.platforms.length} platforms have a verified views or impressions figure for the selected dates. Other numbers are labelled as source-period, account-total, partial, stale or unavailable. No mixed-platform total is calculated.`,
    ...(goDetails ? { goDetails } : {}),
  };
}

export function buildPlainLanguageAnalysis(data: FullAnalyticsData, summary = buildReportSummary(data)): string {
  const lines = [
    `Requested dates: ${data.weekStart} to ${data.weekEnd}, both dates included. ${data.period.label}.`,
    summary.coverageNote,
  ];
  for (const platform of data.social.platforms) {
    const metrics = platform.metrics.filter(metric => isSelectedPeriodMetric(metric, data.period));
    if (metrics.length) {
      lines.push(`${platform.platform}: for these dates, ${metrics.map(metric => `${metric.label.toLowerCase()} ${metric.value!.toLocaleString("en-CA")}`).join(", ")}.`);
    } else {
      lines.push(`${platform.platform}: a complete, date-matched figure is not available. Any other numbers shown are context only, not this week's results.`);
    }
  }
  if (summary.goPageviews === null) {
    lines.push("Go-page measurements are unavailable or incomplete. This report cannot tell whether nobody arrived, or whether visits were not measured. It does not prove zero visitors or failed marketing.");
  } else {
    lines.push(`The website tracker recorded ${summary.goPageviews.toLocaleString("en-CA")} Go-page views${summary.goVisitors === null ? "" : ` from ${summary.goVisitors.toLocaleString("en-CA")} measured visitors`}. These are recorded visits, not a count of all social link clicks. Consent, blockers, owner checks and tracking gaps can affect them.`);
  }
  if (summary.goDetails) lines.push("Go /go host and campaign-source detail", ...goReportLines(summary));
  lines.push("Followers are account totals unless explicitly labelled as a change. Likes, comments, saves and Pin clicks are not website arrivals. Pinterest outbound clicks are a separate native measure. LinkedIn's generic clicks can include company-name or logo clicks. YouTube thumbnail impressions are not video views.");
  lines.push("No trend, follower growth or best-performing platform is inferred without comparable dated evidence. Automated YFIT comments and owner checks may contribute to engagement and views; this report cannot separate them from prospective customers.");
  return lines.join("\n\n");
}
