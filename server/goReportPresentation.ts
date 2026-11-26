/** Pure shared presentation for optional Go fields; historical v2 inputs need no new fields. */
import { GO_SOURCES, type ReportSummary } from "./reportingModel";
import { goCount, goSourceLabel } from "./goAnalytics";

function valueText(value: number | null): string {
  const count = goCount(value);
  return count === null ? "Unavailable" : count.toLocaleString("en-CA");
}
function evidenceLabel(status: string): string {
  return status === "available"
    ? "Verified scoped measurement"
    : status === "partial"
      ? "Partial/context only - not certified"
      : "Unavailable - not zero";
}
export function goHostRows(summary: ReportSummary): string[][] {
  return (summary.goDetails?.hosts ?? []).map(h => [
    h.host,
    valueText(h.pageviews),
    valueText(h.visitors),
    evidenceLabel(h.status),
  ]);
}
export function goSourceRows(summary: ReportSummary): string[][] {
  const details = summary.goDetails;
  if (!details) return [];
  return GO_SOURCES.map(source => [
    goSourceLabel(source),
    valueText(
      details.sourceStatus === "available"
        ? details.sourcePageviews[source]
        : null
    ),
  ]);
}
export function goSourceContextRows(summary: ReportSummary): string[][] {
  const details = summary.goDetails;
  if (!details) return [];
  return details.sourceHosts
    .filter(h => h.status !== "unavailable")
    .flatMap(h =>
      GO_SOURCES.filter(
        source =>
          goCount(h.pageviews[source]) !== null &&
          (details.sourceStatus !== "available" ||
            goCount(details.sourcePageviews[source]) === null)
      ).map(source => [
        h.host,
        goSourceLabel(source),
        valueText(h.pageviews[source]),
        details.sourceStatus === "available" && h.status === "available"
          ? "Verified per-host pageviews - combined bucket unavailable"
          : "Per-host context only - incomplete combined coverage",
      ])
    );
}
export function canonicalGoHeadline(summary: ReportSummary): string {
  const host = summary.goDetails?.hosts.find(h => h.host === "app.yfitai.com");
  const visitors = host?.status === "available" ? host.visitors : null;
  return `Canonical Go measured visitors (app.yfitai.com/go): ${valueText(visitors)}. Other host visitors are listed separately, not added.`;
}
export function goReportLines(summary: ReportSummary): string[] {
  const details = summary.goDetails;
  if (!details) return [];
  return [
    canonicalGoHeadline(summary),
    `Go status: ${evidenceLabel(details.status)}. Combined Go pageviews: ${valueText(summary.goPageviews)}. Cross-host measured visitors: unavailable (not summed).`,
    ...goHostRows(summary).map(
      ([host, views, visitors, status]) =>
        `${host}: Go pageviews ${views}; native measured visitors ${visitors}. ${status}.`
    ),
    `Campaign-source PAGEVIEWS for /go: ${evidenceLabel(details.sourceStatus)}.`,
    ...goSourceRows(summary).map(
      ([source, views]) => `${source}: ${views} pageviews.`
    ),
    ...goSourceContextRows(summary).map(
      ([host, source, views, status]) =>
        `${host}, ${source}: ${views} pageviews. ${status}.`
    ),
    details.note,
  ];
}
