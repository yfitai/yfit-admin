import { z } from "zod";
import { isSelectedPeriodMetric, makeReportPeriod, type FullAnalyticsData, type ReportSummary } from "./reportingModel";

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
  const websiteDatesMatch = data.website.period.startAt === data.period.startAt && data.website.period.endAt === data.period.endAt && data.website.period.timezone === data.period.timezone;
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
    goPageviews: data.website.go.status === "available" && websiteDatesMatch ? data.website.go.stats.pageviews : null,
    goVisitors: data.website.go.status === "available" && websiteDatesMatch ? data.website.go.stats.visitors : null,
    coverageNote: `${verifiedPlatforms} of ${data.social.platforms.length} platforms have a verified views or impressions figure for the selected dates. Other numbers are labelled as source-period, account-total, partial, stale or unavailable. No mixed-platform total is calculated.`,
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
  lines.push("Followers are account totals unless explicitly labelled as a change. Likes, comments, saves and Pin clicks are not website arrivals. Pinterest outbound clicks are a separate native measure. LinkedIn's generic clicks can include company-name or logo clicks. YouTube thumbnail impressions are not video views.");
  lines.push("No trend, follower growth or best-performing platform is inferred without comparable dated evidence. Automated YFIT comments and owner checks may contribute to engagement and views; this report cannot separate them from prospective customers.");
  return lines.join("\n\n");
}
