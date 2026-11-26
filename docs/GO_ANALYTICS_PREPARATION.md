# Go analytics preparation — code only

This is an **undeployed, offline-tested preparation** in `yfitai/yfit-admin`. No deployed Go counts, successful native reads, credentials, authorizations, environment settings, schema, schedules, social collectors, feeds, or report emails were created or changed. The existing managed endpoint/Forge access remains denied/unverified; an HTTP 200 or zero response would not certify its filters. The dedicated read credential was absent at preparation time. No upstream read was performed.

## What is prepared

Reports optionally expose exact `/go` pageviews and native measured visitors separately for `app.yfitai.com`, `www.yfitai.com`, and `yfitai.com`. A prominent Go section appears in the existing PDF, email builder, and plain-language summary when these new fields exist. Historical saved v2 inputs without these optional fields retain their existing behavior; procedures, report version, and archive integrity contract are unchanged.

The primary visitor line explicitly names `app.yfitai.com/go` and uses its certified native count only. It is not a cross-host unique-people total. Valid per-host source counts remain visible when absent source buckets prevent a combined total; unavailable is not converted to zero.

A host measurement is available only with the dedicated credential, the scope gate, and a complete set of nonnegative safe-integer counters. Failed reads have null values. Unverified successes or incomplete counters are partial/context only. Combined Go pageviews require every relevant host to be verified and complete. **Combined Go visitors, visits, bounces, and duration stay null, including at zero.** No unfiltered or deduplicated multi-host query is manufactured. Per-host native visitor counts may overlap and must never be summed into unique people.

Campaign-source counts are **PAGEVIEWS for `/go`**, not social outbound clicks or unique visitors. Only Facebook, Instagram, Pinterest, LinkedIn, YouTube, TikTok, and explicitly tagged Direct labels are exposed. Empty and other tags become `Unknown/unattributed`; raw arbitrary tags, URLs, and PII are not retained. Absent buckets remain null, not zero. No referrer inference, unknown subtraction, or exhaustiveness assumption is used. If one host's source read fails or is invalid, all combined source counts remain null; successful hosts may appear only as labelled per-host context. Source pageviews must not be added to unique visitors.

## Future operator gates — no values set here

The server-only `server/umamiGoConfig.ts` prepares three optional settings. It does not modify `_core` environment plumbing:

- `YFIT_UMAMI_READ_API_KEY`: dedicated server-side Umami read API key, preferred over the legacy Forge credential when configured. Prepared API-key requests use `Authorization: Bearer <api-key>` as documented at https://docs.umami.is/docs/api/authentication; there is no login, token exchange, credential retry, or fallback after denial. Actual managed-server acceptance remains unverified.
- `YFIT_UMAMI_GO_SCOPE_VERIFIED`: accepts **exactly `true`** and only with the dedicated key. This is an operator evidence gate for stats, not automatic HTTP-success detection.
- `YFIT_UMAMI_GO_SOURCE_SCOPE_VERIFIED`: accepts **exactly `true`**, independently of the stats gate. UTM endpoint calls require the dedicated key **and both gates**. Turning on the stats gate alone cannot enable campaign-source reads.

Before any future authorized configuration, document agreement between the actual dashboard/API/native measurement and the configured website identity, each intended host, exact `/go` path, selected completed-day date bounds, fixed UTC-5 timezone, and native count grain. Verify that the deployed managed API version accepts these filters rather than silently dropping them. Separately verify the official UTM endpoint, `utm_source` PAGEVIEW grain and tag grouping, API-key header acceptance, and scope/date agreement. Credential presence, a local build, HTTP 200, or an empty response is not this evidence. Authorizations and deployment require separate approval. Do not enable either gate merely to remove an unavailable label.

## Prepared endpoint contract

The reader uses the existing `ENV.umamiEndpoint` and `ENV.umamiWebsiteId`; it adds no alternate website, probe, tracking registration, GA4 adapter, or speculative live read. The new endpoint is disabled by default. Existing bounded managed reads remain unverified context unless the future dedicated credential and stats evidence gate are valid.

```text
GET /api/websites/{websiteId}/utm/metrics
  ?startAt={milliseconds}
  &endAt={exclusiveReportEnd-1}
  &timezone=Etc/GMT+5
  &hostname={oneRelevantHost}
  &path=/go
  &eventType=1
  &match=all
  &type=utm_source
Response: [{"utm":"source label","views":nonnegativeInteger}]
```

This is not `type=utmSource` on generic `/metrics`. The existing fixed-period inclusive date labels and exclusive internal end boundary are retained. Official references checked during preparation:

- https://docs.umami.is/docs/api-reference/get-website-utm-metrics
- https://docs.umami.is/docs/api-reference/get-website-stats

## Offline validation

Only dedicated mocked reporting tests may run; do not run the live analytics, Resend, Stripe, or accounting smoke tests. Fixtures are fictional software tests, never production marketing metrics.

```bash
pnpm exec vitest run server/goAnalytics.test.ts server/analyticsCollector.test.ts server/reportingIntegrity.test.ts server/reportingService.test.ts server/reportingRoutes.test.ts server/reportPresentation.test.ts
pnpm check
pnpm build
```

Final validation passed **135 mocked tests across six files**: the five existing suites contain 101 tests and the dedicated Go suite adds 34. TypeScript, the admin build and whitespace checks also passed. The final regressions include documented Bearer authentication, canonical-host visitor prominence and valid per-host source rows when a combined bucket is unavailable. Offline preparation and a successful build do not resolve denied managed access, missing dedicated credentials, unverified filters/native grain, or undeployed code. No real report was sent.
