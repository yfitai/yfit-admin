import type { RequestHandler } from "express";
import { buildAndSendReport } from "./reportService";
import { parseReportRequest } from "./reportingSummary";

/** Both existing REST paths use this handler; no new schedule or delivery destination. */
export const weeklyReportHandler: RequestHandler = async (req, res) => {
  let input;
  try { input = parseReportRequest(req.body); }
  catch {
    res.status(400).json({ success: false, error: "Choose 1-90 whole days, or valid startDate and endDate for completed days in YYYY-MM-DD format." });
    return;
  }
  try {
    const result = await buildAndSendReport(input);
    console.log(`[Analytics] Report ${result.reportId}: email ${result.deliveryStatus}; archive ${result.archiveStatus}.`);
    res.json(result);
  } catch {
    console.error("[Analytics] Report generation failed. No success or delivery is confirmed.");
    res.status(500).json({ success: false, error: "Report generation failed. No report delivery is confirmed." });
  }
};
