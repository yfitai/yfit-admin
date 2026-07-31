/**
 * Analytics tRPC Router
 * Exposes endpoints for fetching analytics data and generating the weekly PDF report
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { fetchFullAnalytics, fetchSocialAnalytics, fetchWebsiteAnalytics } from "./analytics";
import { generateWeeklyReport } from "./reportGenerator";
import { sendWeeklyReport } from "./emailReport";
import { invokeLLM } from "./_core/llm";
import type { FullAnalyticsData } from "./analytics";

function buildAIPrompt(data: FullAnalyticsData): string {
  const { social, website } = data;

  const platformSummary = social.platforms
    .map((p) => {
      const eng = p.likes + p.comments + p.shares + p.saves;
      const er = p.reach > 0 ? ((eng / p.reach) * 100).toFixed(1) : "0.0";
      return `${p.platform.toUpperCase()}: reach=${p.reach}, impressions=${p.impressions}, followers=${p.followers}, profile_views=${p.profileViews}, engagement=${eng} (${er}%)`;
    })
    .join("\n");

  const totalReach = social.platforms.reduce((s, p) => s + p.reach, 0);
  const totalEng = social.platforms.reduce((s, p) => s + p.likes + p.comments + p.shares + p.saves, 0);
  const totalFollowers = social.platforms.reduce((s, p) => s + p.followers, 0);
  const totalProfileViews = social.platforms.reduce((s, p) => s + p.profileViews, 0);

  return `You are analyzing a week of social media performance for YFIT AI, a fitness and nutrition app.

REPORT PERIOD: ${data.weekStart} to ${data.weekEnd}

SOCIAL MEDIA PERFORMANCE (last 7 days):
${platformSummary}

TOTALS:
- Total reach across all platforms: ${totalReach}
- Total engagement (likes + comments + shares + saves): ${totalEng}
- Overall engagement rate: ${totalReach > 0 ? ((totalEng / totalReach) * 100).toFixed(2) : "0.00"}%
- Total followers across all platforms: ${totalFollowers}
- Total profile views: ${totalProfileViews}

NOTE: Website analytics (yfitai.com) are not yet tracked. Focus analysis entirely on social media performance.

Please write a plain-language weekly performance summary for the YFIT AI team. Use simple, direct language (aim for 7th grade reading level). Structure your response as follows:

## What Went Well
(2-3 sentences about the strongest results this week)

## What Needs Attention
(2-3 sentences about the weakest areas or concerning trends)

## Top 3 Action Items for Next Week
- Action 1: (specific, actionable recommendation)
- Action 2: (specific, actionable recommendation)
- Action 3: (specific, actionable recommendation)

## Platform to Focus On
(Name one platform that has the best opportunity for growth right now and explain why in 1-2 sentences)

Keep the entire response under 300 words. Be specific — mention actual numbers from the data.`;
}

async function buildAndSendReport(days: number) {
  // 1. Fetch all data
  const data = await fetchFullAnalytics(days);

  // 2. Generate AI analysis
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

  // 3. Generate PDF
  const pdfBuffer = await generateWeeklyReport(data, aiAnalysis);

  const summary = {
    totalReach: data.social.platforms.reduce((s, p) => s + p.reach, 0),
    totalImpressions: data.social.platforms.reduce((s, p) => s + p.impressions, 0),
    websiteVisitors: data.website.stats.visitors,
    socialReferrals: Object.values(data.website.socialReferrals).reduce((s, v) => s + v, 0),
  };

  return { data, pdfBuffer, summary, aiAnalysis };
}

export const analyticsRouter = router({
  // Get raw social analytics data (for dashboard display)
  getSocialStats: publicProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(7) }))
    .query(async ({ input }) => {
      return fetchSocialAnalytics(input.days);
    }),

  // Get raw website analytics data
  getWebsiteStats: publicProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(7) }))
    .query(async ({ input }) => {
      return fetchWebsiteAnalytics(input.days);
    }),

  // Generate the full weekly PDF report and return as base64 (no email)
  generateReport: publicProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(7) }))
    .mutation(async ({ input }) => {
      const { data, pdfBuffer, summary } = await buildAndSendReport(input.days);
      return {
        success: true,
        pdfBase64: pdfBuffer.toString("base64"),
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        summary,
      };
    }),

  // Generate PDF and email it to support@yfitai.com
  sendReport: publicProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(7) }))
    .mutation(async ({ input }) => {
      const { data, pdfBuffer, summary } = await buildAndSendReport(input.days);

      const emailResult = await sendWeeklyReport(
        pdfBuffer,
        data.weekStart,
        data.weekEnd,
        summary
      );

      return {
        success: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        summary,
      };
    }),

  // Get full analytics data as JSON (for n8n to call directly)
  getFullData: publicProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(7) }))
    .query(async ({ input }) => {
      return fetchFullAnalytics(input.days);
    }),
});
