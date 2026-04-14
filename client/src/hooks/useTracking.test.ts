import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTracking } from "./useTracking";

describe("useTracking hook", () => {
  beforeEach(() => {
    // Reset window.umami before each test
    (window as any).umami = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls window.umami.track with the correct event name", () => {
    const mockTrack = vi.fn();
    (window as any).umami = { track: mockTrack };

    const { track } = useTracking();
    track("cta_click_hero_start_journey");

    expect(mockTrack).toHaveBeenCalledOnce();
    expect(mockTrack).toHaveBeenCalledWith("cta_click_hero_start_journey", undefined);
  });

  it("passes optional data payload to umami.track", () => {
    const mockTrack = vi.fn();
    (window as any).umami = { track: mockTrack };

    const { track } = useTracking();
    track("pricing_click_pro_monthly", { tier: "pro_monthly", price: 12.99 });

    expect(mockTrack).toHaveBeenCalledWith("pricing_click_pro_monthly", {
      tier: "pro_monthly",
      price: 12.99,
    });
  });

  it("does not throw when window.umami is not loaded", () => {
    (window as any).umami = undefined;

    const { track } = useTracking();
    // Should not throw
    expect(() => track("cta_click_nav_launch_app")).not.toThrow();
  });

  it("does not throw when window.umami.track throws internally", () => {
    (window as any).umami = {
      track: () => {
        throw new Error("Umami internal error");
      },
    };

    const { track } = useTracking();
    // Should silently swallow the error
    expect(() => track("some_event")).not.toThrow();
  });

  it("tracks all expected CTA event names without errors", () => {
    const mockTrack = vi.fn();
    (window as any).umami = { track: mockTrack };

    const { track } = useTracking();

    const expectedEvents = [
      "cta_click_hero_start_journey",
      "cta_click_nav_launch_app",
      "cta_click_pricing_starter",
      "cta_click_pricing_pro_monthly",
      "cta_click_pricing_pro_yearly",
      "cta_click_pricing_lifetime",
      "nav_click_features",
      "nav_click_pricing",
      "nav_click_quick_actions",
      "nav_click_unique",
      "feature_card_click_goals",
      "feature_card_click_nutrition",
      "feature_detail_click_medication",
      "feature_detail_click_form_analysis",
      "footer_click_privacy",
      "footer_click_terms",
      "footer_click_contact",
    ];

    for (const event of expectedEvents) {
      expect(() => track(event)).not.toThrow();
    }

    expect(mockTrack).toHaveBeenCalledTimes(expectedEvents.length);
  });
});
