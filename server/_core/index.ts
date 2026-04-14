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
