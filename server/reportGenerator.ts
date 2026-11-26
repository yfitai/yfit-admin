/** PDF presentation only. Collection and the validated plain-language summary belong to the caller. */
import PDFDocument from "pdfkit";
import { buildReportSummary } from "./reportingSummary";
import {
  isSelectedPeriodMetric,
  type FullAnalyticsData,
  type MetricObservation,
  type ReportPeriod,
  type SocialPlatformMetrics,
  type UmamiStats,
} from "./reportingModel";

const GREEN = "#10b981";
const DARK = "#111827";
const GRAY = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";
const WHITE = "#ffffff";
const PLATFORMS = [
  "instagram",
  "tiktok",
  "linkedin",
  "facebook",
  "youtube",
  "pinterest",
] as const;
const LEFT = 50;
const WIDTH = 512;
const TOP = 50;
// Content ends well above the footer and PDFKit's automatic page-break boundary.
const BOTTOM = 710;

/** The built-in Helvetica fonts do not support arbitrary Unicode. Never emit broken glyphs. */
function ascii(value: string): string {
  return value
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u2192\u21d2]/g, " -> ")
    .replace(/\u2022/g, "- ")
    .replace(/\u00a0/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e\n\t]/g, "?");
}

function numberText(value: number | null): string {
  return value === null || !Number.isFinite(value)
    ? "Unavailable"
    : value.toLocaleString("en-CA", { maximumFractionDigits: 2 });
}

function platformName(name: string): string {
  const names: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    youtube: "YouTube",
    pinterest: "Pinterest",
  };
  return names[name] ?? ascii(name);
}

function statusText(status: string): string {
  const names: Record<string, string> = {
    available: "Available",
    missing: "Missing",
    unsupported: "Not supported",
    stale: "Stale",
    partial: "Partial",
    unknown_window: "Dates not supplied",
    unavailable: "Unavailable",
  };
  return names[status] ?? status;
}

function scopeText(scope: string): string {
  const names: Record<string, string> = {
    selected_period: "Selected period",
    source_period: "Source period",
    account_total: "Account total (stock)",
    lifetime: "Lifetime",
  };
  return names[scope] ?? scope;
}

function metricLabel(metric: MetricObservation): string {
  const label = metric.key.startsWith("period_totals.")
    ? `${metric.label} (provider period total)`
    : metric.label;
  if (
    metric.scope === "account_total" &&
    /follower/i.test(`${metric.key} ${metric.label}`)
  ) {
    return `${label} (stock, not growth)`;
  }
  if (metric.scope === "account_total") return `${label} (stock)`;
  if (metric.scope === "lifetime") return `${label} (lifetime)`;
  return label;
}

// Remove only exact collector boilerplate whose full meaning is stated in section headers.
// Unknown text, including arbitrarily long unique notes, is never shortened or discarded.
const SHARED_NOTES = [
  "Current account stock, not new followers or selected-period growth.",
  "Native scalar snapshot; the selected report dates do not establish its window.",
  "Source dates were echoed; timezone/boundary alignment is not certified by these scalar fields.",
  "Validated unique native daily values; no missing days were filled.",
  "Source calendar/timezone unknown or different; these date labels do not certify Manitoba-aligned complete days.",
  "Native daily source/activity grain not established; source-period values cannot certify actual selected-period activity.",
  "Daily unique reach is not additive: no sum is reported as period unique people.",
  "General reach_timeseries covers the provider's last 30 days; Facebook uses its days window.",
];

function compactNote(note: string): string {
  let result = note;
  for (const shared of SHARED_NOTES) result = result.replaceAll(shared, "");
  return result.replace(/\s+/g, " ").trim();
}

/** Combine only consecutive, verbatim summary boilerplate; retain all unique prose. */
function compactSummary(summary: string): string {
  const lines = summary.split("\n");
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const names: string[] = [];
    let end = i;
    while (end < lines.length) {
      const match =
        /^(instagram|tiktok|linkedin|facebook|youtube|pinterest): a complete, date-matched figure is not available\. Any other numbers shown are context only, not this week's results\.$/.exec(
          lines[end]
        );
      if (!match) break;
      names.push(platformName(match[1]));
      end++;
    }
    if (names.length > 1) {
      result.push(
        `No complete, date-matched figure is available for ${names.join(", ")}. Any other numbers shown are context only, not this week's results.`
      );
      i = end - 1;
    } else result.push(lines[i]);
  }
  return result.join("\n");
}

/** Only known Instagram compatibility aliases with identical provenance are combined. */
function presentationMetrics(
  platform: SocialPlatformMetrics
): MetricObservation[] {
  const metrics = platform.metrics.map(m => ({ ...m }));
  if (platform.platform !== "instagram") return metrics;
  for (const [aliasKey, nativeKey, nativeLabel, evidence] of [
    [
      "impressions",
      "views",
      "Views",
      "Compatibility impressions field is a views alias, not native thumbnail/content impressions.",
    ],
    [
      "profileViews",
      "accounts_engaged",
      "Accounts Engaged",
      "Accounts engaged, not profile visits.",
    ],
  ]) {
    const alias = metrics.find(m => m.key === aliasKey);
    const native = metrics.find(m => m.key === nativeKey);
    if (
      !alias ||
      !native ||
      alias.label !== nativeLabel ||
      native.label !== nativeLabel ||
      !alias.note.includes(evidence)
    )
      continue;
    if (
      alias.value === null ||
      !Number.isFinite(alias.value) ||
      !(
        [
          "value",
          "status",
          "scope",
          "source",
          "periodStart",
          "periodEnd",
          "timezone",
          "asOf",
        ] as const
      ).every(field => alias[field] === native[field])
    )
      continue;
    // Retain both notes in full; remove exact duplication only, never their unique content.
    native.note =
      native.note === alias.note ? native.note : `${native.note} ${alias.note}`;
    metrics.splice(metrics.indexOf(alias), 1);
  }
  return metrics;
}

function commonMetadata(metrics: MetricObservation[]) {
  const common = (field: "source" | "timezone" | "asOf") => {
    const counts = new Map<string | null, number>();
    for (const m of metrics)
      counts.set(m[field], (counts.get(m[field]) ?? 0) + 1);
    return Array.from(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };
  return {
    source: common("source"),
    timezone: common("timezone"),
    asOf: common("asOf"),
  };
}

function sharedPlatformNotes(metrics: MetricObservation[]): string[] {
  const candidates = [
    "Provider explicitly marks this data stale.",
    "Native analytics API unavailable.",
    "Provider reports a quota limitation.",
    ...metrics.flatMap(
      m =>
        m.note.match(
          /Facebook provider window: \d+ days; days does not establish custom start\/end dates or Manitoba alignment\./g
        ) ?? []
    ),
  ];
  const repeated = Array.from(new Set(candidates)).filter(
    note => metrics.filter(m => m.note.includes(note)).length > 1
  );
  const remaining = metrics.map(m => {
    let note = compactNote(m.note);
    for (const shared of repeated) note = note.replaceAll(shared, "");
    return note.replace(/\s+/g, " ").trim();
  });
  // A repeated full note is printed once verbatim, with its applicable metric labels.
  for (const note of Array.from(new Set(remaining))) {
    let unique = note;
    for (const known of AVAILABILITY_NOTES)
      unique = unique.replaceAll(known, "");
    if (unique.trim() && remaining.filter(n => n === note).length > 1)
      repeated.push(note);
  }
  return repeated;
}

function rowNote(metric: MetricObservation, shared: string[]): string {
  let note = compactNote(metric.note);
  for (const common of shared) note = note.replaceAll(common, "");
  return note.replace(/\s+/g, " ").trim();
}

function metricDetails(
  metric: MetricObservation,
  period: ReportPeriod,
  context: boolean,
  common: ReturnType<typeof commonMetadata>,
  shared: string[]
): string {
  const lines = [`Status: ${statusText(metric.status)}.`];
  if (metric.periodStart || metric.periodEnd)
    lines.push(
      `Source dates: ${metric.periodStart ?? "Not supplied"} to ${metric.periodEnd ?? "Not supplied"}.`
    );
  else if (metric.status !== "unknown_window")
    lines.push("Dates not supplied.");
  if (metric.scope === "lifetime") lines.push("Lifetime, not weekly activity.");
  if (metric.source !== common.source) {
    const source =
      common.source && metric.source.startsWith(`${common.source} / `)
        ? metric.source.slice(common.source.length + 3)
        : metric.source || "Not supplied";
    lines.push(`Source: ${source}.`);
  }
  if (metric.timezone !== common.timezone)
    lines.push(`Timezone: ${metric.timezone ?? "Not supplied"}.`);
  if (metric.asOf !== common.asOf)
    lines.push(`As of: ${metric.asOf ?? "Not supplied"}.`);
  if (context && metric.scope === "selected_period") {
    if (
      metric.periodStart !== period.startDate ||
      metric.periodEnd !== period.endDate
    )
      lines.push("Source dates do not match the selected period.");
    else lines.push("Unavailable or invalid for the selected period.");
  }
  const note = rowNote(metric, shared);
  if (note) lines.push(note);
  return lines.join(" ");
}

const NONESSENTIAL_COUNTERS = new Set([
  "reach",
  "likes",
  "comments",
  "shares",
  "saves",
  "profileViews",
]);
const AVAILABILITY_NOTES = [
  "Not declared available by provider; numeric placeholders are not certified observations.",
  "No finite nonnegative numeric field was supplied.",
  "Provider marks this metric not supported.",
  "Provider marks this metric missing.",
];

function canGroupUnavailable(
  metric: MetricObservation,
  shared: string[]
): boolean {
  if (
    !NONESSENTIAL_COUNTERS.has(metric.key) ||
    metric.value !== null ||
    !["missing", "unsupported", "unavailable"].includes(metric.status)
  )
    return false;
  let note = rowNote(metric, shared);
  for (const known of AVAILABILITY_NOTES) note = note.replaceAll(known, "");
  // Special definitions, stale-source reasons, dated rows and unique notes keep their own rows.
  return !note.trim() && !metric.periodStart && !metric.periodEnd;
}

function platformMetadata(
  layout: Layout,
  platform: SocialPlatformMetrics,
  metrics: MetricObservation[],
  shared: string[]
) {
  const common = commonMetadata(metrics);
  const source =
    common.source === platform.source
      ? `Provider/source: ${platform.source || "Not supplied"}`
      : `Provider: ${platform.source || "Not supplied"}. Source: ${common.source || "Not supplied"}`;
  layout.text(
    `${source}. Fetched: ${platform.fetchedAt || "Not supplied"}. Timezone: ${common.timezone ?? "Not supplied"}. As of: ${common.asOf ?? "Not supplied"}.`,
    8,
    GRAY
  );
  for (const warning of platform.warnings)
    layout.text(`Warning: ${warning}`, 9, GRAY);
  for (const note of shared) {
    const applies = metrics
      .filter(m => compactNote(m.note).includes(note))
      .map(m => metricLabel(m));
    const snapshots = metrics.filter(
      m =>
        !m.key.startsWith("period_totals.") &&
        !m.key.includes("weekly_") &&
        !m.key.includes("timeseries")
    );
    const scope =
      snapshots.length === applies.length &&
      snapshots.every(m => compactNote(m.note).includes(note))
        ? "snapshot counters"
        : applies.join(", ");
    layout.text(`Shared limitation (${scope}): ${note}`, 8, GRAY);
  }
  return common;
}

/** Explicit wrapping makes very long notes/URLs safe, including rows taller than a page. */
class Layout {
  y = TOP;
  constructor(readonly doc: PDFKit.PDFDocument) {}

  newPage() {
    this.doc.addPage();
    this.y = TOP;
  }

  ensure(height: number) {
    if (this.y + height > BOTTOM) this.newPage();
  }

  font(size: number, bold = false) {
    this.doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);
  }

  lines(text: string, width: number, size: number, bold = false): string[] {
    this.font(size, bold);
    const result: string[] = [];
    for (const paragraph of ascii(text).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (this.doc.widthOfString(candidate) <= width) {
          line = candidate;
          continue;
        }
        if (line) result.push(line);
        line = "";
        // Break long individual tokens, rather than clipping their right edge.
        for (const char of word) {
          if (line && this.doc.widthOfString(line + char) > width) {
            result.push(line);
            line = "";
          }
          line += char;
        }
      }
      result.push(line);
    }
    return result;
  }

  text(text: string, size = 9, color = DARK, bold = false) {
    const lines = this.lines(text, WIDTH, size, bold);
    this.font(size, bold);
    const step = this.doc.currentLineHeight(true) + 2;
    for (const line of lines) {
      this.ensure(step);
      this.font(size, bold);
      this.doc
        .fillColor(color)
        .text(line, LEFT, this.y, { width: WIDTH, lineBreak: false });
      this.y += step;
    }
    this.y += 6;
  }

  section(title: string) {
    this.ensure(62);
    this.doc.rect(LEFT, this.y, WIDTH, 28).fill(GREEN);
    this.font(12, true);
    this.doc.fillColor(WHITE).text(ascii(title), LEFT + 8, this.y + 7, {
      width: WIDTH - 16,
      lineBreak: false,
    });
    this.y += 40;
  }

  table(headers: string[], rows: string[][], widths: number[]) {
    const padding = 5;
    const size = 8;
    const headerLines = headers.map((h, i) =>
      this.lines(h, widths[i] - padding * 2, size, true)
    );
    this.font(size);
    const step = this.doc.currentLineHeight(true) + 2;
    const headerHeight =
      Math.max(...headerLines.map(l => l.length)) * step + padding * 2;
    const drawPart = (
      cells: string[][],
      start: number,
      count: number,
      header: boolean,
      shaded: boolean
    ) => {
      const height = count * step + padding * 2;
      this.doc
        .rect(LEFT, this.y, WIDTH, height)
        .fill(header ? DARK : shaded ? LIGHT_GRAY : WHITE);
      let x = LEFT;
      cells.forEach((lines, column) => {
        this.font(size, header);
        this.doc.fillColor(header ? WHITE : DARK);
        const visible =
          !header &&
          start > 0 &&
          column < cells.length - 1 &&
          start >= lines.length
            ? this.lines(
                `${lines.join(" ")} (continued)`,
                widths[column] - padding * 2,
                size
              ).slice(0, count)
            : lines.slice(start, start + count);
        visible.forEach((line, index) => {
          this.doc.text(line, x + padding, this.y + padding + index * step, {
            width: widths[column] - padding * 2,
            lineBreak: false,
          });
        });
        x += widths[column];
      });
      this.y += height;
    };
    const drawHeader = () =>
      drawPart(
        headerLines,
        0,
        Math.max(...headerLines.map(l => l.length)),
        true,
        false
      );
    const firstRowLines = rows.length
      ? Math.max(
          ...rows[0].map(
            (cell, i) => this.lines(cell, widths[i] - padding * 2, size).length
          )
        )
      : 1;
    const firstRowHeight = Math.min(
      firstRowLines * step + padding * 2,
      BOTTOM - TOP - headerHeight
    );
    this.ensure(headerHeight + firstRowHeight);
    drawHeader();
    rows.forEach((row, rowIndex) => {
      const cells = row.map((cell, i) =>
        this.lines(cell, widths[i] - padding * 2, size)
      );
      const lineCount = Math.max(...cells.map(l => l.length));
      const fullHeight = lineCount * step + padding * 2;
      // Keep ordinary rows intact. A huge note is continued across as many pages as needed.
      if (
        fullHeight <= BOTTOM - TOP - headerHeight &&
        this.y + fullHeight > BOTTOM
      ) {
        this.newPage();
        drawHeader();
      }
      let start = 0;
      while (start < lineCount) {
        const fits = Math.floor((BOTTOM - this.y - padding * 2) / step);
        if (fits < 1) {
          this.newPage();
          drawHeader();
          continue;
        }
        const count = Math.min(fits, lineCount - start);
        drawPart(cells, start, count, false, rowIndex % 2 === 1);
        start += count;
        if (start < lineCount) {
          this.newPage();
          drawHeader();
        }
      }
    });
    this.y += 12;
  }
}

function samePeriod(left: ReportPeriod, right: ReportPeriod): boolean {
  return (
    left.startDate === right.startDate &&
    left.endDate === right.endDate &&
    left.startAt === right.startAt &&
    left.endAt === right.endAt &&
    left.timezone === right.timezone
  );
}

function websiteRows(
  stats: UmamiStats,
  available: boolean,
  go = false
): string[][] {
  const fields: Array<[keyof UmamiStats, string]> = [
    [
      "pageviews",
      go ? "Go webpage recorded pageviews" : "Website recorded pageviews",
    ],
    [
      "visitors",
      go ? "Go webpage recorded visitors" : "Website recorded visitors",
    ],
    ["visits", go ? "Go webpage recorded visits" : "Website recorded visits"],
    ["bounces", "Recorded bounces"],
    ["totaltime", "Recorded visit time (seconds)"],
  ];
  return fields.map(([key, label]) => [
    label,
    numberText(available ? stats[key] : null),
  ]);
}

export async function generateWeeklyReport(
  data: FullAnalyticsData,
  summaryText: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      bufferPages: true,
      margins: { top: TOP, bottom: 50, left: LEFT, right: LEFT },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const layout = new Layout(doc);
    const { period, social, website } = data;
    doc.rect(0, 0, doc.page.width, 116).fill(GREEN);
    doc
      .font("Helvetica-Bold")
      .fontSize(27)
      .fillColor(WHITE)
      .text("YFIT AI", LEFT, 27);
    doc
      .font("Helvetica")
      .fontSize(13)
      .text("Weekly Analytics Report", LEFT, 62);
    doc
      .fontSize(10)
      .text(
        ascii(`${period.startDate} to ${period.endDate} (inclusive)`),
        LEFT,
        86
      );
    layout.y = 136;
    layout.text(
      `Selected period: ${period.startDate} to ${period.endDate}; ${period.days} completed days.`,
      10,
      DARK,
      true
    );
    layout.text(`Timezone: ${period.timezone}. ${period.label}`);
    layout.text(
      `Report version: ${data.reportVersion}. Social data fetched: ${social.fetchedAt}.`
    );

    const summary = buildReportSummary(data);
    layout.section("Data coverage");
    layout.text(summary.coverageNote, 10, DARK, true);
    layout.text(
      "Coverage here means a verified views or impressions figure, not that every metric is available. The six platform rows below also show any other eligible measurements.",
      9,
      GRAY
    );
    layout.text(
      "Native reach, views and impressions have different definitions and are not added together. These data do not establish a unique audience across platforms. No engagement-to-reach percentage is calculated. Account total followers are a stock, not follower growth."
    );
    const coverage = PLATFORMS.map(name => {
      const matches = social.platforms.filter(p => p.platform === name);
      const count = matches.reduce(
        (total, p) =>
          total +
          p.metrics.filter(m => isSelectedPeriodMetric(m, period)).length,
        0
      );
      const states = Array.from(
        new Set(matches.flatMap(p => p.metrics.map(m => statusText(m.status))))
      ).join(", ");
      return [
        platformName(name),
        count
          ? `${count} verified metric${count === 1 ? "" : "s"}`
          : "No verified selected-period metrics",
        matches.length
          ? states || "No observations supplied"
          : "Unavailable - platform data not supplied",
      ];
    });
    layout.table(
      ["Platform", "Selected-period coverage", "Observation status"],
      coverage,
      [90, 200, 222]
    );
    for (const warning of social.warnings)
      layout.text(`Social data warning: ${warning}`, 9, GRAY);

    layout.section("Selected-period social metrics");
    layout.text(
      "Only available measurements whose scope and source dates match the selected period appear here. Pin clicks, outbound clicks and profile visits are separate actions, not recorded website visits. This compact PDF does not manufacture actual selected-week figures; the full normalized input remains in the JSON archive when archiving is configured."
    );
    const noSelected: string[] = [];
    for (const name of PLATFORMS) {
      const platforms = social.platforms.filter(p => p.platform === name);
      if (
        !platforms.some(p =>
          p.metrics.some(m => isSelectedPeriodMetric(m, period))
        )
      ) {
        noSelected.push(platformName(name));
        continue;
      }
      layout.text(platformName(name), 10, DARK, true);
      for (const platform of platforms) {
        const allMetrics = presentationMetrics(platform);
        const metrics = allMetrics.filter(m =>
          isSelectedPeriodMetric(m, period)
        );
        if (!metrics.length) continue;
        const shared = sharedPlatformNotes(allMetrics);
        const common = platformMetadata(layout, platform, allMetrics, shared);
        layout.table(
          ["Native metric", "Recorded value", "Measurement details"],
          metrics.map(m => [
            metricLabel(m),
            numberText(m.value),
            metricDetails(m, period, false, common, shared),
          ]),
          [140, 78, 294]
        );
      }
    }
    if (noSelected.length)
      layout.text(
        `No verified selected-period metrics: ${noSelected.join(", ")}. Other dates, account totals and unavailable measurements are context only below.`,
        9,
        GRAY
      );

    layout.section("Other context - not selected-period results");
    layout.text(
      "These rows are not included in the selected-period metrics or coverage. A stale snapshot, lifetime value, account total, unknown window or different source period cannot describe activity in the selected period. Unavailable means no usable measurement, not zero."
    );
    layout.text(
      "Snapshot windows are not established by the selected dates. Echoed source dates do not certify timezone/boundary alignment. Account totals are stock, not growth. Daily source values have no missing days filled; where calendar/timezone or activity grain is not established, date labels alone cannot certify complete Manitoba days or actual weekly activity. Daily unique reach is not additive. General daily series cover the provider's last 30 days; Facebook uses its own days window. Header metadata applies to the rows unless an exception is noted. Fetched time is retrieval time, not measurement freshness.",
      8,
      GRAY
    );
    let contextCount = 0;
    for (const name of PLATFORMS) {
      for (const platform of social.platforms.filter(
        p => p.platform === name
      )) {
        const allMetrics = presentationMetrics(platform);
        const metrics = allMetrics.filter(
          m => !isSelectedPeriodMetric(m, period)
        );
        if (!metrics.length) continue;
        contextCount += metrics.length;
        layout.ensure(190);
        layout.text(`${platformName(name)} - context only`, 10, DARK, true);
        const hasSelected = allMetrics.some(m =>
          isSelectedPeriodMetric(m, period)
        );
        const shared = sharedPlatformNotes(allMetrics);
        const common = hasSelected
          ? commonMetadata(allMetrics)
          : platformMetadata(layout, platform, allMetrics, shared);
        if (hasSelected)
          layout.text(
            "Provider, fetched time, timezone and as-of: see this platform's selected-period header above. Row exceptions are noted below.",
            8,
            GRAY
          );
        const grouped = metrics.filter(
          m =>
            canGroupUnavailable(m, shared) &&
            m.source === common.source &&
            m.timezone === common.timezone &&
            m.asOf === common.asOf
        );
        const rows = metrics.filter(m => !grouped.includes(m));
        if (grouped.length)
          layout.text(
            `Unavailable (not zero; dates not supplied): ${grouped.map(m => `${m.label} [${statusText(m.status)}]`).join(", ")}. Provider placeholders are not certified counts.`,
            8,
            GRAY
          );
        layout.text(
          `${!allMetrics.some(m => /click/i.test(m.key)) ? "Native clicks: unavailable (not supplied). " : ""}${!allMetrics.some(m => /outbound.?click/i.test(m.key)) ? "Native outbound clicks: unavailable (not supplied). " : ""}External website/bio taps: unknown; profile/button taps do not certify external taps.`,
          8,
          GRAY
        );
        if (rows.length)
          layout.table(
            [
              `${platformName(name)} metric / stock`,
              "Context value",
              "Status, dates and limitations",
            ],
            rows.map(m => [
              metricLabel(m),
              numberText(m.value),
              metricDetails(m, period, true, common, shared),
            ]),
            [140, 78, 294]
          );
      }
    }
    if (!contextCount)
      layout.text("No additional context observations were supplied.", 9, GRAY);

    layout.section("Website and Go recording");
    const websiteMatches = samePeriod(website.period, period);
    const websiteAvailable = website.status !== "unavailable" && websiteMatches;
    layout.text(
      `Website status: ${statusText(website.status)}${website.status === "unavailable" ? " (NoWebsiteData)" : ""}. Source: Umami.`,
      10,
      DARK,
      true
    );
    layout.text(
      `Scope: ${website.scope}. Source dates: ${website.period.startDate} to ${website.period.endDate}. Timezone: ${website.period.timezone}. As of: ${website.fetchedAt}.`
    );
    if (!websiteMatches)
      layout.text(
        "Website source dates or timezone do not match the selected period. Numbers are omitted from the selected-period website tables.",
        9,
        GRAY
      );
    if (website.status === "unavailable")
      layout.text(
        "No website data is available. This is not a measured zero and does not show that marketing failed.",
        9,
        GRAY
      );
    for (const warning of website.warnings)
      layout.text(`Website warning: ${warning}`, 9, GRAY);
    if (website.status === "partial")
      layout.text(
        "Returned website counters (scope unverified): context only, not confirmed selected-period website totals. A returned zero is not a verified zero for the intended hostname/path scope.",
        9,
        GRAY
      );
    layout.table(
      ["Umami measurement", "Recorded value"],
      websiteAvailable
        ? websiteRows(website.stats, true)
        : websiteRows(website.stats, false).slice(0, 3),
      [360, 152]
    );
    if (!websiteAvailable)
      layout.text(
        "Other website counters: recorded bounces and recorded visit time are unavailable, not measured zero.",
        8,
        GRAY
      );
    layout.text(
      `Go status: ${statusText(website.go.status)}. Source: Umami. Scope: ${website.go.scope}. Source dates and as of: same website request above.`,
      10,
      DARK,
      true
    );
    const goAvailable = website.go.status !== "unavailable" && websiteMatches;
    if (website.go.status === "unavailable")
      layout.text("Go recording is unavailable, not a measured zero.", 9, GRAY);
    if (website.go.status === "partial")
      layout.text(
        "Returned Go counters (scope unverified): context only, not confirmed Go arrivals. A returned zero does not certify zero visits to the intended Go hostname/path.",
        9,
        GRAY
      );
    for (const warning of website.go.warnings)
      layout.text(`Go warning: ${warning}`, 9, GRAY);
    layout.table(
      ["Umami Go measurement", "Recorded value"],
      goAvailable
        ? websiteRows(website.go.stats, true, true)
        : websiteRows(website.go.stats, false, true).slice(0, 3),
      [360, 152]
    );
    if (!goAvailable)
      layout.text(
        "Other Go counters: recorded bounces and recorded visit time are unavailable, not measured zero.",
        8,
        GRAY
      );
    layout.text(
      "Go webpage recorded visits (webpageRecordedGoVisits) are Umami visit records. Native outbound clicks, pin clicks and profile visits are different measurements. Recorded visitors are not a verified count of unique people across devices or platforms."
    );

    layout.text("Recorded social referrers", 10, DARK, true);
    layout.text(
      "These are website-side referrer records, not social-platform outbound clicks. Missing values remain unavailable; there is no combined native click or audience total.",
      9,
      GRAY
    );
    if (
      !websiteAvailable ||
      PLATFORMS.every(name => website.socialReferrals[name] == null)
    )
      layout.text(
        `Recorded referrer counts unavailable (not zero): ${PLATFORMS.map(platformName).join(", ")}.`,
        8,
        GRAY
      );
    else
      layout.table(
        ["Referring platform", "Recorded referrer count"],
        PLATFORMS.map(name => [
          platformName(name),
          numberText(website.socialReferrals[name] ?? null),
        ]),
        [360, 152]
      );
    if (websiteAvailable && website.topPages.length) {
      layout.text("Top recorded pages (Umami)", 10, DARK, true);
      layout.table(
        ["Page path", "Recorded count"],
        website.topPages.map(row => [row.x, numberText(row.y)]),
        [360, 152]
      );
    }
    if (websiteAvailable && website.referrers.length) {
      layout.text("Recorded external referrers (Umami)", 10, DARK, true);
      layout.table(
        ["Referrer", "Recorded count"],
        website.referrers.map(row => [row.x, numberText(row.y)]),
        [360, 152]
      );
    }

    layout.section("What the numbers tell us");
    layout.text(
      compactSummary(summaryText.trim()) ||
        "No validated summary was supplied.",
      10
    );

    // Stamp buffered pages in place. Footer text must not trigger PDFKit's automatic new page.
    const pages = doc.bufferedPageRange();
    const generated = new Date().toLocaleString("en-CA", {
      timeZone: "Etc/GMT+5",
      hour12: false,
    });
    for (let index = pages.start; index < pages.start + pages.count; index++) {
      doc.switchToPage(index);
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.save();
      doc
        .moveTo(LEFT, 732)
        .lineTo(LEFT + WIDTH, 732)
        .strokeColor(GREEN)
        .lineWidth(0.7)
        .stroke();
      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(GRAY)
        .text(
          ascii(
            `YFIT AI | Generated ${generated} Manitoba time (UTC-5) | Page ${index - pages.start + 1} of ${pages.count}`
          ),
          LEFT,
          744,
          { width: WIDTH, align: "center", lineBreak: false }
        );
      doc.restore();
      doc.page.margins.bottom = bottomMargin;
    }
    doc.end();
  });
}
