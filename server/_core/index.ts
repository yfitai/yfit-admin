import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { fetchFullAnalytics } from "../analytics";
import { generateWeeklyReport } from "../reportGenerator";
import { sendWeeklyReport } from "../emailReport";
import { invokeLLM } from "./llm";
import type { FullAnalyticsData } from "../analytics";
import { syncStripeIncomeForMonth, getStripeIncomeForMonth } from "../stripeSync";
import { getExpensesForMonth } from "../csvImporter";
import { generateMonthlyReport, generateYearEndStatement } from "../accountingPdf";
import { sendMonthlyReport, sendYearEndStatement } from "../accountingEmail";
import { getDb } from "../db";
import { monthlyReports } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function buildAIPrompt(data: FullAnalyticsData): string {
  const { social, website } = data;
  const platformSummary = social.platforms
    .map((p) => {
      const eng = p.likes + p.comments + p.shares + p.saves;
      const er = p.reach > 0 ? ((eng / p.reach) * 100).toFixed(1) : "0.0";
      const webVisits = website.socialReferrals[p.platform] ?? 0;
      return `${p.platform.toUpperCase()}: reach=${p.reach}, impressions=${p.impressions}, followers=${p.followers}, engagement=${eng} (${er}%), website_referrals=${webVisits}`;
    })
    .join("\n");
  const totalReach = social.platforms.reduce((s, p) => s + p.reach, 0);
  const totalEng = social.platforms.reduce((s, p) => s + p.likes + p.comments + p.shares + p.saves, 0);
  const totalSocialVisits = Object.values(website.socialReferrals).reduce((s, v) => s + v, 0);
  return `You are analyzing a week of social media and website performance for YFIT AI, a fitness and nutrition app.
REPORT PERIOD: ${data.weekStart} to ${data.weekEnd}
SOCIAL MEDIA PERFORMANCE (last 7 days):
${platformSummary}
TOTALS:
- Total reach: ${totalReach}
- Total engagement: ${totalEng}
- Overall engagement rate: ${totalReach > 0 ? ((totalEng / totalReach) * 100).toFixed(2) : "0.00"}%
WEBSITE PERFORMANCE (yfitai.com):
- Unique visitors: ${website.stats.visitors}
- Pageviews: ${website.stats.pageviews}
- Bounce rate: ${website.stats.visits > 0 ? ((website.stats.bounces / website.stats.visits) * 100).toFixed(1) : "0"}%
- Social referrals: ${totalSocialVisits}
Please write a plain-language weekly performance summary. Structure:
## What Went Well
## What Needs Attention
## Top 3 Action Items for Next Week
## Platform to Focus On
Under 300 words. Be specific with numbers.`;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ── Webhook: POST /api/send-weekly-report ─────────────────────────────────
  // Called by n8n every Monday at 6 AM CDT to generate and email the weekly report.
  // Optionally accepts { days: number } in request body (defaults to 7).
  app.post("/api/send-weekly-report", async (req, res) => {
    const days = Number(req.body?.days ?? 7);
    console.log(`[Analytics] Generating weekly report for last ${days} days...`);
    try {
      const data = await fetchFullAnalytics(days);

      let aiAnalysis = "AI analysis unavailable — please review the data above manually.";
      try {
        const aiResponse = await invokeLLM({
          messages: [{ role: "user", content: buildAIPrompt(data) }],
        });
        aiAnalysis = (aiResponse as { choices: Array<{ message: { content: string } }> })
          .choices[0]?.message?.content ?? aiAnalysis;
      } catch (err) {
        console.error("[Analytics] AI analysis failed:", err);
      }

      const pdfBuffer = await generateWeeklyReport(data, aiAnalysis);
      const summary = {
        totalReach: data.social.platforms.reduce((s, p) => s + p.reach, 0),
        totalImpressions: data.social.platforms.reduce((s, p) => s + p.impressions, 0),
        websiteVisitors: data.website.stats.visitors,
        socialReferrals: Object.values(data.website.socialReferrals).reduce((s, v) => s + v, 0),
      };

      const emailResult = await sendWeeklyReport(pdfBuffer, data.weekStart, data.weekEnd, summary);
      console.log(`[Analytics] Email result:`, emailResult);

      res.json({
        success: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        summary,
      });
    } catch (err) {
      console.error("[Analytics] Report generation failed:", err);
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // ── Alias: POST /api/weekly-report ─────────────────────────────────────────
  // AUDIT FIX (Session 19, Jul 15 2026): n8n was calling /api/weekly-report
  // (old Railway URL). Added alias so both old and new URL work while n8n is updated.
  // TODO: Update n8n HTTP node URL to https://admin.yfitai.com/api/send-weekly-report
  app.post("/api/weekly-report", async (req, res) => {
    // Forward to the canonical handler
    req.url = "/api/send-weekly-report";
    app._router.handle(req, res, () => {});
  });

  // ── Webhook: POST /api/send-monthly-report ──────────────────────────────────
  // Called by n8n on the first Monday after month-end.
  // Syncs Stripe income, generates PDF, and emails to support@yfitai.com.
  // Body: { year: number, month: number } — defaults to previous month if omitted.
  app.post("/api/send-monthly-report", async (req, res) => {
    try {
      const now = new Date();
      // Default to previous month
      let year = Number(req.body?.year ?? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()));
      let month = Number(req.body?.month ?? (now.getMonth() === 0 ? 12 : now.getMonth()));

      console.log(`[Accounting] Generating monthly report for ${year}-${String(month).padStart(2, "0")}...`);

      // 1. Sync Stripe income for the month
      const syncResult = await syncStripeIncomeForMonth(year, month);
      console.log(`[Accounting] Stripe sync: ${syncResult.synced} new, ${syncResult.skipped} skipped`);

      // 2. Get income and expense data
      const income = await getStripeIncomeForMonth(year, month);
      const expenseData = await getExpensesForMonth(year, month);

      // 3. Compute report
      const netGstRemittableCadCents = income.gstCollectedCadCents - expenseData.totalGstItcCadCents;
      const netProfitCadCents = income.netRevenueCadCents - expenseData.totalExpensesCadCents;

      const reportData = {
        year,
        month,
        grossRevenueCadCents: income.grossRevenueCadCents,
        totalRefundsCadCents: income.totalRefundsCadCents,
        stripeFeesTotalCadCents: income.stripeFeesTotalCadCents,
        netRevenueCadCents: income.netRevenueCadCents,
        gstCollectedCadCents: income.gstCollectedCadCents,
        totalExpensesCadCents: expenseData.totalExpensesCadCents,
        totalGstItcCadCents: expenseData.totalGstItcCadCents,
        netGstRemittableCadCents,
        netProfitCadCents,
        expensesByCategory: expenseData.byCategory,
        incomeRows: income.rows,
        expenseRows: expenseData.rows,
      };

      // 4. Generate PDF
      const pdfBuffer = await generateMonthlyReport(reportData);

      // 5. Send email
      const emailResult = await sendMonthlyReport(pdfBuffer, year, month, {
        grossRevenueCadCents: income.grossRevenueCadCents,
        netRevenueCadCents: income.netRevenueCadCents,
        totalExpensesCadCents: expenseData.totalExpensesCadCents,
        netProfitCadCents,
        gstCollectedCadCents: income.gstCollectedCadCents,
        totalGstItcCadCents: expenseData.totalGstItcCadCents,
        netGstRemittableCadCents,
      });

      // 6. Cache report in DB
      try {
        const db = await getDb();
        if (db) {
          const period = `${year}-${String(month).padStart(2, "0")}`;
          const existing = await db.select({ id: monthlyReports.id }).from(monthlyReports).where(eq(monthlyReports.period, period)).limit(1);
          const reportRow = {
            period,
            grossRevenueCadCents: income.grossRevenueCadCents,
            totalRefundsCadCents: income.totalRefundsCadCents,
            stripeFeesTotalCadCents: income.stripeFeesTotalCadCents,
            netRevenueCadCents: income.netRevenueCadCents,
            gstCollectedCadCents: income.gstCollectedCadCents,
            totalExpensesCadCents: expenseData.totalExpensesCadCents,
            totalGstItcCadCents: expenseData.totalGstItcCadCents,
            netGstRemittableCadCents,
            netProfitCadCents,
          };
          if (existing.length > 0) {
            await db.update(monthlyReports).set(reportRow).where(eq(monthlyReports.period, period));
          } else {
            await db.insert(monthlyReports).values(reportRow);
          }
        }
      } catch (dbErr) {
        console.warn("[Accounting] DB cache failed:", dbErr);
      }

      res.json({
        success: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
        period: `${year}-${String(month).padStart(2, "0")}`,
        syncResult,
        summary: {
          grossRevenueCadCents: income.grossRevenueCadCents,
          netRevenueCadCents: income.netRevenueCadCents,
          totalExpensesCadCents: expenseData.totalExpensesCadCents,
          netProfitCadCents,
          netGstRemittableCadCents,
        },
      });
    } catch (err) {
      console.error("[Accounting] Monthly report failed:", err);
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // ── Webhook: POST /api/send-year-end-report ───────────────────────────────
  // Called once per year (December 31) by n8n to generate the annual statement.
  // Body: { year: number } — defaults to current year.
  app.post("/api/send-year-end-report", async (req, res) => {
    try {
      const year = Number(req.body?.year ?? new Date().getFullYear());
      console.log(`[Accounting] Generating year-end statement for ${year}...`);

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const reports = await db
        .select()
        .from(monthlyReports)
        .where(and(gte(monthlyReports.period, `${year}-01`), lte(monthlyReports.period, `${year}-12`)))
        .orderBy(monthlyReports.period);

      const totals = {
        grossRevenueCadCents: reports.reduce((s, r) => s + r.grossRevenueCadCents, 0),
        totalRefundsCadCents: reports.reduce((s, r) => s + r.totalRefundsCadCents, 0),
        stripeFeesTotalCadCents: reports.reduce((s, r) => s + r.stripeFeesTotalCadCents, 0),
        netRevenueCadCents: reports.reduce((s, r) => s + r.netRevenueCadCents, 0),
        gstCollectedCadCents: reports.reduce((s, r) => s + r.gstCollectedCadCents, 0),
        totalExpensesCadCents: reports.reduce((s, r) => s + r.totalExpensesCadCents, 0),
        totalGstItcCadCents: reports.reduce((s, r) => s + r.totalGstItcCadCents, 0),
        netGstRemittableCadCents: reports.reduce((s, r) => s + r.netGstRemittableCadCents, 0),
        netProfitCadCents: reports.reduce((s, r) => s + r.netProfitCadCents, 0),
      };

      const pdfBuffer = await generateYearEndStatement(year, reports, totals);
      const emailResult = await sendYearEndStatement(pdfBuffer, year, totals);

      res.json({
        success: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
        year,
        monthsCovered: reports.length,
        totals,
      });
    } catch (err) {
      console.error("[Accounting] Year-end report failed:", err);
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
