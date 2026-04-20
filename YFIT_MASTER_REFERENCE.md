# YFIT AI — Master Project Reference
## ⚠️ READ THIS FIRST — EVERY SINGLE SESSION — NO EXCEPTIONS ⚠️

> **This is the single source of truth for the entire YFIT AI project.**
> Before touching ANY code, ANY file, or ANY service — read this document completely.
> If something changes, update this document immediately.
> Last updated: April 19, 2026

---

## ⚠️ THE ONE RULE THAT PREVENTS ALL MISTAKES

**Before building ANYTHING new, answer these two questions:**
1. Which project does this belong in? (See Part 2 — Infrastructure Map)
2. Does it already exist somewhere? (See Part 10 — What Is Complete)

**If unsure — ASK THE USER. Do not guess. Do not build first and ask later.**

The user made a decision months ago: **everything except the marketing website goes in `yfit-app`.** This rule exists. Follow it. If `yfit-app` cannot support something technically, explain why to the user and ask what they want to do — do not silently put it somewhere else.

---

## PART 1 — What YFIT AI Is

YFIT AI is an AI-powered health and fitness Progressive Web App (PWA) for iOS and Android. It is distributed exclusively through the marketing website (not the App Store or Google Play). Users add it to their home screen from `yfitai.com`. The business is registered in Manitoba, Canada, charges in USD, and uses Stripe for payments.

**Core features of the app:** AI coaching, barcode nutrition scanning, medication tracking with provider reports, real-time form analysis, workout tracking, sleep and water tracking, glucose tracking.

**Pricing tiers:** Free (basic), Pro Monthly ($12.99 USD), Pro Yearly ($99.99 USD), Lifetime ($249.99 USD), Free full-featured trial.

---

## PART 2 — The Complete Infrastructure Map

This is every service, where it lives, and its URL. Do not guess — use this table.

| Service | URL | Where to Edit | Notes |
|---------|-----|---------------|-------|
| **Marketing website (LIVE)** | https://yfitai.com | `/home/ubuntu/yfit-marketing-official/` | Vercel auto-deploys on git push to main. MARKETING ONLY. |
| **Main app (LIVE)** | https://app.yfitai.com | `/home/ubuntu/yfit-app/` | React PWA, Vercel-deployed. ALL app features go here. |
| **App Vercel URL** | https://yfit-deploy.vercel.app | same as above | GoDaddy DNS → app.yfitai.com → this URL |
| **Admin service (LIVE)** | https://admin.yfitai.com | `/home/ubuntu/yfit-admin/` | Railway-deployed. Accounting dashboard + analytics. GitHub: yfitai/yfit-admin |
| **Admin Railway URL** | https://yfit-admin-production.up.railway.app | same as above | Direct Railway URL (always works even if DNS issues) |
| **n8n automation** | https://n8n-railway-production-fbfd.up.railway.app | n8n UI (browser) | Railway-hosted, social media + analytics + reporting workflows |
| **Railway video service** | https://yfitai-yfit-video-service-production.up.railway.app | `/home/ubuntu/yfit-video-service/server.js` | Node.js + ffmpeg, v3.3.0 |
| **Supabase database** | https://mxggxpoxgqubojvumjlt.supabase.co | Supabase dashboard | Videos, voiceovers, content, users |
| **Shared MySQL DB** | TiDB Cloud (see DATABASE_URL in credentials) | Drizzle schema | Accounting tables + marketing site data |
| **GitHub — marketing** | https://github.com/yfitai/yfit-marketing | git push from yfit-marketing-official | Source for yfitai.com |
| **GitHub — app** | https://github.com/yfitai/yfit-app | git push from yfit-app | Source for app.yfitai.com |
| **GitHub — video service** | https://github.com/yfitai/yfit-video-service | git push from yfit-video-service | Railway auto-deploys on push |
| **GitHub — admin** | https://github.com/yfitai/yfit-admin | git push from /home/ubuntu/yfit-admin | Railway auto-deploys on push |
| **Stripe dashboard** | https://dashboard.stripe.com | Browser | Payments, subscriptions, Stripe Tax enabled (5% GST) |
| **Resend (email)** | https://resend.com | Browser / API | Transactional email for contact form and reports |
| **Upload-Post API** | https://app.upload-post.com | Browser / API | Social media posting to 4 platforms |
| **ElevenLabs** | https://elevenlabs.io | API only | Text-to-speech voiceovers for social videos |
| **Pexels API** | https://www.pexels.com/api | API only | Stock video clips for social videos |
| **Manus project (RETIRED)** | https://yfitcoach-8tnedjul.manus.space | `/home/ubuntu/yfit-marketing/` | Analytics migrated to yfit-admin. This URL is no longer needed. |

---

## PART 3 — The Two Website Projects (Critical Distinction)

### THE LIVE MARKETING SITE: `yfit-marketing-official`

```
Path:       /home/ubuntu/yfit-marketing-official/
GitHub:     https://github.com/yfitai/yfit-marketing
Live URL:   https://yfitai.com
Deploy:     git push → Vercel auto-deploys in 2-3 minutes
Stack:      React + Vite + Express + tRPC + MySQL (Vercel serverless)
Purpose:    MARKETING WEBSITE ONLY
            - Hero, features, pricing, FAQ, contact form
            - Add-to-home-screen instructions
            - Stripe payment links
            - SEO, Open Graph, cookie consent
```

**DO NOT add app features, dashboards, or internal tools here.**

To deploy:
```bash
cd /home/ubuntu/yfit-marketing-official
git add -A && git commit -m "description" && git push https://yfitai:ghp_REDACTED_SEE_LOCAL_SANDBOX@github.com/yfitai/yfit-marketing.git main
```

### THE MAIN APP: `yfit-app`

```
Path:       /home/ubuntu/yfit-app/
GitHub:     https://github.com/yfitai/yfit-app
Live URL:   https://app.yfitai.com (also yfit-deploy.vercel.app)
Deploy:     git push → Vercel auto-deploys
Stack:      React PWA (Vite, no backend server — calls Supabase directly)
Purpose:    THE APP — all fitness features, user accounts, dashboards
```

**⚠️ IMPORTANT: `yfit-app` has NO backend server.** It is a pure frontend React PWA. It cannot run Express routes, tRPC procedures, or server-side code. It calls Supabase directly from the browser. If a new feature needs a backend server, this must be discussed with the user before building.

### THE ADMIN SERVICE: `yfit-admin` (NEW — April 19, 2026)

```
Path:       /home/ubuntu/yfit-admin/
GitHub:     https://github.com/yfitai/yfit-admin
Live URL:   https://admin.yfitai.com
Railway URL: https://yfit-admin-production.up.railway.app
Deploy:     git push → Railway auto-deploys
Stack:      Express + tRPC + Drizzle ORM + MySQL (same TiDB database as marketing)
Purpose:    INTERNAL ADMIN TOOLS ONLY
            - Accounting dashboard (PIN-protected)
            - Analytics system (weekly/monthly/year-end reports)
            - REST endpoints for n8n report triggers
```

To deploy:
```bash
cd /home/ubuntu/yfit-admin
git add -A && git commit -m "description" && git push https://yfitai:ghp_REDACTED_SEE_LOCAL_SANDBOX@github.com/yfitai/yfit-admin.git main
```

Railway environment variables (set in Railway dashboard):
- `DATABASE_URL` — TiDB Cloud connection string
- `ACCOUNTING_ADMIN_PIN` — PIN for accounting dashboard login
- `STRIPE_SECRET_KEY` — Stripe restricted key (read charges only)
- `RESEND_API_KEY` — for emailing reports
- `JWT_SECRET` — session signing
- `BUILT_IN_FORGE_API_KEY` / `BUILT_IN_FORGE_API_URL` — Manus LLM API
- `UPLOAD_POST_API_KEY` — social media stats
- `VITE_ANALYTICS_ENDPOINT` / `VITE_ANALYTICS_WEBSITE_ID` — Umami analytics
- `NODE_ENV=production`

### THE MANUS PROJECT: `yfit-marketing` (RETIRED)

```
Path:       /home/ubuntu/yfit-marketing/
Status:     Analytics migrated to yfit-admin on April 19, 2026
            This project is no longer needed for production.
```

---

## PART 4 — Analytics System (Weekly/Monthly/Year-End Reports)

### Current Status: LIVE on yfit-admin Railway service ✅

All reporting is now handled by the dedicated `yfit-admin` Railway service.

**REST endpoints (called by n8n):**
- `POST https://yfit-admin-production.up.railway.app/api/send-weekly-report`
- `POST https://yfit-admin-production.up.railway.app/api/send-monthly-report`
- `POST https://yfit-admin-production.up.railway.app/api/send-year-end-report`

**tRPC endpoints (called by accounting dashboard UI):**
- `/api/trpc/analytics.*` — social stats, website stats, AI analysis

**n8n workflows (all published and active):**

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| YFIT Weekly Analytics Report | Every Monday 8am CDT (13:00 UTC) | Social + website stats for past 7 days |
| YFIT Monthly Report | 1st Monday of each month 8am CDT | P&L for previous month (after CSV upload) |
| YFIT Year-End Report | 1st Monday of January 8am CDT | Annual statement for previous year |

**Monthly report workflow:** Runs 1st Monday of each month to give time over the weekend to download and upload the CIBC Mastercard CSV before the report generates.

**Year-end report workflow:** Runs 1st Monday of January to give New Year's weekend to upload the December CSV before the annual statement generates.

### What the reports contain
- Upload-Post social media performance (Instagram, LinkedIn, YouTube, Pinterest)
- Umami website analytics (sessions, pageviews, engagement rate)
- AI-generated analysis and recommendations
- PDF emailed to support@yfitai.com

---

## PART 5 — Accounting System (Monthly P&L / GST)

### Current Status: LIVE on yfit-admin Railway service ✅

**Dashboard URL:** `https://admin.yfitai.com` (PIN-protected)
**Direct Railway URL:** `https://yfit-admin-production.up.railway.app`

**What was built:**
| File | Purpose |
|------|---------|
| `server/stripeSync.ts` | Pulls Stripe charges, converts USD→CAD |
| `server/csvImporter.ts` | Parses CIBC Mastercard CSV, auto-categorizes, calculates 5% GST ITCs |
| `server/accountingRouter.ts` | tRPC router for all accounting operations |
| `server/accountingAuth.ts` | PIN-based admin authentication |
| `server/accountingPdf.ts` | Generates monthly P&L PDF |
| `server/accountingEmail.ts` | Emails PDF via Resend to support@yfitai.com |

**Database tables (live in shared MySQL/TiDB DB):**
- `stripe_income` — Stripe charges
- `expenses` — CIBC CSV transactions
- `csv_import_batches` — upload history
- `monthly_reports` — cached P&L summaries

**⚠️ NOTE:** The accounting dashboard UI (React frontend) was built in `yfit-marketing-official` at `https://yfitai.com/accounting`. The backend API is now on `yfit-admin`. The UI still lives in the marketing site — this is a known inconsistency. Future decision: either move the UI to yfit-admin or keep it in marketing-official.

### Business Rules
- GST rate: 5% federal (Manitoba — PST not collected on digital services)
- Stripe Tax enabled — GST auto-collected on Canadian customers
- GST ITCs: 5% of eligible expenses claimable
- Fiscal year: January 1 – December 31
- Reports email: support@yfitai.com

---

## PART 6 — Social Media Automation Pipeline

**Status: FROZEN — do NOT re-activate until all 8 steps below are complete**

Daily at 6:00 AM CDT via n8n on Railway.

### Flow
1. n8n Schedule → Supabase Edge Function (`scrape-fitness-articles`)
2. Supabase → saves articles to `content_items` table
3. n8n → reads article, generates script with LLM
4. ElevenLabs → converts script to voiceover with word timestamps
5. Supabase Storage → stores audio in `yfit-voiceovers` bucket
6. Railway ffmpeg service → assembles video (Pexels + voiceover + captions + logo + watermark)
7. Supabase Storage → stores video in `yfit-videos` bucket
8. Upload-Post API → posts to Instagram, LinkedIn, YouTube, Pinterest

### Fix Steps Required Before Re-activation
| Step | Status | Action |
|------|--------|--------|
| 1. Verify audio from execution #117 | Pending | Check Supabase `yfit-voiceovers/voiceovers/` for tiny file |
| 2. Fix script field in Parse Supabase Payload | Pending | Verify `primaryVideoItem.script` is not empty |
| 3. Fix Pexels queries per content angle | Pending | Update `getPexelsVideos()` in server.js |
| 4. Fix caption chunking (max 3 words) | Pending | Update `buildCyclingCaptionFilters()` in server.js |
| 5. Fix undefined filename | Pending | Add fallback date in storagePath line ~769 |
| 6. Deploy to Railway (git push) | Pending | After steps 3-5 complete |
| 7. Run isolated Railway test | Pending | Verify 30-60s video, audio, 2-3 word captions |
| 8. Re-activate n8n | Pending | Only after step 7 passes |

### Platforms
| Platform | Account | Format |
|----------|---------|--------|
| Instagram | @yfitai | Reel (9:16) |
| LinkedIn | YFIT AI company page | Video |
| YouTube | YFIT AI channel | Short |
| Pinterest | YFIT AI board | Video Pin |

TikTok decision deferred to April 15, 2026.

---

## PART 7 — Key Credentials

| Service | Credential | Notes |
|---------|-----------|-------|
| GitHub PAT | `ghp_REDACTED_SEE_LOCAL_SANDBOX` | Non-expiring, full repo access |
| Supabase URL | `https://mxggxpoxgqubojvumjlt.supabase.co` | |
| Supabase service role (legacy) | `SUPABASE_SERVICE_ROLE_REDACTED` | Use for Storage. New key does NOT work for storage. |
| Supabase new secret | `SUPABASE_SECRET_REDACTED` | REST API only, NOT storage |
| Railway video service URL | `https://yfitai-yfit-video-service-production.up.railway.app` | |
| Railway API secret | `yfit-video-secret-2024` | |
| Railway admin service URL | `https://yfit-admin-production.up.railway.app` | Also at admin.yfitai.com |
| n8n API key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMGFkMDBiYy1mY2VjLTQ5NzgtODllYy01YjI0MDM0MWZmNmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTc3ZmI3OTctMjQ2Zi00YzQ0LTllNTEtMDQ2Y2Y5NzI0ZDVkIiwiaWF0IjoxNzc1MjY4NDIzLCJleHAiOjE3ODI5NjQ4MDB9.ka40DvpbJ7LnxxxY1FqHo31GI5Hi71ApYCFTqnl2MhQ` | |
| ElevenLabs API key | `ELEVENLABS_KEY_REDACTED` | |
| Stripe live restricted key | `STRIPE_LIVE_KEY_REDACTED` | Read charges only |
| DATABASE_URL | `mysql://2CmvfQMJtbUUjpx.root:eCDQMO6Q51pvr38HG5QD@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/8TNedJULyoVCPDLa6UYde3?ssl={"rejectUnauthorized":true}` | TiDB Cloud — shared by marketing + admin |
| BUILT_IN_FORGE_API_KEY | `FORGE_API_KEY_REDACTED` | Manus LLM API |
| BUILT_IN_FORGE_API_URL | `https://forge.manus.ai` | |
| RESEND_API_KEY | `RESEND_KEY_REDACTED` | |
| UPLOAD_POST_API_KEY | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN1cHBvcnRAeWZpdGFpLmNvbSIsImV4cCI6NDkyNjk1OTUwMSwianRpIjoiNTFiNjY0YWQtMGNkZS00ODI3LTgzMWMtNDY4NTVhODJkZTA1In0.3ZkZ5_MzFvu7nmlVcJNtbz4SgtxibhQltUWMFGSWkbU` | |
| VITE_ANALYTICS_ENDPOINT | `https://manus-analytics.com` | Umami |
| VITE_ANALYTICS_WEBSITE_ID | `9d198333-8322-4848-9258-0476c99e5df5` | |

---

## PART 8 — Brand & Video Decisions (Final — Do Not Change Without Permission)

| Decision | Value |
|----------|-------|
| Logo file | `yfit-logo-transparent.png` in Supabase `yfit-videos/assets/` |
| Logo background | Transparent — NO background box |
| Logo position | Top-left, 30px padding, 260px wide |
| CTA watermark | `yfitai.com - Try free`, green (#00ff88), bottom center |
| Video format | 1080×1920 vertical (9:16) |
| Frame rate | 30fps |
| Caption style | Cycling 2-3 words, timed to ElevenLabs word timestamps |
| Caption area | Black bar bottom, 80% opacity, 340px tall |
| Caption font | DejaVuSans-Bold |
| Voice | Random from 5 male + 5 female ElevenLabs pool |
| BGM volume | 0.35 |
| Video codec | H.264 (libx264), preset fast, CRF 22 |
| Brand colors | Blue gradient #00AAFF→#0066CC, dark grey #3D3D3D |

---

## PART 9 — What Is Complete vs Incomplete

### Fully Complete and Live
- [x] Marketing website (yfitai.com)
- [x] Main app (app.yfitai.com) — full PWA with all fitness features
- [x] Social media automation pipeline (frozen pending 8 fixes)
- [x] Contact form with AI auto-responder
- [x] Stripe payments with Stripe Tax (GST)
- [x] SEO, Open Graph, sitemap, robots.txt
- [x] Cookie consent banner
- [x] Add-to-home-screen instructions
- [x] Analytics system — migrated to yfit-admin Railway service ✅
- [x] Accounting system — migrated to yfit-admin Railway service ✅
- [x] yfit-admin Railway service at admin.yfitai.com ✅ (built April 19, 2026)
- [x] n8n weekly analytics report workflow (published, tested) ✅
- [x] n8n monthly report workflow (published, tested) ✅
- [x] n8n year-end report workflow (published, tested) ✅

### Needs Attention Next Session
- [ ] **Social media pipeline 8-step fix** (frozen — see Part 6)
- [ ] **Accounting dashboard UI** still lives in yfit-marketing-official at yfitai.com/accounting — decide: keep there or move to admin.yfitai.com
- [ ] Verify `admin.yfitai.com` SSL certificate issued (Railway auto-provisions after DNS verified)
- [ ] Upload first CIBC CSV to accounting dashboard to verify auto-categorization works end-to-end
- [ ] Test monthly report email by manually triggering the n8n workflow

### Pending / Not Started
- [ ] TikTok integration (decision deferred April 15, 2026)
- [ ] Marketing site hero headline update
- [ ] Public FAQ page at yfitai.com/faq
- [ ] Social proof section on marketing site
- [ ] Pinterest domain verification
- [ ] Contact form RESEND_API_KEY fix
- [ ] Facebook integration

---

## PART 10 — How to Resume Any Session

**Step 1:** Read this file completely.
**Step 2:** Read `/home/ubuntu/YFIT_RESUME_STATE.md` for last session's unfinished work.
**Step 3:** Ask the user what they want to work on.
**Step 4:** Before making any change, confirm which project it belongs in using Part 2.
**Step 5:** After completing work, update this file and YFIT_RESUME_STATE.md.

**The user's standing instruction:** At the start of every session, the user will say "read the master reference." This is the trigger to read this file before doing anything else.

---

*Last updated: April 19, 2026 — Session completed. Built and deployed yfit-admin Railway service at admin.yfitai.com. Migrated accounting system and analytics from fragile Manus URL to permanent Railway service. Created and published 3 n8n reporting workflows (weekly analytics, monthly report, year-end report) — all tested and working. DNS for admin.yfitai.com configured, SSL pending Railway verification. Next session priority: social media pipeline 8-step fix.*
