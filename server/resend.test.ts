/**
 * Test: Validate Resend API key is set and has sending access
 * Note: This key has "Sending access" only (not full API access),
 * so listing domains returns 401 — that is expected and correct.
 * We validate by checking the error message confirms it is a valid restricted key.
 */
import { describe, it, expect } from "vitest";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

describe("Resend API key validation", () => {
  it("should have RESEND_API_KEY set", () => {
    expect(RESEND_API_KEY.length).toBeGreaterThan(0);
    expect(RESEND_API_KEY.startsWith("re_")).toBe(true);
  });

  it("should be a valid restricted sending key (not an invalid key)", async () => {
    // A sending-only key returns 401 on /domains with message "restricted_api_key"
    // An invalid key returns 401 with message "invalid_api_key"
    // We confirm it is restricted (valid) not invalid
    const res = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const data = (await res.json()) as { statusCode: number; name: string; message: string };
    // Either 200 (full access) or 401 with "restricted_api_key" (sending-only) is acceptable
    if (res.status === 401) {
      expect(data.name).toBe("restricted_api_key");
    } else {
      expect(res.status).toBe(200);
    }
  }, 15000);
});
