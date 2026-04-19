/**
 * Email delivery module for YFIT Weekly Analytics Report
 * Uses Resend API to send the PDF report to support@yfitai.com
 */
import { ENV } from "./env.js";

interface SendReportResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWeeklyReport(
  pdfBuffer: Buffer,
  weekStart: string,
  weekEnd: string,
  summary: {
    totalReach: number;
    totalImpressions: number;
    websiteVisitors: number;
    socialReferrals: number;
  }
): Promise<SendReportResult> {
  const { resendApiKey, reportRecipient, reportSender } = ENV;

  if (!resendApiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const subject = `YFIT AI — Weekly Analytics Report (${weekStart} to ${weekEnd})`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; margin: 0; padding: 0; background: #f9fafb; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #10b981; padding: 32px 40px; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px 40px; }
    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .metric { background: #f3f4f6; border-radius: 8px; padding: 16px; }
    .metric .value { font-size: 28px; font-weight: 700; color: #10b981; }
    .metric .label { font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .cta { margin: 24px 0; }
    .footer { padding: 20px 40px; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>YFIT AI — Weekly Report</h1>
      <p>${weekStart} &rarr; ${weekEnd}</p>
    </div>
    <div class="body">
      <p>Your weekly performance summary is attached as a PDF. Here are the headline numbers:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
        <tr>
          <td width="50%" style="padding: 8px;">
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px;">
              <div style="font-size: 28px; font-weight: 700; color: #10b981;">${formatNumber(summary.totalReach)}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Total Reach</div>
            </div>
          </td>
          <td width="50%" style="padding: 8px;">
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px;">
              <div style="font-size: 28px; font-weight: 700; color: #10b981;">${formatNumber(summary.totalImpressions)}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Total Impressions</div>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding: 8px;">
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px;">
              <div style="font-size: 28px; font-weight: 700; color: #10b981;">${formatNumber(summary.websiteVisitors)}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Website Visitors</div>
            </div>
          </td>
          <td width="50%" style="padding: 8px;">
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px;">
              <div style="font-size: 28px; font-weight: 700; color: #10b981;">${formatNumber(summary.socialReferrals)}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Social &rarr; Website</div>
            </div>
          </td>
        </tr>
      </table>
      <p style="color: #6b7280; font-size: 14px;">Open the attached PDF for the full breakdown including platform-by-platform performance, top pages, social referral traffic, and AI-generated recommendations.</p>
    </div>
    <div class="footer">
      <p>YFIT AI &bull; Automated weekly report &bull; Every Monday morning</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const filename = `YFIT-Analytics-${weekStart}-to-${weekEnd}.pdf`;

  const payload = {
    from: `YFIT Analytics <${reportSender}>`,
    to: [reportRecipient],
    subject,
    html: htmlBody,
    attachments: [
      {
        filename,
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
    });

    const data = (await res.json()) as { id?: string; message?: string; name?: string };

    if (!res.ok) {
      return {
        success: false,
        error: `Resend error ${res.status}: ${data.message ?? JSON.stringify(data)}`,
      };
    }

    return { success: true, messageId: data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
