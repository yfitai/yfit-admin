/**
 * PDF Report Generator for YFIT Weekly Analytics Report
 * Uses pdfkit to produce a professional, readable PDF
 */
import PDFDocument from "pdfkit";
import type { FullAnalyticsData } from "./analytics.js";

// ─── Colors & Fonts ───────────────────────────────────────────────────────────
const GREEN = "#10b981";
const DARK = "#111827";
const GRAY = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";
const WHITE = "#ffffff";
const ACCENT = "#059669";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

function bounceRate(bounces: number, visits: number): number {
  if (!visits) return 0;
  return (bounces / visits) * 100;
}

function avgSessionMin(totaltime: number, visits: number): number {
  if (!visits) return 0;
  return totaltime / visits / 60;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function totalEngagement(p: { likes: number; comments: number; shares: number; saves: number }): number {
  return p.likes + p.comments + p.shares + p.saves;
}

function engagementRate(engagement: number, reach: number): number {
  if (!reach) return 0;
  return (engagement / reach) * 100;
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export async function generateWeeklyReport(
  data: FullAnalyticsData,
  aiAnalysis: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const contentW = pageW - 100; // margins 50 each side

    // ── Cover / Header ────────────────────────────────────────────────────────
    doc
      .rect(0, 0, pageW, 120)
      .fill(GREEN);

    doc
      .fillColor(WHITE)
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("YFIT AI", 50, 30);

    doc
      .fontSize(13)
      .font("Helvetica")
      .text("Weekly Performance Report", 50, 65);

    doc
      .fontSize(10)
      .text(`${data.weekStart}  →  ${data.weekEnd}`, 50, 88);

    doc.moveDown(5);

    // ── Executive Summary ─────────────────────────────────────────────────────
    doc.y = 140;
    sectionHeader(doc, "Executive Summary", pageW);

    const { social, website } = data;
    const totalReach = social.platforms.reduce((s, p) => s + p.reach, 0);
    const totalImpressions = social.platforms.reduce((s, p) => s + p.impressions, 0);
    const totalEngagementSum = social.platforms.reduce((s, p) => s + totalEngagement(p), 0);
    const overallEngRate = totalReach > 0 ? (totalEngagementSum / totalReach) * 100 : 0;
    const totalSocialVisits = Object.values(website.socialReferrals).reduce((s, v) => s + v, 0);

    const summaryMetrics = [
      { label: "Total Reach", value: formatNumber(totalReach), sub: "across 6 platforms" },
      { label: "Total Impressions", value: formatNumber(totalImpressions), sub: "across 6 platforms" },
      { label: "Engagement Rate", value: formatPercent(overallEngRate), sub: "likes + comments + shares + saves" },
      { label: "Website Visitors", value: formatNumber(website.stats.visitors), sub: `${formatNumber(website.stats.pageviews)} pageviews` },
      { label: "Social → Website", value: formatNumber(totalSocialVisits), sub: "visits from social referrals" },
      { label: "Bounce Rate", value: formatPercent(bounceRate(website.stats.bounces, website.stats.visits)), sub: `avg ${avgSessionMin(website.stats.totaltime, website.stats.visits).toFixed(1)} min/session` },
    ];

    metricGrid(doc, summaryMetrics, 50, doc.y + 10, contentW);

    // ── Platform Performance Table ────────────────────────────────────────────
    doc.addPage();
    sectionHeader(doc, "Platform Performance", pageW);

    const tableHeaders = ["Platform", "Followers", "Reach", "Impressions", "Engagement", "Eng. Rate", "→ Website"];
    const tableRows = social.platforms.map((p) => {
      const eng = totalEngagement(p);
      const er = engagementRate(eng, p.reach);
      const webVisits = website.socialReferrals[p.platform] ?? 0;
      return [
        capitalize(p.platform),
        formatNumber(p.followers),
        formatNumber(p.reach),
        formatNumber(p.impressions),
        formatNumber(eng),
        formatPercent(er),
        formatNumber(webVisits),
      ];
    });

    drawTable(doc, tableHeaders, tableRows, 50, doc.y + 15, contentW);

    // ── Website Analytics ─────────────────────────────────────────────────────
    doc.moveDown(2);
    sectionHeader(doc, "Website Analytics — yfitai.com", pageW);

    const websiteMetrics = [
      { label: "Unique Visitors", value: formatNumber(website.stats.visitors), sub: "last 7 days" },
      { label: "Pageviews", value: formatNumber(website.stats.pageviews), sub: "total pages viewed" },
      { label: "Sessions", value: formatNumber(website.stats.visits), sub: "unique sessions" },
      { label: "Bounce Rate", value: formatPercent(bounceRate(website.stats.bounces, website.stats.visits)), sub: "single-page sessions" },
      { label: "Avg. Session", value: `${avgSessionMin(website.stats.totaltime, website.stats.visits).toFixed(1)} min`, sub: "time on site" },
      { label: "Social Traffic", value: formatNumber(totalSocialVisits), sub: "from social platforms" },
    ];

    metricGrid(doc, websiteMetrics, 50, doc.y + 10, contentW);

    // Top pages
    if (website.topPages.length > 0) {
      doc.moveDown(1.5);
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(DARK)
        .text("Top Pages", 50, doc.y);
      doc.moveDown(0.5);

      website.topPages.slice(0, 8).forEach((page, i) => {
        const barWidth = Math.max(2, (page.y / (website.topPages[0]?.y || 1)) * (contentW - 200));
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(GRAY)
          .text(`${i + 1}.`, 50, doc.y, { width: 20 })
          .fillColor(DARK)
          .text(page.x || "/", 70, doc.y - doc.currentLineHeight(), { width: 200 })
          .fillColor(GRAY)
          .text(formatNumber(page.y), 280, doc.y - doc.currentLineHeight(), { width: 60, align: "right" });

        const barY = doc.y - doc.currentLineHeight() / 2;
        doc.rect(350, barY - 4, barWidth, 8).fill(GREEN);
        doc.moveDown(0.3);
      });
    }

    // Social referral breakdown
    if (totalSocialVisits > 0) {
      doc.moveDown(1.5);
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(DARK)
        .text("Social → Website Traffic", 50, doc.y);
      doc.moveDown(0.5);

      const sorted = Object.entries(website.socialReferrals)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a);

      sorted.forEach(([platform, visits]) => {
        const barWidth = Math.max(2, (visits / (sorted[0]?.[1] || 1)) * (contentW - 200));
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(DARK)
          .text(capitalize(platform), 50, doc.y, { width: 100 })
          .fillColor(GRAY)
          .text(formatNumber(visits), 155, doc.y - doc.currentLineHeight(), { width: 60, align: "right" });

        const barY = doc.y - doc.currentLineHeight() / 2;
        doc.rect(230, barY - 4, barWidth, 8).fill(ACCENT);
        doc.moveDown(0.3);
      });
    }

    // ── AI Analysis ───────────────────────────────────────────────────────────
    doc.addPage();
    sectionHeader(doc, "AI Analysis & Recommendations", pageW);

    doc
      .rect(50, doc.y + 10, contentW, 18)
      .fill(LIGHT_GRAY);

    doc
      .fontSize(9)
      .font("Helvetica-Oblique")
      .fillColor(GRAY)
      .text("Generated by AI based on this week's performance data", 55, doc.y + 13);

    doc.moveDown(2.5);

    // Render AI analysis text, wrapping paragraphs
    const paragraphs = aiAnalysis.split("\n").filter((l) => l.trim().length > 0);
    paragraphs.forEach((para) => {
      if (para.startsWith("##") || para.startsWith("**")) {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor(DARK)
          .text(para.replace(/^#+\s*/, "").replace(/\*\*/g, ""), 50, doc.y, { width: contentW });
      } else if (para.startsWith("-") || para.startsWith("•")) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(DARK)
          .text(`  ${para}`, 50, doc.y, { width: contentW });
      } else {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(DARK)
          .text(para, 50, doc.y, { width: contentW });
      }
      doc.moveDown(0.4);
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 40;
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(GRAY)
      .text(
        `YFIT AI — Weekly Analytics Report — Generated ${new Date().toLocaleString("en-CA", { timeZone: "America/Chicago" })} CDT`,
        50,
        footerY,
        { width: contentW, align: "center" }
      );

    doc.end();
  });
}

// ─── Layout Helpers ───────────────────────────────────────────────────────────

function sectionHeader(doc: PDFKit.PDFDocument, title: string, pageW: number) {
  const y = doc.y;
  doc.rect(50, y, pageW - 100, 28).fill(GREEN);
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor(WHITE)
    .text(title, 58, y + 8);
  doc.moveDown(0.5);
}

function metricGrid(
  doc: PDFKit.PDFDocument,
  metrics: Array<{ label: string; value: string; sub: string }>,
  x: number,
  y: number,
  width: number
) {
  const cols = 3;
  const cellW = width / cols;
  const cellH = 58;

  metrics.forEach((m, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = x + col * cellW;
    const cy = y + row * (cellH + 8);

    doc.rect(cx, cy, cellW - 8, cellH).fill(LIGHT_GRAY);

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor(GREEN)
      .text(m.value, cx + 8, cy + 8, { width: cellW - 16 });

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor(DARK)
      .text(m.label, cx + 8, cy + 32, { width: cellW - 16 });

    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor(GRAY)
      .text(m.sub, cx + 8, cy + 44, { width: cellW - 16 });
  });

  // Advance doc.y past the grid
  const rows = Math.ceil(metrics.length / cols);
  doc.y = y + rows * (cellH + 8) + 10;
}

function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  x: number,
  y: number,
  width: number
) {
  const colW = width / headers.length;
  const rowH = 20;

  // Header row
  doc.rect(x, y, width, rowH).fill(DARK);
  headers.forEach((h, i) => {
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor(WHITE)
      .text(h, x + i * colW + 4, y + 6, { width: colW - 8 });
  });

  // Data rows
  rows.forEach((row, ri) => {
    const ry = y + (ri + 1) * rowH;
    doc.rect(x, ry, width, rowH).fill(ri % 2 === 0 ? WHITE : LIGHT_GRAY);
    row.forEach((cell, ci) => {
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(DARK)
        .text(cell, x + ci * colW + 4, ry + 6, { width: colW - 8 });
    });
  });

  doc.y = y + (rows.length + 1) * rowH + 10;
}
