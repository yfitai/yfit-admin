# YFIT AI Quarterly Accounting Reports

**Reporting periods:** Q2 2025 through Q2 2026  
**Prepared:** August 13, 2026  
**Status:** Draft internal reconciliation — review before any tax filing  
**Currency:** Canadian dollars (CAD)

> **Tax notice:** This is an internal reconciliation prepared from imported source transactions. It is not a GST return, financial statement, or tax filing. A CPA or tax professional should review the GST eligibility, exchange-rate treatment, business-purpose classification, and final remittance/ITC positions before reliance or filing.

## Reporting basis

The report uses imported CIBC Mastercard business transactions and a historical Stripe charge retrieval covering April 1, 2025 through June 30, 2026. The accounting period is the calendar quarter ending March 31, June 30, September 30, or December 31.

CIBC amounts are recorded in CAD cents from the transaction export. The existing importer estimates a 5% GST ITC for transactions marked GST-eligible. This is a **provisional estimate**, not confirmation that each vendor charged recoverable GST. Stripe charge amounts are converted using the rate stored by the current sync process; the March 2026 records use a USD/CAD rate of **1.393000**. Stripe fees are the system’s current estimated fee calculation, not a direct Stripe balance-transaction fee import.

## Quarterly summary

| Quarter | Stripe gross charges | Refunds | Estimated Stripe fees | Net Stripe revenue | CIBC expenses | Provisional GST ITCs | Provisional net GST position* | Operating profit / (loss)** | Transactions needing review |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Q2 2025 | $0.00 | $0.00 | $0.00 | $0.00 | $263.52 | $12.56 | ($12.56) | ($263.52) | 4 |
| Q3 2025 | $0.00 | $0.00 | $0.00 | $0.00 | $1,496.11 | $71.26 | ($71.26) | ($1,496.11) | 13 |
| Q4 2025 | $0.00 | $0.00 | $0.00 | $0.00 | $5,565.96 | $265.08 | ($265.08) | ($5,565.96) | 22 |
| Q1 2026 | $165.25 | $19.00 | $5.63 | $140.62 | $2,319.34 | $110.48 | ($110.48) | ($2,178.72) | 13 |
| Q2 2026 | $0.00 | $0.00 | $0.00 | $0.00 | $2,098.28 | $99.95 | ($99.95) | ($2,098.28) | 12 |
| **Five-quarter total** | **$165.25** | **$19.00** | **$5.63** | **$140.62** | **$11,743.21** | **$559.33** | **($559.33)** | **($11,602.59)** | **64** |

\* The net GST position shown is **GST collected less provisional ITCs**. The Stripe sync records $0.00 GST collected because Stripe Tax data is not currently imported. Parentheses indicate a provisional ITC credit position, not a confirmed refund.

\** Operating profit/(loss) is net Stripe revenue after estimated Stripe fees less imported CIBC expenses. It excludes income tax, owner draws, unpaid liabilities, depreciation, and any transactions outside the imported sources.

## Quarter details

### Q2 2025 — April 1 to June 30, 2025

Business activity began June 2, 2025, so no April or May source transactions are expected. Imported CIBC activity runs June 2–27, 2025.

| Metric | Amount |
|---|---:|
| Stripe gross charges | $0.00 |
| Stripe refunds | $0.00 |
| Net Stripe revenue after estimated fees | $0.00 |
| CIBC expenses | $263.52 |
| Provisional GST ITCs | $12.56 |
| Operating profit / (loss) | ($263.52) |

### Q3 2025 — July 1 to September 30, 2025

Imported CIBC activity runs July 2–September 23, 2025.

| Metric | Amount |
|---|---:|
| Stripe gross charges | $0.00 |
| Stripe refunds | $0.00 |
| Net Stripe revenue after estimated fees | $0.00 |
| CIBC expenses | $1,496.11 |
| Provisional GST ITCs | $71.26 |
| Operating profit / (loss) | ($1,496.11) |

### Q4 2025 — October 1 to December 31, 2025

Imported CIBC activity runs October 1–December 31, 2025.

| Metric | Amount |
|---|---:|
| Stripe gross charges | $0.00 |
| Stripe refunds | $0.00 |
| Net Stripe revenue after estimated fees | $0.00 |
| CIBC expenses | $5,565.96 |
| Provisional GST ITCs | $265.08 |
| Operating profit / (loss) | ($5,565.96) |

### Q1 2026 — January 1 to March 31, 2026

Imported CIBC activity runs January 2–March 30, 2026. The Stripe backfill found two March charges: one fully refunded $13.64 USD charge (recorded as $19.00 CAD refunded) and one $104.99 USD charge (recorded as $146.25 CAD). The net Stripe revenue after the current estimated Stripe fee method is $140.62 CAD.

| Metric | Amount |
|---|---:|
| Stripe gross charges | $165.25 |
| Stripe refunds | ($19.00) |
| Estimated Stripe fees | ($5.63) |
| Net Stripe revenue after estimated fees | $140.62 |
| CIBC expenses | $2,319.34 |
| Provisional GST ITCs | $110.48 |
| Operating profit / (loss) | ($2,178.72) |

### Q2 2026 — April 1 to June 30, 2026

Imported CIBC activity runs April 1–June 15, 2026. The uploaded CIBC June file contained a June 30 card payment and two expense rows already present in the database; it contained no additional business expenses after June 15. Therefore it was not imported to prevent duplication.

| Metric | Amount |
|---|---:|
| Stripe gross charges | $0.00 |
| Stripe refunds | $0.00 |
| Net Stripe revenue after estimated fees | $0.00 |
| CIBC expenses | $2,098.28 |
| Provisional GST ITCs | $99.95 |
| Operating profit / (loss) | ($2,098.28) |

## Review items before using these reports for tax or financial statements

| Review item | Why it matters | Required action |
|---|---|---|
| 64 CIBC transactions remain unreviewed | Most are auto-categorized as `other`, and the importer presumes GST eligibility. | Confirm business purpose, category, and GST eligibility transaction by transaction. |
| Foreign and non-Canadian vendors | Some charges may not include recoverable Canadian GST. | Remove GST eligibility where no Canadian GST/HST was charged. |
| Stripe CAD conversion | The current backfill uses the rate stored by the sync process, rather than a documented transaction-date rate. | Confirm the accepted accounting FX methodology with the preparer/CPA. |
| Stripe fee calculation | The current system uses an estimated fee formula, not actual Stripe balance transaction fees. | Compare with Stripe payout/balance reports if exact fee accounting is required. |
| GST collected | The sync currently stores $0.00 GST collected because Stripe Tax is not imported. | Confirm whether GST was collected outside the current Stripe Tax data model. |

## Source coverage and reconciliation result

| Source | Coverage used | Result |
|---|---|---|
| CIBC Mastercard imports | June 2, 2025–June 15, 2026; uploaded June export checked through June 30 | Sufficient for the stated start-of-business date; no duplicate import made. |
| Stripe charge backfill | April 1, 2025–June 30, 2026 | Two March 2026 test-related charges; one refunded and one retained. |
| Monthly report cache | Existing cache had only June 2026 | Not used as the primary source; totals above are calculated from transaction records. |

## Next operational step

Review and correct the 64 flagged CIBC expense transactions in the Accounting dashboard before relying on the GST/ITC totals. Once that review is complete, regenerate the quarterly report set using the confirmed categories and GST eligibility.
