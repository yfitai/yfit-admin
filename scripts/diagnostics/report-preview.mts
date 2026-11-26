#!/usr/bin/env node
/** Offline report format preview. No fetch, email, database, model call or provider write. */
import { readFile, writeFile } from "node:fs/promises";
import { normalizeSocialAnalytics, emptyStats } from "../../server/analyticsCollector";
import { makeReportPeriod, REPORT_VERSION, type FullAnalyticsData } from "../../server/reportingModel";
import { buildPlainLanguageAnalysis, buildReportSummary } from "../../server/reportingSummary";
import { generateWeeklyReport } from "../../server/reportGenerator";

const [input, startDate, endDate, output] = process.argv.slice(2);
if (!input || !startDate || !endDate || !output) throw new Error("Usage: pnpm exec tsx scripts/diagnostics/report-preview.mts <preserved-provider-snapshot.json> <start-date> <end-date> <output.pdf>");
// Unexpected networking is a hard failure rather than a silent live analytics read.
globalThis.fetch = async () => { throw new Error("Network disabled in offline preview."); };
const source = JSON.parse(await readFile(input, "utf8"));
const capturedAt = source.provider_profile_analytics?.response_received_at_utc ?? source.collected_at_utc;
if (typeof capturedAt !== "string" || !Number.isFinite(Date.parse(capturedAt))) throw new Error("A preserved source collection timestamp is required.");
const raw = source.provider_profile_analytics?.response;
if (!raw || typeof raw !== "object") throw new Error("The preserved provider response is missing.");
const period = makeReportPeriod({ startDate, endDate });
const social = normalizeSocialAnalytics(raw, period, capturedAt);
const previewNote = `OFFLINE FORMAT PREVIEW. Uses real provider account evidence captured ${capturedAt}, not fresh analytics, today's posts or the original emailed report. The dates select only retained native daily data; source totals keep their own definitions and availability.`;
social.warnings.unshift(previewNote);
const data: FullAnalyticsData = {
  reportVersion: `${REPORT_VERSION} / OFFLINE HISTORICAL PREVIEW`, weekStart: period.startDate, weekEnd: period.endDate, period, social,
  website: { stats: emptyStats(), topPages: [], referrers: [], socialReferrals: {}, fetchedAt: capturedAt, period, status: "unavailable", warnings: ["No successful website read is contained in this preserved evidence. No fresh website measurement was requested."], scope: "Unavailable in preserved source evidence; no website counts invented.", go: { stats: emptyStats(), status: "unavailable", scope: "No verified Go-path measurement in preserved source evidence.", warnings: ["Unknown, not zero arrivals."] } },
};
const summary = buildReportSummary(data);
const analysis = previewNote + "\n\n" + buildPlainLanguageAnalysis(data, summary);
const pdf = await generateWeeklyReport(data, analysis);
await writeFile(output, pdf, { mode: 0o600 });
await writeFile(output.replace(/\.pdf$/i, "") + ".json", JSON.stringify({ previewNote, sourceCapturedAt: capturedAt, data, summary, analysis }, null, 2) + "\n", { mode: 0o600 });
console.log(`Offline preview created: ${output}. No live collection or report send performed.`);
