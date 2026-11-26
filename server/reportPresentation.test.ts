/** Offline presentation tests only. Every number below is a fictional test fixture, not user analytics. */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateWeeklyReport } from "./reportGenerator";
import { buildWeeklyReportEmail, sendWeeklyReport } from "./emailReport";
import {
  makeReportPeriod,
  type FullAnalyticsData,
  type MetricObservation,
  type ReportSummary,
  type UmamiStats,
} from "./reportingModel";

vi.mock("./_core/env", () => ({
  ENV: {
    resendApiKey: "fictional-test-key",
    reportRecipient: "fixture-recipient@example.invalid",
    reportSender: "fixture-sender@example.invalid",
  },
}));

const period = makeReportPeriod(
  { startDate: "2026-11-16", endDate: "2026-11-22" },
  new Date("2026-11-26T17:00:00Z")
);
const asOf = "2026-11-23T17:00:00Z";
const emptyStats: UmamiStats = {
  pageviews: null,
  visitors: null,
  visits: null,
  bounces: null,
  totaltime: null,
};

function observation(
  overrides: Partial<MetricObservation> = {}
): MetricObservation {
  return {
    key: "views",
    label: "Native video views",
    value: 12,
    status: "available",
    scope: "selected_period",
    periodStart: period.startDate,
    periodEnd: period.endDate,
    timezone: period.timezone,
    asOf,
    source: "Fictional test fixture",
    note: "Fictional measurement for offline tests only.",
    ...overrides,
  };
}

function fixture(): FullAnalyticsData {
  return {
    weekStart: period.startDate,
    weekEnd: period.endDate,
    period,
    reportVersion: "fictional-test-fixture-v2",
    social: {
      period,
      fetchedAt: asOf,
      warnings: ["Fictional test fixture - not real user analytics."],
      platforms: [
        "instagram",
        "tiktok",
        "linkedin",
        "facebook",
        "youtube",
        "pinterest",
      ].map(platform => ({
        platform,
        followers: 9999,
        reach: 8888,
        impressions: 7777,
        likes: 6666,
        comments: 5555,
        shares: 4444,
        saves: 3333,
        profileViews: 2222,
        timeseries: [],
        source: "Fictional test fixture",
        fetchedAt: asOf,
        warnings: [],
        // Legacy convenience scalars above must never be presented without observations.
        metrics:
          platform === "instagram"
            ? [observation({ value: 0 })]
            : platform === "pinterest"
              ? [
                  observation({
                    key: "pinClicks",
                    label: "Pin clicks",
                    value: 4,
                  }),
                  observation({
                    key: "outboundClicks",
                    label: "Outbound clicks",
                    value: 3,
                  }),
                  observation({
                    key: "profileVisits",
                    label: "Profile visits",
                    value: 2,
                  }),
                  observation({
                    key: "accountTotalFollowers",
                    label: "Account total followers",
                    value: 1234,
                    scope: "account_total",
                    periodStart: null,
                    periodEnd: null,
                  }),
                  observation({
                    key: "nativeImpressions",
                    label: "Native impressions",
                    value: 4321,
                    status: "stale",
                    scope: "source_period",
                    periodStart: "2026-08-01",
                    periodEnd: "2026-08-31",
                    note: "Old source snapshot; do not use for selected dates.",
                  }),
                  observation({
                    key: "undatedViews",
                    label: "Undated views",
                    value: 765,
                    status: "unknown_window",
                    scope: "source_period",
                    periodStart: null,
                    periodEnd: null,
                  }),
                  observation({
                    key: "otherSourceViews",
                    label: "Other source views",
                    value: 654,
                    scope: "selected_period",
                    periodStart: "2026-10-01",
                    periodEnd: "2026-10-07",
                  }),
                  observation({
                    key: "missingMetric",
                    label: "Missing native metric",
                    value: null,
                    status: "missing",
                  }),
                  observation({
                    key: "impressions",
                    label: "Native Pin impressions",
                    value: 12,
                  }),
                ]
              : [],
      })),
    },
    website: {
      period,
      fetchedAt: asOf,
      status: "unavailable",
      scope: "Website recording for the requested period",
      stats: { ...emptyStats },
      topPages: [],
      referrers: [],
      socialReferrals: { instagram: null, pinterest: null },
      warnings: ["NoWebsiteData: fictional recording outage, not zero visits."],
      go: {
        status: "unavailable",
        stats: { ...emptyStats },
        scope: "Go webpage recording only",
        warnings: ["Go recorder not available in this fictional fixture."],
      },
    },
  };
}

function summary(overrides: Partial<ReportSummary> = {}): ReportSummary {
  return {
    reportVersion: "fictional-test-fixture-v2",
    verifiedPlatforms: 2,
    platformsTotal: 6,
    websiteStatus: "unavailable",
    totalReach: null,
    totalImpressions: null,
    websiteVisitors: null,
    socialReferrals: null,
    goPageviews: null,
    goVisitors: null,
    coverageNote:
      "Fictional fixture: 2 of 6 platforms have at least one verified selected-period metric.",
    ...overrides,
  };
}

function pdfText(buffer: Buffer, bbox = false): string {
  return execFileSync(
    "pdftotext",
    bbox ? ["-bbox", "-", "-"] : ["-layout", "-", "-"],
    { input: buffer, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
}

beforeEach(() => {
  // Unmocked network attempts must fail immediately, including accidental delivery.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Network disabled in offline presentation tests");
    })
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Offline PDF presentation", () => {
  it("keeps null distinct from measured zero and never uses legacy totals", async () => {
    const buffer = await generateWeeklyReport(
      fixture(),
      "Fictional test fixture: website measurement is unavailable, not a measured zero."
    );
    const text = pdfText(buffer);
    expect(text).toContain("Native video views");
    expect(text).toMatch(/Native video views\s+0/);
    expect(text).toMatch(/Website recorded visitors\s+Unavailable/);
    expect(text).toMatch(/Go webpage recorded visits\s+Unavailable/);
    expect(text).toContain("NoWebsiteData");
    expect(text).toContain(
      "2 of 6 platforms have a verified views or impressions figure"
    );
    for (const platform of [
      "Instagram",
      "TikTok",
      "LinkedIn",
      "Facebook",
      "YouTube",
      "Pinterest",
    ])
      expect(text).toContain(platform);
    expect(text).toContain("What the numbers tell us");
    for (const invalid of [
      "Total Reach",
      "Total Impressions",
      "Engagement Rate",
      "AI-generated",
      "AI Analysis",
      "9,999",
      "8,888",
      "7,777",
      "people who viewed profiles",
      "CDT",
    ])
      expect(text).not.toContain(invalid);
    expect(text).toContain("Manitoba time (UTC-5)");
    expect(text).toContain("Etc/GMT+5");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("separates stale, unknown-window, mismatched source and follower stock context", async () => {
    const text = pdfText(
      await generateWeeklyReport(
        fixture(),
        "Fictional test fixture: compare only supported dates."
      )
    );
    const selected = text
      .split("Selected-period social metrics")[1]
      .split("Other context - not selected-period results")[0];
    expect(selected).toContain("Pin clicks");
    expect(selected).toContain("Outbound clicks");
    expect(selected).toContain("Profile visits");
    for (const contextValue of ["1,234", "4,321", "765", "654"])
      expect(selected).not.toContain(contextValue);
    const context = text
      .split("Other context - not selected-period results")[1]
      .split("Website and Go recording")[0];
    expect(context).toMatch(/stock, not\s+growth/);
    expect(context).toContain("Status: Stale");
    expect(context).toContain("Dates not supplied");
    expect(context).toContain("2026-08-01 to 2026-08-31");
    expect(context).toMatch(/Source dates do not\s+match the selected period/);
    expect(context).toMatch(/Missing native metric\s+Unavailable/);
    expect(text).toContain("webpageRecordedGoVisits");
    expect(text).toContain("Fictional test fixture");
    expect(text).toContain("2026-11-23T17:00:00Z");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows available zero website and Go counts without deriving invalid percentages", async () => {
    const data = fixture();
    data.website.status = "partial";
    data.website.stats = {
      pageviews: 0,
      visitors: 0,
      visits: 0,
      bounces: null,
      totaltime: null,
    };
    data.website.go.status = "available";
    data.website.go.stats = {
      pageviews: 0,
      visitors: 0,
      visits: 0,
      bounces: 0,
      totaltime: 0,
    };
    data.website.socialReferrals.instagram = 0;
    const text = pdfText(
      await generateWeeklyReport(
        data,
        "Fictional test fixture: available recording measured zero."
      )
    );
    expect(text).toMatch(/Website recorded visitors\s+0/);
    expect(text).toMatch(/Go webpage recorded visits\s+0/);
    expect(text).toMatch(/Recorded bounces\s+Unavailable/);
    expect(text).toMatch(/Returned website counters \(scope unverified\)/);
    expect(text).not.toMatch(/Bounce Rate|Average Session|\b0\.0%/);
    data.website.go.status = "partial";
    const partialGo = pdfText(
      await generateWeeklyReport(data, "Fictional partial Go context.")
    );
    expect(partialGo).toMatch(/Returned Go counters \(scope unverified\)/);
    expect(partialGo).toMatch(/not confirmed Go arrivals/);
    expect(partialGo).toMatch(/Go webpage recorded visits\s+0/);
    data.website.period = { ...period, timezone: "UTC" };
    const wrongTimezone = pdfText(
      await generateWeeklyReport(
        data,
        "Fictional test fixture: source timezone mismatch."
      )
    );
    expect(wrongTimezone).toMatch(/Website recorded visitors\s+Unavailable/);
    expect(wrongTimezone).toContain("do not match the selected period");
  });

  it("keeps a 76-observation ordinary fictional snapshot compact without altering the input", async () => {
    const data = fixture();
    const generic =
      "Native scalar snapshot; the selected report dates do not establish its window.";
    data.social.platforms.forEach((platform, index) => {
      // Dense fictional source context, not a copy of any private provider proof.
      const keys = [
        "followers",
        "reach",
        "impressions",
        "likes",
        "comments",
        "shares",
        "saves",
        "profileViews",
      ];
      platform.metrics = Array.from(
        { length: index < 4 ? 13 : 12 },
        (_, row) => {
          const key = keys[row % keys.length];
          const unavailable = row >= 3 && row <= 6;
          return observation({
            key: row >= 8 ? `period_totals.${key}` : key,
            label:
              key === "followers"
                ? "Followers"
                : key === "impressions"
                  ? "Native impressions"
                  : key,
            value: unavailable ? null : row,
            status: unavailable
              ? "missing"
              : index === 4
                ? "stale"
                : "unknown_window",
            scope: key === "followers" ? "account_total" : "source_period",
            periodStart: null,
            periodEnd: null,
            note:
              generic +
              (unavailable
                ? " No finite nonnegative numeric field was supplied."
                : index === 4
                  ? " Provider explicitly marks this data stale."
                  : ""),
          });
        }
      );
    });
    expect(
      data.social.platforms.reduce((total, p) => total + p.metrics.length, 0)
    ).toBe(76);
    const original = JSON.stringify(data);
    const buffer = await generateWeeklyReport(
      data,
      "Fictional snapshot: no actual selected-week figures are manufactured.\n" +
        ["instagram", "tiktok", "linkedin", "facebook", "youtube", "pinterest"]
          .map(
            name =>
              `${name}: a complete, date-matched figure is not available. Any other numbers shown are context only, not this week's results.`
          )
          .join("\n") +
        "\nUNIQUE_SUMMARY_MARKER must remain in full."
    );
    const text = pdfText(buffer);
    const pages = text.split("\f").filter(page => page.trim());
    expect(pages.length).toBeLessThanOrEqual(8);
    expect(text).toContain("Status: Stale");
    expect(text).toContain("Native outbound clicks: unavailable");
    expect(text).toContain("External website/bio taps: unknown");
    expect(text).toContain(
      "No complete, date-matched figure is available for Instagram"
    );
    expect(text).toContain("UNIQUE_SUMMARY_MARKER must remain in full");
    expect(text).not.toContain("instagram: a complete, date-matched figure");
    expect(text).toMatch(/does not manufacture actual\s+selected-week figures/);
    expect(text).toMatch(/JSON archive when archiving is configured/);
    pages.forEach((page, index) =>
      expect(page).toContain(`Page ${index + 1} of ${pages.length}`)
    );
    expect(JSON.stringify(data)).toBe(original);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("combines only consistent native aliases and retains definitions and unique notes", async () => {
    const data = fixture();
    const generic =
      "Native scalar snapshot; the selected report dates do not establish its window.";
    const viewsAlias =
      "Compatibility impressions field is a views alias, not native thumbnail/content impressions.";
    const engagedAlias = "Accounts engaged, not profile visits.";
    data.social.platforms[0].metrics = [
      observation({
        key: "impressions",
        label: "Views",
        note: `${generic} ${viewsAlias} ALIAS_UNIQUE_NOTE`,
      }),
      observation({
        key: "views",
        label: "Views",
        note: `${generic} NATIVE_UNIQUE_NOTE`,
      }),
      observation({
        key: "profileViews",
        label: "Accounts Engaged",
        value: 2,
        note: `${generic} ${engagedAlias}`,
      }),
      observation({
        key: "accounts_engaged",
        label: "Accounts Engaged",
        value: 2,
        note: generic,
      }),
    ];
    const original = JSON.stringify(data);
    const text = pdfText(
      await generateWeeklyReport(data, "Fictional alias fixture.")
    );
    expect(text.match(/\bViews\s+12\b/g)).toHaveLength(1);
    expect(text.match(/Accounts Engaged\s+2\b/g)).toHaveLength(1);
    expect(text).toMatch(
      /views alias, not\s+native thumbnail\/content\s+impressions/
    );
    expect(text).toMatch(/Accounts engaged,\s+not profile visits/);
    expect(text).toContain("ALIAS_UNIQUE_NOTE");
    expect(text).toContain("NATIVE_UNIQUE_NOTE");
    expect(JSON.stringify(data)).toBe(original);
    for (const difference of [
      { value: 13 },
      { source: "Different fictional source" },
      { status: "stale" as const },
      { scope: "source_period" as const },
      { periodStart: "2026-10-01" },
      { timezone: "UTC" },
      { asOf: "2026-11-24T17:00:00Z" },
      { label: "Native impressions" },
    ]) {
      const changed = structuredClone(data);
      Object.assign(changed.social.platforms[0].metrics[1], difference);
      const kept = pdfText(
        await generateWeeklyReport(changed, "Fictional inconsistent alias.")
      );
      expect(kept).toContain("ALIAS_UNIQUE_NOTE");
      expect(kept).toContain("NATIVE_UNIQUE_NOTE");
      expect(
        kept.match(/(?:\bViews|Native impressions)\s+(?:12|13)\b/g)
      ).toHaveLength(2);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it("wraps very long notes, warnings and summary, with a footer on every page and no footer-only extra page", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-01T12:30:00Z"));
    const data = fixture();
    const longNote =
      Array.from(
        { length: 240 },
        (_, i) => `NOTE${i} explains the fictional measurement limitation.`
      ).join(" ") + " END_OF_LONG_NOTE";
    data.social.platforms[5].metrics[4].note = longNote;
    data.social.platforms[5].metrics.push(
      observation({
        key: "comments",
        label: "Comments with a unique limitation",
        value: null,
        status: "missing",
        scope: "source_period",
        periodStart: null,
        periodEnd: null,
        note:
          "UNIQUE_COMMENT_NOTE " +
          "Full fictional comment limitation. ".repeat(100) +
          " END_OF_COMMENT_NOTE",
      })
    );
    data.website.warnings.push(
      "LONG_WARNING " + "warning text ".repeat(400) + " END_OF_WARNING"
    );
    data.website.scope +=
      " https://fictional.example.invalid/" + "very-long-path".repeat(60);
    const longSummary =
      "Fictional test fixture only. Unicode safe: Manitoba → dates — café • recorded. " +
      "Plain validated summary. ".repeat(450) +
      " END_OF_SUMMARY";
    const buffer = await generateWeeklyReport(data, longSummary);
    const text = pdfText(buffer);
    for (const marker of [
      "NOTE0",
      "NOTE239",
      "END_OF_LONG_NOTE",
      "UNIQUE_COMMENT_NOTE",
      "END_OF_COMMENT_NOTE",
      "END_OF_WARNING",
      "END_OF_SUMMARY",
    ])
      expect(text).toContain(marker);
    expect(text).toContain("cafe");
    expect(text).toContain("07:30:00 Manitoba time (UTC-5)");
    const pages = text.split("\f").filter(page => page.trim());
    expect(pages.length).toBeGreaterThan(6);
    pages.forEach((page, index) => {
      expect(page).toContain(`Page ${index + 1} of ${pages.length}`);
      const content = page.replace(/YFIT AI \| Generated[^\n]+/g, "").trim();
      expect(content.length).toBeGreaterThan(40);
    });
    const bbox = pdfText(buffer, true);
    const words = [
      ...bbox.matchAll(
        /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g
      ),
    ];
    expect(words.length).toBeGreaterThan(100);
    for (const word of words) {
      expect(Number(word[1])).toBeGreaterThanOrEqual(49);
      expect(Number(word[3])).toBeLessThanOrEqual(563);
      expect(Number(word[4])).toBeLessThan(760);
      // Between the content boundary and the footer there must be no clipped row text.
      expect(Number(word[2]) > 720 && Number(word[2]) < 740).toBe(false);
    }
    const info = execFileSync("pdfinfo", ["-"], {
      input: buffer,
      encoding: "utf8",
    });
    expect(info).toMatch(new RegExp(`Pages:\\s+${pages.length}\\b`));
    // Optional offline preview stays outside the repository and is visibly labelled fictional.
    const preview = process.env.YFIT_PRESENTATION_PREVIEW_DIR;
    if (preview) {
      const dir = resolve(preview);
      if (dir.startsWith(resolve(process.cwd())))
        throw new Error(
          "Offline fixture preview must be outside the repository"
        );
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "fictional-test-fixture-report.pdf"), buffer);
      writeFileSync(
        join(dir, "fictional-test-fixture-email.html"),
        buildWeeklyReportEmail(period.startDate, period.endDate, summary())
      );
    }
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Offline email presentation and mocked acceptance", () => {
  it("uses measured coverage and unavailable website/Go rather than invented totals", () => {
    const html = buildWeeklyReportEmail(
      period.startDate,
      period.endDate,
      summary()
    );
    expect(html).toContain("2 of 6");
    expect(html).toContain("NoWebsiteData");
    expect(html.match(/>Unavailable</g)).toHaveLength(4);
    for (const invalid of [
      "Total Reach",
      "Total Impressions",
      "AI-generated",
      "Every Monday",
      "0 real visits",
      "marketing failed",
    ])
      expect(html).not.toContain(invalid);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps measured zero and nullable Go values distinct, and suppresses unusable website scalars", () => {
    const html = buildWeeklyReportEmail(
      period.startDate,
      period.endDate,
      summary({
        websiteStatus: "partial",
        websiteVisitors: 0,
        socialReferrals: 0,
        goPageviews: null,
        goVisitors: null,
      })
    );
    expect(html.match(/>0</g)).toHaveLength(2);
    expect(html.match(/>Unavailable</g)).toHaveLength(2);
    const unavailable = buildWeeklyReportEmail(
      period.startDate,
      period.endDate,
      summary({ websiteVisitors: 0, goPageviews: null, goVisitors: null })
    );
    expect(unavailable).not.toContain(">0<");
    const independentGo = buildWeeklyReportEmail(
      period.startDate,
      period.endDate,
      summary({ websiteVisitors: null, goPageviews: 0, goVisitors: 0 })
    );
    expect(independentGo.match(/>0</g)).toHaveLength(2);
    expect(independentGo.match(/>Unavailable</g)).toHaveLength(2);
  });

  it("escapes all dynamic HTML values", () => {
    const html = buildWeeklyReportEmail(
      '<img src=x onerror="fixture">',
      "end & 'fixture'",
      summary({
        coverageNote: '<script>alert("fixture")</script> & not real',
        reportVersion: "<b>fixture</b>",
        websiteStatus: '<svg onload="fixture">',
      })
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<svg");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;fixture&quot;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&#39;fixture&#39;");
    expect(html).toContain("&lt;b&gt;fixture&lt;/b&gt;");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves the API method, sender, recipient and attachment and reports acceptance only", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "fictional-acceptance-id" }),
    });
    vi.stubGlobal("fetch", mockFetch);
    const buffer = Buffer.from("Fictional fixture PDF bytes");
    const result = await sendWeeklyReport(
      buffer,
      period.startDate,
      period.endDate,
      summary()
    );
    expect(result).toEqual({
      success: true,
      deliveryStatus: "accepted",
      messageId: "fictional-acceptance-id",
    });
    expect(result).not.toHaveProperty("delivered");
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer fictional-test-key");
    const payload = JSON.parse(init.body);
    expect(payload.from).toBe(
      "YFIT Analytics <fixture-sender@example.invalid>"
    );
    expect(payload.to).toEqual(["fixture-recipient@example.invalid"]);
    expect(payload.attachments).toEqual([
      {
        filename: "YFIT-Analytics-2026-11-16-to-2026-11-22.pdf",
        content: buffer.toString("base64"),
      },
    ]);
    expect(payload.html).toContain("What the numbers tell us");
  });

  it("does not claim acceptance when Resend rejects or omits its acceptance ID", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ message: "Fictional rejection" }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal("fetch", mockFetch);
    expect(
      await sendWeeklyReport(
        Buffer.alloc(0),
        period.startDate,
        period.endDate,
        summary()
      )
    ).toEqual({
      success: false,
      deliveryStatus: "rejected",
      error:
        "Resend error 422: Provider rejected the request. Upstream response text is not retained.",
    });
    expect(
      await sendWeeklyReport(
        Buffer.alloc(0),
        period.startDate,
        period.endDate,
        summary()
      )
    ).toMatchObject({ success: false, deliveryStatus: "unknown" });
  });

  it("keeps explicit HTTP rejection distinct from unreadable possible acceptance", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => {
          throw new Error("Fictional unreadable response");
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("Fictional unreadable response");
        },
      });
    vi.stubGlobal("fetch", mockFetch);
    expect(
      await sendWeeklyReport(
        Buffer.alloc(0),
        period.startDate,
        period.endDate,
        summary()
      )
    ).toMatchObject({ success: false, deliveryStatus: "rejected" });
    expect(
      await sendWeeklyReport(
        Buffer.alloc(0),
        period.startDate,
        period.endDate,
        summary()
      )
    ).toMatchObject({ success: false, deliveryStatus: "unknown" });
  });

  it("treats network exceptions as unknown, never definitely unsent", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValue(
        new Error("Fictional timeout after possible acceptance")
      );
    vi.stubGlobal("fetch", mockFetch);
    const result = await sendWeeklyReport(
      Buffer.alloc(0),
      period.startDate,
      period.endDate,
      summary()
    );
    expect(result).toMatchObject({ success: false, deliveryStatus: "unknown" });
    expect(result.error).toContain("Check the provider before retrying");
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});
