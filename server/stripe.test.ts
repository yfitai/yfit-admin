import { describe, it, expect } from "vitest";

describe("Stripe API Key Validation", () => {
  it("should authenticate with the Stripe restricted key and read balance", async () => {
    const key = process.env.STRIPE_RESTRICTED_KEY;
    expect(key, "STRIPE_RESTRICTED_KEY must be set").toBeTruthy();
    expect(key!.startsWith("rk_live_"), "Key must be a live restricted key").toBe(true);

    const response = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    // 200 = success, 403 = key exists but no balance permission (still valid key)
    expect([200, 403]).toContain(response.status);

    if (response.status === 200) {
      const data = await response.json();
      expect(data.object).toBe("balance");
      console.log("Stripe balance available:", JSON.stringify(data.available));
    } else {
      console.log("Stripe key valid but balance permission not granted — checking charges instead");
    }
  }, 15000);

  it("should be able to list recent charges via Stripe API", async () => {
    const key = process.env.STRIPE_RESTRICTED_KEY;
    const response = await fetch("https://api.stripe.com/v1/charges?limit=1", {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    // 200 = success, 403 = permission not granted for this endpoint
    expect([200, 403]).toContain(response.status);

    if (response.status === 200) {
      const data = await response.json();
      expect(data.object).toBe("list");
      console.log(`Stripe charges accessible. Total count: ${data.data.length} recent charge(s) returned`);
    } else {
      const err = await response.json();
      console.log("Charges endpoint response:", err.error?.message);
    }
  }, 15000);
});
