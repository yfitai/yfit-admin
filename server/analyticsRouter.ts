/** Analytics reporting; existing procedure names and numeric days requests remain compatible. */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { fetchFullAnalytics, fetchSocialAnalytics, fetchWebsiteAnalytics } from "./analytics";
import { buildAndSendReport, buildReport, reportMetadata } from "./reportService";
import { reportRequestSchema, servingRevision } from "./reportingSummary";
import { REPORT_VERSION } from "./reportingModel";
import { archiveConfiguration, listReportHistory, readArchivedReport } from "./reportArchive";

const archiveAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});
export const analyticsRouter = router({
  getSocialStats: publicProcedure.input(reportRequestSchema).query(({ input }) => fetchSocialAnalytics(input)),
  getWebsiteStats: publicProcedure.input(reportRequestSchema).query(({ input }) => fetchWebsiteAnalytics(input)),
  getFullData: publicProcedure.input(reportRequestSchema).query(({ input }) => fetchFullAnalytics(input)),
  generateReport: publicProcedure.input(reportRequestSchema).mutation(async ({ input }) => {
    const report = await buildReport(input);
    return { success: true, ...reportMetadata(report), pdfBase64: report.pdfBuffer.toString("base64"), analysis: report.analysis };
  }),
  sendReport: publicProcedure.input(reportRequestSchema).mutation(({ input }) => buildAndSendReport(input)),
  getCapabilities: publicProcedure.query(() => ({
    reportVersion: REPORT_VERSION,
    servingRevision: servingRevision(),
    datePolicy: "Complete Manitoba days (UTC-5), with inclusive date labels and exclusive timestamp end boundary.",
    analysis: "Deterministic plain-language summary; no AI-inferred clicks, growth or zero visitors.",
    nativeConnections: "Existing Upload-Post account analytics only. New direct native-platform authorizations have not been configured.",
    archive: archiveConfiguration(),
  })),
  getReportHistory: archiveAdminProcedure.query(() => listReportHistory()),
  getArchivedReport: archiveAdminProcedure.input(z.object({ reportId: z.string().uuid() })).query(async ({ input }) => {
    try { return await readArchivedReport(input.reportId); }
    catch { throw new TRPCError({ code: "NOT_FOUND", message: "The archived report is unavailable or failed its integrity check." }); }
  }),
});
