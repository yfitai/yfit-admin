import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { weeklyReportHandler } from "./reportRoutes";
import { analyticsRouter } from "./analyticsRouter";
import { buildAndSendReport, buildReport } from "./reportService";
import { fetchSocialAnalytics } from "./analytics";
import { listReportHistory } from "./reportArchive";
import type { TrpcContext } from "./_core/context";

vi.mock("./reportService", () => ({
  buildAndSendReport: vi.fn(), buildReport: vi.fn(),
  reportMetadata: vi.fn(() => ({ reportVersion: "report-integrity-v2", weekStart: "2026-11-19", weekEnd: "2026-11-25", summary: { totalReach: null, goPageviews: null } })),
}));
vi.mock("./analytics", () => ({ fetchSocialAnalytics: vi.fn(), fetchWebsiteAnalytics: vi.fn(), fetchFullAnalytics: vi.fn() }));
vi.mock("./reportArchive", () => ({ archiveConfiguration: vi.fn(() => ({ status: "not_configured" })), listReportHistory: vi.fn(() => ({ status: "not_configured", reports: [] })), readArchivedReport: vi.fn() }));
function context(role?: "admin" | "user"): TrpcContext {
  return { req: {} as TrpcContext["req"], res: {} as TrpcContext["res"], user: role ? { id: 1, openId: "OFFLINE TEST", email: "test@example.invalid", name: "Offline fixture", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null };
}
function response() {
  const result = { status: vi.fn(), json: vi.fn() };
  result.status.mockReturnValue(result);
  return result;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-26T18:00:00Z"));
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(buildAndSendReport).mockResolvedValue({ success: true, reportId: "offline-test-id", reportVersion: "report-integrity-v2", deliveryStatus: "accepted", archiveStatus: "not_configured", summary: { totalReach: null, goPageviews: null } } as any);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
describe("report endpoint compatibility", () => {
  it("retains both weekly URLs, monthly/year-end routes and no duplicated AI prompt", () => {
    const source = readFileSync(new URL("./_core/index.ts", import.meta.url), "utf8");
    expect(source).toContain('app.post("/api/send-weekly-report", weeklyReportHandler)');
    expect(source).toContain('app.post("/api/weekly-report", weeklyReportHandler)');
    expect(source).toContain('app.post("/api/send-monthly-report"');
    expect(source).toContain('app.post("/api/send-year-end-report"');
    expect(source).not.toContain("invokeLLM");
    expect(source).not.toContain("buildAIPrompt");
  });
  it("passes legacy days to the exact same service as tRPC and returns its summary", async () => {
    const res = response();
    await weeklyReportHandler({ body: { days: "7" } } as any, res as any, vi.fn());
    expect(buildAndSendReport).toHaveBeenCalledWith({ days: 7 });
    const rpc = await analyticsRouter.createCaller(context()).sendReport({ days: 7 });
    expect(res.json).toHaveBeenCalledWith(rpc);
  });
  it("rejects invalid request dates and numbers before report generation", async () => {
    for (const body of [{ days: 0 }, { days: 1.5 }, { startDate: "2026-11-19" }, { startDate: "2026-02-30", endDate: "2026-03-01" }, { startDate: "2026-11-19", endDate: "2026-11-26" }]) {
      const res = response();
      await weeklyReportHandler({ body } as any, res as any, vi.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    }
    expect(buildAndSendReport).not.toHaveBeenCalled();
  });
  it("does not expose exception bodies in HTTP failures", async () => {
    vi.mocked(buildAndSendReport).mockRejectedValue(new Error("private upstream body and token"));
    const res = response();
    await weeklyReportHandler({ body: {} } as any, res as any, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("private upstream");
  });
  it("keeps numeric days query compatibility and adds explicit dates", async () => {
    const caller = analyticsRouter.createCaller(context());
    await caller.getSocialStats({ days: 7 });
    expect(fetchSocialAnalytics).toHaveBeenCalledWith({ days: 7 });
    await caller.getSocialStats({ startDate: "2026-11-09", endDate: "2026-11-16" } as any);
    expect(fetchSocialAnalytics).toHaveBeenCalledWith({ days: 7, startDate: "2026-11-09", endDate: "2026-11-16" });
  });
  it("generates a PDF without using the send service", async () => {
    vi.mocked(buildReport).mockResolvedValue({ pdfBuffer: Buffer.from("OFFLINE TEST PDF"), analysis: "OFFLINE TEST" } as any);
    const result = await analyticsRouter.createCaller(context()).generateReport({ days: 7 });
    expect(Buffer.from(result.pdfBase64, "base64").toString()).toBe("OFFLINE TEST PDF");
    expect(buildAndSendReport).not.toHaveBeenCalled();
  });
  it("limits private history to administrators", async () => {
    await expect(analyticsRouter.createCaller(context()).getReportHistory()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(analyticsRouter.createCaller(context("user")).getReportHistory()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listReportHistory).not.toHaveBeenCalled();
    expect(await analyticsRouter.createCaller(context("admin")).getReportHistory()).toMatchObject({ status: "not_configured" });
    expect(listReportHistory).toHaveBeenCalledTimes(1);
  });
});
