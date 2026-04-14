/**
 * Tests for the CIBC CSV importer and accounting logic.
 */

import { describe, it, expect } from "vitest";
import { parseCibcCsv } from "./csvImporter";

// ─── Sample CIBC CSV data ─────────────────────────────────────────────────────

const SAMPLE_CSV_WITH_HEADER = `Date,Description,Debit,Credit
2025-03-01,"SHELL #1234 WINNIPEG MB",85.00,
2025-03-02,"MANUS AI SUBSCRIPTION",49.99,
2025-03-03,"ELEVENLABS.IO",22.00,
2025-03-05,"STAPLES #456 WINNIPEG",34.56,
2025-03-10,"PAYMENT - THANK YOU",,500.00
2025-03-15,"STRIPE PAYOUT",,1200.00
2025-03-20,"AMAZON.CA OFFICE SUPPLIES",67.89,
2025-03-25,"META ADS",150.00,
2025-03-28,"UNKNOWN VENDOR XYZ",25.00,`;

const SAMPLE_CSV_NO_HEADER = `2025-04-01,"SHELL #5678 WINNIPEG MB",92.50,
2025-04-05,"RAILWAY.APP",20.00,
2025-04-10,"PAYMENT - THANK YOU",,800.00`;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("parseCibcCsv", () => {
  it("parses CSV with header row correctly", () => {
    const { transactions, errors } = parseCibcCsv(SAMPLE_CSV_WITH_HEADER);

    // Should skip: PAYMENT - THANK YOU (credit), STRIPE PAYOUT (credit)
    // Should parse: SHELL, MANUS, ELEVENLABS, STAPLES, AMAZON, META ADS, UNKNOWN VENDOR
    expect(transactions.length).toBe(7);
    expect(errors.length).toBe(0);
  });

  it("parses CSV without header row", () => {
    const { transactions, errors } = parseCibcCsv(SAMPLE_CSV_NO_HEADER);
    // PAYMENT - THANK YOU is a credit, should be skipped
    expect(transactions.length).toBe(2);
  });

  it("correctly categorizes gas station", () => {
    const { transactions } = parseCibcCsv(SAMPLE_CSV_WITH_HEADER);
    const shell = transactions.find(t => t.description.includes("SHELL"));
    expect(shell).toBeDefined();
    expect(shell?.category).toBe("gas_fuel");
    expect(shell?.gstEligible).toBe(true);
  });

  it("correctly categorizes software subscription", () => {
    const { transactions } = parseCibcCsv(SAMPLE_CSV_WITH_HEADER);
    const manus = transactions.find(t => t.description.includes("MANUS"));
    expect(manus).toBeDefined();
    expect(manus?.category).toBe("software_subscription");
  });

  it("correctly categorizes ElevenLabs", () => {
    const { transactions } = parseCibcCsv(SAMPLE_CSV_WITH_HEADER);
    const eleven = transactions.find(t => t.description.includes("ELEVENLABS"));
    expect(eleven).toBeDefined();
    expect(eleven?.category).toBe("software_subscription");
  });

  it("correctly categorizes office supplies", () => {
    const { transactions } = parseCibcCsv(SAMPLE_CSV_WITH_HEADER);
    const staples = transactions.find(t => t.description.includes("STAPLES"));
    expect(staples).toBeDefined();
    expect(staples?.category).toBe("office_supplies");
  });

  it("correctly categorizes advertising", () => {
    const { transactions } = parseCibcCsv(SAMPLE_CSV_WITH_HEADER);
    const meta = transactions.find(t => t.description.includes("META ADS"));
    expect(meta).toBeDefined();
    expect(meta?.category).toBe("advertising");
  });

  it("flags unknown vendors for review", () => {
    const { transactions } = parseCibcCsv(SAMPLE_CSV_WITH_HEADER);
    const unknown = transactions.find(t => t.description.includes("UNKNOWN VENDOR"));
    expect(unknown).toBeDefined();
    expect(unknown?.category).toBe("other");
    expect(unknown?.needsReview).toBe(true);
  });

  it("calculates GST ITC correctly for eligible expenses", () => {
    const { transactions } = parseCibcCsv(SAMPLE_CSV_WITH_HEADER);
    const shell = transactions.find(t => t.description.includes("SHELL"));
    expect(shell).toBeDefined();

    // $85.00 total → pre-tax = 85 / 1.05 = 80.95... → ITC = 85 - 80.95 = 4.05
    // In cents: 8500 / 1.05 = 8095 (rounded), ITC = 8500 - 8095 = 405 cents
    expect(shell?.amountCadCents).toBe(8500);
    expect(shell?.preTaxAmountCadCents).toBe(8095);
    expect(shell?.gstItcCadCents).toBe(405);
  });

  it("converts amounts to cents correctly", () => {
    const { transactions } = parseCibcCsv(SAMPLE_CSV_WITH_HEADER);
    const manus = transactions.find(t => t.description.includes("MANUS"));
    expect(manus?.amountCadCents).toBe(4999);
  });

  it("parses dates correctly", () => {
    const { transactions } = parseCibcCsv(SAMPLE_CSV_WITH_HEADER);
    const shell = transactions.find(t => t.description.includes("SHELL"));
    expect(shell?.date).toBeInstanceOf(Date);
    expect(shell?.date.getFullYear()).toBe(2025);
    expect(shell?.date.getMonth()).toBe(2); // March = 2 (0-indexed)
    expect(shell?.date.getDate()).toBe(1);
  });

  it("skips payment transactions", () => {
    const { transactions } = parseCibcCsv(SAMPLE_CSV_WITH_HEADER);
    const payment = transactions.find(t => t.description.includes("PAYMENT"));
    expect(payment).toBeUndefined();
  });

  it("handles empty CSV gracefully", () => {
    const { transactions, errors } = parseCibcCsv("");
    expect(transactions.length).toBe(0);
    expect(errors.length).toBe(0);
  });

  it("handles CSV with only header", () => {
    const { transactions } = parseCibcCsv("Date,Description,Debit,Credit");
    expect(transactions.length).toBe(0);
  });

  it("categorizes Railway as software subscription", () => {
    const { transactions } = parseCibcCsv(SAMPLE_CSV_NO_HEADER);
    const railway = transactions.find(t => t.description.includes("RAILWAY"));
    expect(railway?.category).toBe("software_subscription");
  });
});

describe("GST ITC calculations", () => {
  it("calculates 5% GST ITC on various amounts", () => {
    const testCases = [
      { total: 10500, expectedPreTax: 10000, expectedItc: 500 },  // $105 → $100 + $5 GST
      { total: 5250, expectedPreTax: 5000, expectedItc: 250 },    // $52.50 → $50 + $2.50 GST
      { total: 2100, expectedPreTax: 2000, expectedItc: 100 },    // $21 → $20 + $1 GST
    ];

    for (const tc of testCases) {
      const preTax = Math.round(tc.total / 1.05);
      const itc = tc.total - preTax;
      expect(preTax).toBe(tc.expectedPreTax);
      expect(itc).toBe(tc.expectedItc);
    }
  });
});
