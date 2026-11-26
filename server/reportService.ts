import { randomUUID } from "node:crypto";
import { fetchFullAnalytics } from "./analytics";
import { generateWeeklyReport } from "./reportGenerator";
import { sendWeeklyReport } from "./emailReport";
import { archiveReport, sha256, updateReportDelivery, type ArchiveResult, type ReportRecord } from "./reportArchive";
import { buildPlainLanguageAnalysis, buildReportSummary, parseReportRequest, servingRevision } from "./reportingSummary";

export async function buildReport(input: unknown = {}) {
  const request = parseReportRequest(input);
  const data = await fetchFullAnalytics(request);
  const summary = buildReportSummary(data);
  const analysis = buildPlainLanguageAnalysis(data, summary);
  const pdfBuffer = await generateWeeklyReport(data, analysis);
  const reportId = randomUUID();
  const record: ReportRecord = {
    reportId,
    generatedAt: new Date().toISOString(),
    reportVersion: data.reportVersion,
    servingRevision: servingRevision(),
    inputHash: sha256(JSON.stringify(data)),
    pdfHash: sha256(pdfBuffer),
    data, summary, analysis,
    delivery: { state: "not_sent", messageId: null, updatedAt: null },
  };
  const archive = await archiveReport(record, pdfBuffer);
  return { data, summary, analysis, pdfBuffer, record, archive };
}
export function reportMetadata(report: Awaited<ReturnType<typeof buildReport>>) {
  return {
    reportId: report.record.reportId,
    generatedAt: report.record.generatedAt,
    reportVersion: report.record.reportVersion,
    servingRevision: report.record.servingRevision,
    weekStart: report.data.weekStart,
    weekEnd: report.data.weekEnd,
    period: report.data.period,
    summary: report.summary,
    archiveStatus: report.archive.status,
    archiveWarning: report.archive.warning,
  };
}
export async function buildAndSendReport(input: unknown = {}) {
  const report = await buildReport(input);
  let result: { success: boolean; messageId?: string; error?: string; deliveryStatus?: "accepted" | "rejected" | "unknown" };
  let deliveryState: ReportRecord["delivery"]["state"];
  try {
    result = await sendWeeklyReport(report.pdfBuffer, report.data.weekStart, report.data.weekEnd, report.summary);
    deliveryState = result.deliveryStatus ?? (result.success ? "accepted" : "rejected");
  } catch {
    // A network exception can occur after acceptance; do not advise an automatic resend.
    result = { success: false, error: "Email send outcome is unknown. Check the provider before retrying to avoid a duplicate report." };
    deliveryState = "unknown";
  }
  let archive: ArchiveResult = report.archive;
  if (archive.status === "saved") {
    const update = await updateReportDelivery(report.record.reportId, {
      state: deliveryState, messageId: result.messageId ?? null, updatedAt: new Date().toISOString(),
    });
    if (update.status !== "saved") archive = update;
  }
  return {
    ...reportMetadata(report),
    ...result,
    emailAccepted: result.success,
    deliveryStatus: deliveryState,
    deliveryNote: result.success ? "The email provider accepted the send request. Inbox delivery has not been verified." : "No inbox delivery is confirmed. Do not automatically resend an unknown outcome.",
    archiveStatus: archive.status,
    archiveWarning: archive.warning,
  };
}
