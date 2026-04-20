/**
 * yfit-admin — Express server
 *
 * Internal admin service for YFIT AI.
 * Hosts the accounting dashboard and analytics system.
 * Deployed on Railway at admin.yfitai.com
 *
 * Routes:
 *   GET  /health                    — health check for Railway
 *   POST /api/send-monthly-report   — n8n webhook: generate + email monthly P&L
 *   POST /api/send-year-end-report  — n8n webhook: generate + email year-end statement
 *   POST /api/send-weekly-report    — n8n webhook: generate + email weekly analytics
 *   ALL  /api/trpc/*                — tRPC procedures (accounting + analytics)
 *   GET  /*                         — serve React frontend (accounting dashboard)
 */

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { router, createContext } from "./_core/trpc.js";
import { accountingRouter } from "./accountingRouter.js";
import { analyticsRouter } from "./analyticsRouter.js";
import { ENV } from "./env.js";

// ─── App Router ───────────────────────────────────────────────────────────────

const appRouter = router({
  accounting: accountingRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;

// ─── Express Setup ────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());

  // ── Health check ────────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "yfit-admin", timestamp: new Date().toISOString() });
  });

  // ── POST /api/send-monthly-report — called by n8n ───────────────────────────
  app.post("/api/send-monthly-report", async (req, res) => {
    try {
      const now = new Date();
      const year = req.body?.year ?? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
      const month = req.body?.month ?? (now.getMonth() === 0 ? 12 : now.getMonth());

      const { syncStripeIncomeForMonth, getStripeIncomeForMonth } = await import("./stripeSync.js");
      const { getExpensesForMonth } = await import("./csvImporter.js");
      const { generateMonthlyReport } = await import("./accountingPdf.js");
      const { sendMonthlyReport } = await import("./accountingEmail.js");
      const { getDb } = await import("./db.js");
      const { monthlyReports } = await import("../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      await syncStripeIncomeForMonth(year, month);

      const income = await getStripeIncomeForMonth(year, month);
      const expenseData = await getExpensesForMonth(year, month);

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

      const pdfBuffer = await generateMonthlyReport(reportData);
      const emailResult = await sendMonthlyReport(pdfBuffer, year, month, reportData);

      const db = await getDb();
      if (db) {
        const period = `${year}-${String(month).padStart(2, "0")}`;
        const existing = await db.select({ id: monthlyReports.id }).from(monthlyReports).where(eq(monthlyReports.period, period)).limit(1);
        const dbData = {
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
          await db.update(monthlyReports).set(dbData).where(eq(monthlyReports.period, period));
        } else {
          await db.insert(monthlyReports).values(dbData);
        }
      }

      res.json({ success: true, year, month, emailSent: emailResult.success, messageId: emailResult.messageId });
    } catch (err) {
      console.error("[/api/send-monthly-report]", err);
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ── POST /api/send-year-end-report — called by n8n ──────────────────────────
  app.post("/api/send-year-end-report", async (req, res) => {
    try {
      const year = req.body?.year ?? new Date().getFullYear() - 1;

      const { getDb } = await import("./db.js");
      const { monthlyReports } = await import("../drizzle/schema.js");
      const { and, gte, lte } = await import("drizzle-orm");
      const { generateYearEndStatement } = await import("./accountingPdf.js");
      const { sendYearEndStatement } = await import("./accountingEmail.js");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const reports = await db
        .select()
        .from(monthlyReports)
        .where(
          and(
            gte(monthlyReports.period, `${year}-01`),
            lte(monthlyReports.period, `${year}-12`)
          )
        );

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

      res.json({ success: true, year, emailSent: emailResult.success, messageId: emailResult.messageId });
    } catch (err) {
      console.error("[/api/send-year-end-report]", err);
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ── POST /api/send-weekly-report — called by n8n ────────────────────────────
  app.post("/api/send-weekly-report", async (req, res) => {
    try {
      const days = req.body?.days ?? 7;

      const { fetchFullAnalytics } = await import("./analytics.js");
      const { generateWeeklyReport } = await import("./reportGenerator.js");
      const { sendWeeklyReport } = await import("./emailReport.js");
      const { invokeLLM } = await import("./_core/llm.js");

      console.log(`[Analytics] Generating weekly report for last ${days} days...`);

      const data = await fetchFullAnalytics(days);

      // Build AI prompt
      const { social, website } = data;
      const platformSummary = social.platforms
        .map((p) => {
          const eng = p.likes + p.comments + p.shares + p.saves;
          const er = p.reach > 0 ? ((eng / p.reach) * 100).toFixed(1) : "0.0";
          return `${p.platform.toUpperCase()}: reach=${p.reach}, impressions=${p.impressions}, followers=${p.followers}, engagement=${eng} (${er}%)`;
        })
        .join("\n");

      let aiAnalysis = "AI analysis unavailable — please review the data above manually.";
      try {
        const aiResponse = await invokeLLM({
          messages: [{
            role: "user",
            content: `You are analyzing a week of social media and website performance for YFIT AI, a fitness and nutrition app.

REPORT PERIOD: ${data.weekStart} to ${data.weekEnd}

SOCIAL MEDIA PERFORMANCE (last ${days} days):
${platformSummary}

WEBSITE PERFORMANCE (yfitai.com, last ${days} days):
- Unique visitors: ${website.stats.visitors}
- Pageviews: ${website.stats.pageviews}
- Sessions: ${website.stats.visits}

Please write a brief weekly performance summary. Keep it under 200 words.`,
          }],
        });
        aiAnalysis = aiResponse.choices[0]?.message?.content ?? aiAnalysis;
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

      res.json({
        success: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        summary,
      });
    } catch (err) {
      console.error("[/api/send-weekly-report]", err);
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ── tRPC API ─────────────────────────────────────────────────────────────────
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: ({ req, res }) => createContext({ req, res }),
    })
  );

  // ── 404 handler ──────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // ── Start ─────────────────────────────────────────────────────────────────────
  const port = ENV.port;
  server.listen(port, () => {
    console.log(`[yfit-admin] Server running on http://localhost:${port}/`);
    console.log(`[yfit-admin] Environment: ${ENV.isProduction ? "production" : "development"}`);
  });
}

startServer().catch(console.error);
