import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeReportPeriod, REPORT_VERSION, type FullAnalyticsData } from "./reportingModel";
import { buildAndSendReport, buildReport } from "./reportService";
import { fetchFullAnalytics } from "./analytics";
import { generateWeeklyReport } from "./reportGenerator";
import { sendWeeklyReport } from "./emailReport";
import { listReportHistory, readArchivedReport } from "./reportArchive";

vi.mock("./analytics", () => ({ fetchFullAnalytics: vi.fn() }));
vi.mock("./reportGenerator", () => ({ generateWeeklyReport: vi.fn() }));
vi.mock("./emailReport", () => ({ sendWeeklyReport: vi.fn() }));
let archiveDirectory: string;
function fixture(): FullAnalyticsData {
  const period = makeReportPeriod(7, new Date("2026-11-26T18:00:00Z"));
  const empty = { pageviews: null, visitors: null, visits: null, bounces: null, totaltime: null };
  return { weekStart: period.startDate, weekEnd: period.endDate, period, reportVersion: REPORT_VERSION,
    social: { platforms: [], period, fetchedAt: "2026-11-26T18:00:00Z", warnings: [] },
    website: { stats: empty, topPages: [], referrers: [], socialReferrals: {}, fetchedAt: "2026-11-26T18:00:00Z", period, status: "unavailable", warnings: [], scope: "OFFLINE TEST FIXTURE", go: { stats: empty, status: "unavailable", scope: "OFFLINE TEST FIXTURE", warnings: [] } },
  };
}
beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Network forbidden in reporting regressions"); }));
  archiveDirectory = await mkdtemp(path.join(os.tmpdir(), "yfit-reporting-test-"));
  vi.stubEnv("REPORT_ARCHIVE_DIR", archiveDirectory);
  vi.mocked(fetchFullAnalytics).mockResolvedValue(fixture());
  vi.mocked(generateWeeklyReport).mockImplementation(async (_data, analysis) => Buffer.from("OFFLINE TEST FIXTURE PDF: " + analysis));
  vi.mocked(sendWeeklyReport).mockResolvedValue({ success: true, deliveryStatus: "accepted", messageId: "mock-message-id" });
});
afterEach(async () => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); await rm(archiveDirectory, { recursive: true, force: true }); });
describe("shared reporting service and private archive", () => {
  it("generates without emailing and archives original normalized inputs and matching PDF", async () => {
    const report = await buildReport({ days: 7 });
    expect(sendWeeklyReport).not.toHaveBeenCalled();
    expect(report.archive.status).toBe("saved");
    const archived = await readArchivedReport(report.record.reportId);
    expect(archived.record.data).toEqual(report.data);
    expect(archived.record.analysis).toBe(report.analysis);
    expect(Buffer.from(archived.pdfBase64, "base64")).toEqual(report.pdfBuffer);
    expect(archived.record.delivery.state).toBe("not_sent");
    const history = await listReportHistory();
    expect(history.reports).toHaveLength(1);
    expect(history.reports[0]).not.toHaveProperty("data");
    expect(history.reports[0]).not.toHaveProperty("analysis");
    expect((await stat(path.join(archiveDirectory, report.record.reportId, "report.pdf"))).mode & 0o777).toBe(0o600);
  });
  it("sends exactly once and records accepted, never delivered", async () => {
    const result = await buildAndSendReport({ days: "7" });
    expect(fetchFullAnalytics).toHaveBeenCalledWith({ days: 7 });
    expect(sendWeeklyReport).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ success: true, emailAccepted: true, deliveryStatus: "accepted", archiveStatus: "saved", summary: { websiteVisitors: null, goPageviews: null, totalReach: null } });
    const argumentsUsed = vi.mocked(sendWeeklyReport).mock.calls[0];
    expect(argumentsUsed[3]).toEqual(result.summary);
    const saved = await readArchivedReport(result.reportId);
    expect(saved.record.delivery).toMatchObject({ state: "accepted", messageId: "mock-message-id" });
    expect(result.deliveryNote).toContain("Inbox delivery has not been verified");
  });
  it("does not resend an unknown email outcome", async () => {
    vi.mocked(sendWeeklyReport).mockRejectedValue(new Error("network timeout with private body that must not be returned"));
    const result = await buildAndSendReport();
    expect(result.deliveryStatus).toBe("unknown");
    expect(result.success).toBe(false);
    expect(result.error).not.toContain("private body");
    expect(sendWeeklyReport).toHaveBeenCalledTimes(1);
    expect((await readArchivedReport(result.reportId)).record.delivery.state).toBe("unknown");
  });
  it("preserves an explicit unknown result from the transport helper", async () => {
    vi.mocked(sendWeeklyReport).mockResolvedValue({ success: false, deliveryStatus: "unknown", error: "Offline fixture: unreadable possible acceptance" });
    const result = await buildAndSendReport();
    expect(result.deliveryStatus).toBe("unknown");
    expect((await readArchivedReport(result.reportId)).record.delivery.state).toBe("unknown");
    expect(sendWeeklyReport).toHaveBeenCalledTimes(1);
  });
  it("labels an unconfigured archive honestly rather than promising durable history", async () => {
    vi.stubEnv("REPORT_ARCHIVE_DIR", "");
    const report = await buildReport();
    expect(report.archive.status).toBe("not_configured");
    expect(report.archive.warning).toContain("temporary server files are not durable history");
    expect((await listReportHistory()).reports).toEqual([]);
  });
  it("rejects a public archive directory and does not expose its path", async () => {
    vi.stubEnv("REPORT_ARCHIVE_DIR", path.resolve("client/public/reports"));
    const report = await buildReport();
    expect(report.archive.status).toBe("failed");
    expect(report.archive.warning).not.toContain("client/public");
  });
  it("blocks path traversal and detects edited source inputs or PDFs", async () => {
    await expect(readArchivedReport("../../secret")).rejects.toThrow("Invalid report ID");
    const report = await buildReport();
    const file = path.join(archiveDirectory, report.record.reportId, "record.json");
    const record = JSON.parse(await readFile(file, "utf8"));
    record.data.weekStart = "2026-01-01";
    await writeFile(file, JSON.stringify(record));
    await expect(readArchivedReport(report.record.reportId)).rejects.toThrow("integrity check failed");
    const another = await buildReport();
    await writeFile(path.join(archiveDirectory, another.record.reportId, "report.pdf"), "tampered");
    await expect(readArchivedReport(another.record.reportId)).rejects.toThrow("integrity check failed");
  });
  it("rejects invalid inputs before fetching data or sending", async () => {
    await expect(buildAndSendReport({ days: 7.5 })).rejects.toThrow();
    expect(fetchFullAnalytics).not.toHaveBeenCalled();
    expect(sendWeeklyReport).not.toHaveBeenCalled();
  });
});
