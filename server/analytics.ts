/**
 * Analytics data collection module
 * Fetches data from Umami (website analytics) and Upload-Post (social media analytics)
 */
import { ENV } from "./env.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

export interface UmamiMetric {
  x: string; // value (e.g. page path, referrer domain)
  y: number; // count
}

export interface UmamiPageviews {
  pageviews: Array<{ x: string; y: number }>;
  sessions: Array<{ x: string; y: number }>;
}

export interface SocialPlatformMetrics {
  platform: string;
  followers: number;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  profileViews: number;
  timeseries: Array<{ date: string; value: number }>;
}

export interface SocialAnalyticsResult {
  platforms: SocialPlatformMetrics[];
  fetchedAt: string;
}

export interface WebsiteAnalyticsResult {
  stats: UmamiStats;
  topPages: UmamiMetric[];
  referrers: UmamiMetric[];
  socialReferrals: Record<string, number>; // platform → visit count from that platform
  fetchedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} from ${url}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function msAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

// ─── Social Media Analytics (Upload-Post) ─────────────────────────────────────

export async function fetchSocialAnalytics(days = 7): Promise<SocialAnalyticsResult> {
  const apiKey = ENV.uploadPostApiKey;
  const pageId = ENV.facebookPageId;
  const platforms = "instagram,tiktok,linkedin,facebook,youtube,pinterest";

  const url = `https://api.upload-post.com/api/analytics/YFIT?platforms=${platforms}&page_id=${pageId}`;
  const raw = (await fetchJson(url, { Authorization: `Apikey ${apiKey}` })) as Record<string, unknown>;

  const PLATFORM_NAMES = ["instagram", "tiktok", "linkedin", "facebook", "youtube", "pinterest"];

  const results: SocialPlatformMetrics[] = PLATFORM_NAMES.map((name) => {
    const p = (raw[name] ?? {}) as Record<string, unknown>;
    return {
      platform: name,
      followers: Number(p.followers ?? 0),
      reach: Number(p.reach ?? 0),
      impressions: Number(p.impressions ?? 0),
      likes: Number(p.likes ?? 0),
      comments: Number(p.comments ?? 0),
      shares: Number(p.shares ?? 0),
      saves: Number(p.saves ?? 0),
      profileViews: Number(p.profileViews ?? 0),
      timeseries: (p.reach_timeseries as Array<{ date: string; value: number }>) ?? [],
    };
  });

  return { platforms: results, fetchedAt: new Date().toISOString() };
}

// ─── Website Analytics (Umami) ────────────────────────────────────────────────

/**
 * Umami on manus-analytics.com requires a Bearer token.
 * We use the BUILT_IN_FORGE_API_KEY as the auth token since Manus manages this instance.
 * If that fails we fall back to returning empty/zero stats so the report still generates.
 */
async function umamiGet(path: string, params: Record<string, string | number>): Promise<unknown> {
  const base = ENV.umamiEndpoint;
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
  const url = `${base}${path}?${qs}`;

  // Try with forge API key first (Manus-managed Umami)
  try {
    return await fetchJson(url, { Authorization: `Bearer ${ENV.forgeApiKey}` });
  } catch {
    // Fall back to no auth (public share token may work)
    try {
      return await fetchJson(url);
    } catch {
      return null;
    }
  }
}

const SOCIAL_REFERRER_PATTERNS: Record<string, string[]> = {
  instagram: ["instagram.com", "l.instagram.com"],
  facebook: ["facebook.com", "l.facebook.com", "fb.com"],
  linkedin: ["linkedin.com", "lnkd.in"],
  youtube: ["youtube.com", "youtu.be"],
  tiktok: ["tiktok.com", "vm.tiktok.com"],
  pinterest: ["pinterest.com", "pin.it"],
};

export async function fetchWebsiteAnalytics(days = 7): Promise<WebsiteAnalyticsResult> {
  const websiteId = ENV.umamiWebsiteId;
  const endAt = Date.now();
  const startAt = msAgo(days);
  const commonParams = { startAt, endAt };

  // Fetch all in parallel
  const [statsRaw, pagesRaw, referrersRaw] = await Promise.all([
    umamiGet(`/api/websites/${websiteId}/stats`, commonParams),
    umamiGet(`/api/websites/${websiteId}/metrics`, { ...commonParams, type: "url", limit: 10 }),
    umamiGet(`/api/websites/${websiteId}/metrics`, { ...commonParams, type: "referrer", limit: 50 }),
  ]);

  // Parse stats
  const statsData = (statsRaw ?? {}) as Record<string, unknown>;
  const stats: UmamiStats = {
    pageviews: Number(statsData.pageviews ?? 0),
    visitors: Number(statsData.visitors ?? 0),
    visits: Number(statsData.visits ?? 0),
    bounces: Number(statsData.bounces ?? 0),
    totaltime: Number(statsData.totaltime ?? 0),
  };

  // Parse top pages
  const topPages: UmamiMetric[] = Array.isArray(pagesRaw)
    ? (pagesRaw as UmamiMetric[]).slice(0, 10)
    : [];

  // Parse referrers and compute social referral counts
  const allReferrers: UmamiMetric[] = Array.isArray(referrersRaw)
    ? (referrersRaw as UmamiMetric[])
    : [];

  const socialReferrals: Record<string, number> = {};
  for (const [platform, patterns] of Object.entries(SOCIAL_REFERRER_PATTERNS)) {
    socialReferrals[platform] = allReferrers
      .filter((r) => patterns.some((p) => r.x?.includes(p)))
      .reduce((sum, r) => sum + r.y, 0);
  }

  // Top 10 external referrers only
  const referrers = allReferrers
    .filter((r) => r.x && !r.x.includes("yfitai.com"))
    .slice(0, 10);

  return {
    stats,
    topPages,
    referrers,
    socialReferrals,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Combined report data ─────────────────────────────────────────────────────

export interface FullAnalyticsData {
  weekStart: string;
  weekEnd: string;
  social: SocialAnalyticsResult;
  website: WebsiteAnalyticsResult;
}

export async function fetchFullAnalytics(days = 7): Promise<FullAnalyticsData> {
  const now = new Date();
  const weekEnd = now.toISOString().split("T")[0];
  const weekStartDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const weekStart = weekStartDate.toISOString().split("T")[0];

  const [social, website] = await Promise.all([
    fetchSocialAnalytics(days),
    fetchWebsiteAnalytics(days),
  ]);

  return { weekStart, weekEnd, social, website };
}
