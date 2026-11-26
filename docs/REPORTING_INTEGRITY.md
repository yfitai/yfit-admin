# Weekly reporting integrity

This code belongs to `yfitai/yfit-admin`, despite the local folder name `yfit-marketing`. The production admin is the existing Railway service at `admin.yfitai.com`. The current marketing and Go pages live in the separate canonical `yfitai/yfit-app` repository. This repair does not publish or restore the retired marketing site.

## What the report can say

`server/reportingModel.ts` is the metric contract. Every native observation retains its value or null, availability, scope, source dates, timezone, freshness and definition. A numeric zero is an actual returned counter. Missing, unsupported, stale, partial and unknown-window values are not converted to zero. Retrieval time is not native freshness. Compatibility fields are nullable and come from normalized observations.

Default reports use the preceding seven **completed Manitoba days at UTC-5**. A Monday report covers Monday through Sunday immediately before it. Date labels include both endpoints; internal timestamps use an exclusive end boundary. Existing `{days:7}` and numeric-string n8n requests remain supported. Explicit `startDate` and `endDate` use ISO calendar dates. Both must be supplied, valid, ordered, completed, and no more than ninety days apart. November9–16 is eight included days, not seven.

Social activity follows its actual native/source calendar. Only complete, validated, additive daily views/impressions with aligned source boundaries and trustworthy provenance qualify as verified selected-period figures. Useful provider-calendar sums can appear separately as context when the calendar is uncertain. Daily unique reach is not summed into weekly unique people. Snapshot deltas are not assumed to be real daily activity. No platform audience or mixed view/impression headline is invented.

Instagram's compatibility impressions field can be Views, and its old profileViews field can mean Accounts Engaged. YouTube/TikTok view aliases are not thumbnail impressions. Pinterest's native Engagements, Pin Clicks and Outbound Clicks stay distinct. TikTok profile likes can be lifetime totals. Followers/subscribers are account stocks, not growth. Engagement does not establish website clicks or new prospects; automatic author comments and owner checks cannot currently be separated.

The website reader issues dedicated `/go` queries and hostname-scoped reads for app, www and root YFIT hosts with bounded requests. Failure returns unavailable values, not fresh-looking zeroes. Managed-proxy filter acceptance has not been verified, so successful responses remain partial. Unique visitors and sessions from separate host queries are not added together. Ranked referrer rows are limited source activity counts, not native social outbound clicks or a complete count of arrivals. Missing rows do not prove zero traffic. Consent/event-collection repairs are outside this change.

## One report-generation path

The existing REST `/api/send-weekly-report` and `/api/weekly-report` and tRPC `generateReport`/`sendReport` use `reportService.ts`. PDF, email and JSON use the same deterministic plain-language evidence summary. No LLM request is made. Incompatible totals retain their legacy keys with null values rather than false numbers.

`analytics.getCapabilities` identifies the serving report version and, when available, Railway's Git commit. A local build, GitHub backup or managed checkpoint is not evidence of production deployment. Keep the current weekly schedule unchanged. The inactive checked-in n8n export is historical, not the authoritative published workflow. Its target and null-handling logger must be checked against the real report workflow before relying on delivery.

Email `success:true` means the provider accepted a request with a message ID, not verified inbox delivery. Explicit rejections and unknown network outcomes stay distinct. No automatic resend is introduced; an unknown result must be checked with the provider first. Transport errors and response bodies are redacted. Nothing in the offline tests sends real email.

## Retained report history

Optional `REPORT_ARCHIVE_DIR` must point to **private persistent storage outside the source repository and public asset directories**. Each report gets a UUID, original normalized input, deterministic summary, serving revision, input/PDF SHA256 hashes and separate send-acceptance status. PDF and metadata files use private permissions. Protected admin-only tRPC history/download procedures check archive integrity.

The current environment has no archive configured. Adding code does not attach a persistent Railway volume; an ephemeral directory cannot be called durable history. No volume, secret, database schema or deployment setting is changed by this repair. Previously emailed reports cannot be reconstructed as originals from later snapshots. Native API authorizations and successful website reads remain separate requirements for complete automatic weekly measurement.

## Offline validation and preview

Run only the mocked reporting regressions; existing analytics/Stripe/email smoke tests can use live credentials and must not be included accidentally:

```bash
pnpm exec vitest run server/analyticsCollector.test.ts server/reportingIntegrity.test.ts server/reportingService.test.ts server/reportingRoutes.test.ts server/reportPresentation.test.ts
pnpm check
pnpm build
```

Generate a network-disabled format preview from preserved real provider evidence, never invented marketing totals:

```bash
pnpm exec tsx scripts/diagnostics/report-preview.mts \
  /path/to/preserved-provider-snapshot.json \
  2026-11-09 2026-11-16 /private/output/report-preview.pdf
```

This preview is expressly historical/offline and not the original emailed attachment or fresh customer analytics. The source snapshot and matching normalized JSON remain separate from the PDF. Synthetic values used in software tests are labelled fictional test fixtures and are not user marketing evidence.

## References

- Upload-Post profile analytics: https://docs.upload-post.com/api/get-analytics/
- Upload-Post YouTube reports availability: https://docs.upload-post.com/api/youtube-analytics-reports/
- Umami stats filters and counts: https://docs.umami.is/docs/api-reference/get-website-stats
- Umami ranked metrics: https://docs.umami.is/docs/api-reference/get-website-metrics
