/**
 * Test: Validate Upload-Post API key and analytics data collection
 */
import { describe, it, expect } from "vitest";

const API_KEY = process.env.UPLOAD_POST_API_KEY ?? "";
const FACEBOOK_PAGE_ID = "972545122618897";

describe("Upload-Post API key validation", () => {
  it("should have UPLOAD_POST_API_KEY set", () => {
    expect(API_KEY.length).toBeGreaterThan(0);
  });

  it("should authenticate successfully with the API key", async () => {
    const res = await fetch("https://api.upload-post.com/api/uploadposts/me", {
      headers: { Authorization: `Apikey ${API_KEY}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean; email: string; plan: string };
    expect(data.success).toBe(true);
    expect(data.email).toBe("support@yfitai.com");
  });

  it("should return analytics data for all 6 platforms", async () => {
    const platforms = "instagram,tiktok,linkedin,facebook,youtube,pinterest";
    const url = `https://api.upload-post.com/api/analytics/YFIT?platforms=${platforms}&page_id=${FACEBOOK_PAGE_ID}`;
    const res = await fetch(url, {
      headers: { Authorization: `Apikey ${API_KEY}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data).toHaveProperty("instagram");
    expect(data).toHaveProperty("tiktok");
    expect(data).toHaveProperty("linkedin");
    expect(data).toHaveProperty("facebook");
    expect(data).toHaveProperty("youtube");
    expect(data).toHaveProperty("pinterest");
  }, 30000);
});
