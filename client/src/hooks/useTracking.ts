/**
 * Umami custom event tracking hook
 * Wraps window.umami.track() safely so it never throws if Umami hasn't loaded yet.
 *
 * Event naming convention:  <action>_<location>
 * Examples:
 *   cta_click_hero_start_journey
 *   cta_click_nav_launch_app
 *   pricing_click_starter
 *   pricing_click_pro_monthly
 *   pricing_click_pro_yearly
 *   pricing_click_lifetime
 *   nav_click_features
 *   nav_click_pricing
 */

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, unknown>) => void;
    };
  }
}

export function useTracking() {
  const track = (eventName: string, data?: Record<string, unknown>) => {
    try {
      if (typeof window !== "undefined" && window.umami?.track) {
        window.umami.track(eventName, data);
      }
    } catch {
      // Silently ignore — tracking should never break the UI
    }
  };

  return { track };
}
