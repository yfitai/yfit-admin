/** Go-only reporting helpers. Counts are native pageviews/visitors, never outbound clicks or people. */
import {
  emptyStats,
  normalizeUmamiStats,
  record,
  STAT_KEYS,
} from "./analyticsCollector";
import {
  GO_SOURCES,
  type GoHostAnalytics,
  type GoSourceCounts,
  type GoSource,
} from "./reportingModel";

export function goCount(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}
export function normalizeGoStats(raw: unknown) {
  const stats = normalizeUmamiStats(raw);
  for (const key of STAT_KEYS) stats[key] = goCount(stats[key]);
  return stats;
}
export function completeGoStats(stats: ReturnType<typeof emptyStats>): boolean {
  return STAT_KEYS.every(key => goCount(stats[key]) !== null);
}
export function combinedGoStats(hosts: GoHostAnalytics[]) {
  const stats = emptyStats();
  if (
    hosts.length &&
    hosts.every(
      h =>
        h.scopeVerified && h.status === "available" && completeGoStats(h.stats)
    )
  ) {
    stats.pageviews = goCount(
      hosts.reduce((sum, h) => sum + h.stats.pageviews!, 0)
    );
  }
  // Even zero does not construct a native deduplicated cross-host visitor/session query.
  return stats;
}
export function emptyGoSources(): GoSourceCounts {
  return Object.fromEntries(
    GO_SOURCES.map(source => [source, null])
  ) as GoSourceCounts;
}
export function goSourceLabel(source: GoSource): string {
  if (source === "unknown") return "Unknown/unattributed";
  if (source === "direct") return "Direct (explicitly tagged)";
  return {
    facebook: "Facebook",
    instagram: "Instagram",
    pinterest: "Pinterest",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    tiktok: "TikTok",
  }[source];
}
/** Current /utm/metrics contract is [{utm, views}], not generic metrics type=utmSource. */
export function normalizeGoSources(raw: unknown): {
  pageviews: GoSourceCounts;
  valid: boolean;
} {
  const pageviews = emptyGoSources();
  if (!Array.isArray(raw)) return { pageviews, valid: false };
  let valid = true;
  for (const item of raw) {
    const row = record(item);
    const views = goCount(row.views);
    if (views === null || (row.utm !== null && typeof row.utm !== "string")) {
      valid = false;
      continue;
    }
    const label =
      typeof row.utm === "string" ? row.utm.trim().toLowerCase() : "";
    const source: GoSource =
      GO_SOURCES.includes(label as GoSource) && label !== "unknown"
        ? (label as GoSource)
        : "unknown";
    const sum = goCount((pageviews[source] ?? 0) + views);
    if (sum === null) valid = false;
    pageviews[source] = sum;
  }
  // Absent rows are unknown, not zero: no exhaustiveness or unknown subtraction is inferred.
  return { pageviews: valid ? pageviews : emptyGoSources(), valid };
}
export function combineGoSources(
  hosts: Array<{ status: string; pageviews: GoSourceCounts }>
): GoSourceCounts {
  const counts = emptyGoSources();
  if (!hosts.length || hosts.some(h => h.status !== "available")) return counts;
  for (const source of GO_SOURCES) {
    if (hosts.every(h => goCount(h.pageviews[source]) !== null)) {
      counts[source] = goCount(
        hosts.reduce((sum, h) => sum + h.pageviews[source]!, 0)
      );
    }
  }
  return counts;
}
