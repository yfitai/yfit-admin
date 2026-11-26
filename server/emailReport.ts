/** Email presentation and transport. A successful API response is acceptance, not delivery confirmation. */
import { ENV } from "./_core/env";
import type { ReportSummary } from "./reportingModel";
import {
  goHostRows,
  goSourceRows,
  goSourceContextRows,
  canonicalGoHeadline,
} from "./goReportPresentation";

interface SendReportResult {
  /** Resend accepted the request; this does not confirm inbox delivery. */
  success: boolean;
  deliveryStatus: "accepted" | "rejected" | "unknown";
  messageId?: string;
  error?: string;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!
  );
}

function formatNumber(value: number | null): string {
  return value === null || !Number.isFinite(value)
    ? "Unavailable"
    : value.toLocaleString("en-CA", { maximumFractionDigits: 2 });
}

/** Kept pure so preview/tests never need to invoke the delivery API. */
export function buildWeeklyReportEmail(
  weekStart: string,
  weekEnd: string,
  summary: ReportSummary
): string {
  const websiteUsable =
    summary.websiteStatus === "available" ||
    summary.websiteStatus === "partial";
  const metrics = [
    [
      `${formatNumber(summary.verifiedPlatforms)} of ${formatNumber(summary.platformsTotal)}`,
      "Social platforms with a verified views or impressions figure for the selected dates",
    ],
    [
      websiteUsable ? formatNumber(summary.websiteVisitors) : "Unavailable",
      "Website recorded visitors (Umami)",
    ],
    [
      formatNumber(summary.goPageviews),
      "Go webpage recorded pageviews (Umami)",
    ],
    [formatNumber(summary.goVisitors), "Go webpage recorded visitors (Umami)"],
    [
      websiteUsable ? formatNumber(summary.socialReferrals) : "Unavailable",
      "Website-side recorded social referrers",
    ],
  ];
  // Go details have their own prominent section; historical summaries keep the existing cards.
  if (summary.goDetails) metrics.splice(2, 2);
  const table = (headers: string[], rows: string[][]) =>
    `<table width="100%" cellpadding="8" cellspacing="0" style="font-size:13px;border-collapse:collapse;overflow-wrap:anywhere;"><tr>${headers.map(header => `<th align="left" style="background:#111827;color:white;">${escapeHtml(header)}</th>`).join("")}</tr>${rows.map(row => `<tr>${row.map(cell => `<td style="border-bottom:1px solid #e5e7eb;">${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</table>`;
  const sourceContext = goSourceContextRows(summary);
  const goSection = summary.goDetails
    ? `<section style="border:2px solid #10b981;padding:16px;margin:16px 0;">
    <h2 style="font-size:20px;margin:0 0 12px;">Go /go - recorded arrivals</h2>
    <p><strong>${escapeHtml(canonicalGoHeadline(summary))}</strong></p>
    <p><strong>Combined Go pageviews: ${escapeHtml(formatNumber(summary.goPageviews))}</strong><br>Cross-host visitors: unavailable (not summed).</p>
    ${table(["Host", "Go pageviews", "Native measured visitors", "Evidence"], goHostRows(summary))}
    <h3>Campaign-source PAGEVIEWS for /go</h3>
    <p>Source status: ${escapeHtml(summary.goDetails.sourceStatus)}. Not social outbound clicks or unique people. Partial/context is not certified; unavailable is not zero.</p>
    ${table(["Campaign source", "Combined Go pageviews"], goSourceRows(summary))}
    ${sourceContext.length ? table(["Host", "Campaign source", "Pageviews", "Evidence"], sourceContext) : ""}
    <p style="font-size:13px;color:#6b7280;">${escapeHtml(summary.goDetails.note)}</p>
  </section>`
    : "";
  const cards = metrics
    .map(
      ([value, label]) => `
    <tr><td style="padding:8px 0;"><div style="background:#f3f4f6;border-radius:8px;padding:16px;">
      <div style="font-size:24px;font-weight:700;color:#059669;">${escapeHtml(value)}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:5px;">${escapeHtml(label)}</div>
    </div></td></tr>`
    )
    .join("");
  const websiteStatus =
    summary.websiteStatus === "unavailable"
      ? "Unavailable (NoWebsiteData)"
      : summary.websiteStatus;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111827;margin:0;padding:0;background:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#10b981;padding:28px 32px;">
      <h1 style="color:white;margin:0;font-size:24px;">YFIT AI - Weekly Analytics Report</h1>
      <p style="color:white;margin:8px 0 0;">${escapeHtml(weekStart)} to ${escapeHtml(weekEnd)} (inclusive)</p>
      <p style="color:white;margin:6px 0 0;font-size:13px;">Manitoba time (UTC-5)</p>
    </div>
    <div style="padding:24px 32px;">
      <p>The attached PDF shows native measurements, data availability and what the numbers tell us for the selected period.</p>
      <p><strong>Website data status:</strong> ${escapeHtml(websiteStatus)}</p>
      <p style="white-space:pre-wrap;">${escapeHtml(summary.coverageNote)}</p>
      ${goSection}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table>
      <p style="font-size:14px;color:#6b7280;">Unavailable is not a measured zero. A recorded zero applies only to that available measurement. Missing tracking data does not establish whether marketing succeeded or failed.</p>
      <p style="font-size:14px;color:#6b7280;">Native reach, views and impressions are not added together. Recorded visitors are not verified unique people across devices or platforms. Go webpage recording, native outbound clicks, pin clicks and profile visits are separate measurements.</p>
      <p>Open the PDF for each metric's scope, source dates, status, as-of time, limitations and the plain-language section, <strong>What the numbers tell us</strong>.</p>
    </div>
    <div style="padding:18px 32px;border-top:1px solid #e5e7eb;">
      <p style="color:#6b7280;font-size:12px;margin:0;">YFIT AI | Analytics report | Version ${escapeHtml(summary.reportVersion)}</p>
    </div>
  </div>
</body></html>`;
}

export async function sendWeeklyReport(
  pdfBuffer: Buffer,
  weekStart: string,
  weekEnd: string,
  summary: ReportSummary
): Promise<SendReportResult> {
  const { resendApiKey, reportRecipient, reportSender } = ENV;
  if (!resendApiKey)
    return {
      success: false,
      deliveryStatus: "rejected",
      error: "RESEND_API_KEY not configured",
    };

  const payload = {
    from: `YFIT Analytics <${reportSender}>`,
    to: [reportRecipient],
    subject: `YFIT AI — Weekly Analytics Report (${weekStart} to ${weekEnd})`,
    html: buildWeeklyReportEmail(weekStart, weekEnd, summary),
    attachments: [
      {
        filename: `YFIT-Analytics-${weekStart}-to-${weekEnd}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ],
  };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
      redirect: "error",
    });
    if (!res.ok) {
      return {
        success: false,
        deliveryStatus: "rejected",
        error: `Resend error ${res.status}: Provider rejected the request. Upstream response text is not retained.`,
      };
    }
    const data = (await res.json()) as { id?: unknown };
    if (typeof data.id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(data.id))
      return {
        success: false,
        deliveryStatus: "unknown",
        error:
          "Resend response did not include an acceptance message ID. Check the provider before retrying.",
      };
    return { success: true, deliveryStatus: "accepted", messageId: data.id };
  } catch {
    return {
      success: false,
      deliveryStatus: "unknown",
      error:
        "Email send outcome is unknown: read failed or timed out. Check the provider before retrying to avoid a duplicate report.",
    };
  }
}
