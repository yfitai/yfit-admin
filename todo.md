# YFIT Marketing Website TODO

## Core Website Features
- [x] Fix CSS animation issue (animate-gradient)
- [x] Resolve Home.tsx conflict from template upgrade
- [x] Add prominent Medication Tracking feature section
- [x] Add prominent Form Analysis feature section
- [x] Hero section with glassmorphism design
- [x] Features grid showcasing AI capabilities
- [x] Pricing section with 4 tiers (Free, Pro Monthly $12.99, Pro Yearly $99.99, Lifetime $249.99)
- [x] "Launch App" button linking to https://yfit-deploy.vercel.app
- [x] Limited-time offer banner (First Month Free)
- [x] Responsive mobile design
- [x] Footer with links

## Stripe Integration
- [x] Add Stripe feature to project
- [x] Set up payment processing for subscription tiers
- [x] Implement refund handling
- [x] Configure beta testing tier
- [x] Test payment flows

## Social Media Automation (Future Phase)
- [ ] Integrate Pictory API for video generation
- [ ] Build content scraping system (WebMD, Mayo Clinic, etc.)
- [ ] Create posting automation for 6 platforms
- [ ] Implement analytics for engagement tracking
- [ ] Connect daily quotes to YFIT app

## Deployment
- [ ] Deploy to Vercel
- [ ] Configure yfitai.com to show marketing site first
- [ ] Test all links and functionality


## User-Requested Design Changes
- [x] Fix YFIT icon (integrated actual YFIT logo with motion lines)
- [x] Update pricing labels: Lifetime = "Most Popular", Yearly = "Best Value"
- [x] Change "AI Nutrition Scanner" to "Barcode Scanner"
- [x] Remove glass man avatar image
- [x] Lighten color scheme from deep blue-purple to blue-green
- [x] Add 8 Quick Action Cards section (Goals, Nutrition, Fitness, Daily Tracker, Medications, Progress, Predictions, AI Coach)
- [x] Update Medication card to mention "Provider Report" and interactions
- [x] Add personalization messaging throughout site
- [x] Add form analysis video (waiting for user upload)
- [x] Add FormAnalysisShowcase interactive demo section to marketing site
- [x] Add MedicationShowcase interactive mockup section to marketing site
- [x] Add Testimonials section to marketing site

## App Bug Fixes (Main YFIT App)
- [x] Fix My Foods serving size bug: loading saved scanned food shows 1g instead of label serving size
- [ ] Verify we're working in the main app deployment (check verification)
- [ ] Fix Progress page predictive insights showing incorrect data:
  - [ ] Next week volume incorrectly showing 3.7k lbs (should be fixed)
  - [ ] Projected strength gain showing 0% per week
  - [ ] Goal achievement showing 0%
- [ ] Research better nutrition databases (low/no cost alternatives)
- [ ] Fix branded foods showing French/Chinese results instead of English
- [ ] Improve USDA database search relevance (too many irrelevant results)

## Google Play Beta Testing
- [ ] Check tester opt-in status tomorrow

## Workout Calculation Bugs (Main YFIT App)
- [x] Fix Predictions: Deload predictor incorrectly showing "deload needed" with only 4 workouts
- [x] Fix Fitness page: Strength section only showing 3 workouts instead of 4
- [x] Fix Predictions: Habit streak showing 15 workouts and 7x/week avg (wildly incorrect)
- [x] Fix Progress: Workout streak always shows 2 days due to schedule-unaware streak logic (M,T rest W, T,F,S rest Sun)
- [x] Fix Predictions: Habit streak counting non-strength sessions (cardio/walking) in total workout count and avg/week
- [x] Nutrition page: Replace "no data" empty state with friendly "no workouts logged yet this week" message after Sunday reset

## UX & Theme Improvements
- [x] Predictions page: Add "Building this week's data..." placeholder cards when prediction functions return null (Sunday/early week)
- [x] Fitness/Progress page: Add weekly reset banner on Sunday when workout count is 0
- [x] Monday morning recap nudge: Banner showing last week's summary (workouts, calories, streak)
- [x] Tiered theme: Apply light green-blue tint to stat/summary cards across all pages (keep data lists, charts, forms white)

## Prediction Fixes & UX Enhancements (Round 2)
- [x] Fix Predictions: Injury risk training frequency counting Sunday (shows 6x, should be 5x for Mon-Sat week)
- [x] Fix Predictions: Body recomp fat loss showing -51.6 lbs (unrealistic — likely weekly deficit used instead of 12-week projection)
- [x] Fix Predictions: Body recomp muscle gain showing +4.4 lbs (check if 12-week math is correct)
- [x] Monday recap: Pull last week's streak from Supabase instead of current (reset) streak
- [x] Sunday wrap-up: Add "Log today's workout to finish the week strong" CTA button linking to workout logger
- [x] Goals page: Apply teal theme to form/section cards (Body Type Education, Basic Info, Body Measurements, Manual Overrides)

## Prediction & Theme Fixes (Round 3)
- [x] Fix Predictions: TDEE/Calorie Needs card still showing 6x activity level (has its own separate frequency calc)
- [x] Fix Progress: Projected strength gain showing +22.2%/week (unrealistic - relabeled as Volume Trend with ±15% cap)
- [x] Standardize week boundary to Sunday=start, Saturday=end across ALL calculations (currently inconsistent)
- [x] Apply teal theme to Body Recomp progress cards (currently white)
- [x] Apply teal theme to FAQ page cards

## Theme & UX Fixes (Round 4)
- [x] Apply teal theme to Medications page cards
- [x] Apply teal theme to Fitness log and create workout pages
- [x] Fix Progress page Last Week Summary card to show every day (not just Mondays)
- [x] Dashboard: Add "first full week" empty state message to Last Week Summary card when both values are 0

## Theme & UX Fixes (Round 5)
- [ ] Apply teal theme to exercise selector cards in WorkoutLogger/ExerciseSelector (Form page)
- [ ] Apply teal theme to Goal Summary card in Goals page
- [ ] Apply teal theme to Daily Tracker, Weekly, and Templates tabs in Nutrition page

## Bug Fixes
- [x] Medications: Provider report PDF shows only title/date with no medication data (blank body)
- [x] Medications: Provider report PDF shows "no medications on file" for custom-added medications (query only fetches DB-linked meds)
- [x] Medications: Verify supplements appear correctly in provider report PDF - now fetches from both user_supplements and user_medications(is_supplement=true)

## Social Media Automation — Master Launch Checklist

### Phase 2: Account Setup (Partially Done)
- [x] YouTube channel created and profiled
- [ ] Facebook Page — complete profile (logo, banner, About, website), copy Page ID
- [ ] Pinterest Business — verify website, create 5 boards, get access token from developers.pinterest.com
- [ ] Instagram Business — complete profile, get access token via developers.facebook.com
- [ ] LinkedIn Company Page — complete profile, get access token from linkedin.com/developers
- [x] TikTok — created @yfitai account (social@yfitai.com), connected to Upload-Post as "Smokey" — rename to YFIT AI after Apr 15

### Phase 3: Upload-Post Connections (Waiting on Phase 2)
- [x] Log in to upload-post.com and connect YouTube (OAuth)
- [x] Connect Facebook Page (Page ID + token) — COMPLETED Apr 12, 2026. YFIT AI Page ID: 972545122618897
- [x] Connect Pinterest (@yfitai Business account) — connected
- [x] Connect Instagram (yfit.ai Business account) — connected
- [x] Connect LinkedIn — connected, posts go to YFIT AI Company Page (ID: 113374511)
- [x] Connect TikTok (@yfitai) — connected
- [ ] Copy Upload-Post API key → send to Manus for n8n/Supabase secrets

### API Keys Still Needed (User Action)
- [ ] Get Pexels API key — pexels.com/api (free, instant)
- [ ] Get ElevenLabs API key — elevenlabs.io (free tier)
- [ ] Get Upload-Post API key — from upload-post.com account settings

### Manus Tasks (After User Provides API Keys)
- [x] Upgrade video service to use real Pexels video backgrounds (server.js updated)
- [x] Add Pexels, ElevenLabs, Upload-Post API keys to n8n workflow (already embedded)
- [ ] Add PEXELS_API_KEY to Railway video service environment variables (user action required)
- [ ] Update n8n workflow with Upload-Post API key and YFIT profile username
- [ ] Add social media follow links to welcome email template
- [ ] Add social media links to footer of all automated emails
- [ ] Verify generate-social-content edge function reads same article as Daily Insight
- [ ] Run end-to-end dry run of full automation pipeline

### Phase 4: Link-in-Bio (After Accounts Created)
- [ ] Create Linktree at linktr.ee/yfitai with all 6 platform links
- [ ] Update Instagram bio link to Linktree URL
- [ ] Update TikTok bio link to Linktree URL

### Backlog / Future
- [ ] FormScoreGauge not displaying on Android device (service worker cache issue)
- [x] Add Pexels real video backgrounds to video assembly service (replace static gradient)
- [ ] Phase 7: First manual posts on each platform (3 posts each before automation)
- [ ] Phase 8: Full integration test (email, content gen, video assembly, social posting)
- [ ] Phase 9: Enable daily cron + n8n schedule for full automation go-live

## Decisions & Technical Findings Log

### Facebook Connection — RESOLVED (Apr 12, 2026)
- **Status**: FULLY CONNECTED. Upload-Post API now returns YFIT AI Page. n8n workflow updated.
- **YFIT AI Facebook Page ID**: `972545122618897` (internal Meta Page ID)
- **YFIT AI Facebook Profile URL**: https://www.facebook.com/profile.php?id=61574304872606
- **Resolution path**: Facebook security hold was resolved by changing password on Android → approving login on Samsung S25 Ultra → navigating directly to facebook.com on desktop (bypassed the /hacked redirect). Then reconnected Upload-Post OAuth on desktop — this time the Page selection screen appeared showing YFIT AI and ROGA Drone. Selected YFIT AI, granted all Page permissions.
- **Permissions granted to Upload-Post**: Create/manage content on Page, Manage comments, Read content, Read user content, Show list of Pages
- **n8n workflow updated**: `facebook_page_id: "972545122618897"` added to both Upload-Post — Post Video and Upload-Post — Post Text nodes. Saved via REST API (Status 200).
- **social@yfitai.com**: Already associated with another Facebook account — cannot be added to Don Campbell account.

### Upload-Post Plan (Apr 11, 2026)
- Account shows **Premium** plan (previously noted as Basic — was upgraded)
- API key: `eyJhbGci...MFGSWkbU` (created 3/12/2026, Active)
- Profile name in Upload-Post: **YFIT**
- Platforms connected: Instagram ✓, YouTube ✓, LinkedIn ✓, Pinterest ✓, TikTok ✓, Facebook ✓ (YFIT AI Page, ID: 972545122618897)

### v2.9.0 Video Service (Apr 11, 2026)
- Deployed to Railway, not yet tested with a new Instagram post
- Key improvements: BGM at 15% volume, Montserrat ExtraBold font, 52px captions, brightness boost, luma threshold 110
- Next session: trigger a test run via n8n webhook and check Instagram for quality improvement

## Pending Decisions

- [ ] **April 15 — TikTok posting frequency decision**: TikTok account becomes active April 15 (nickname change). Decide: (a) 1x/day at 7 AM same as other platforms, (b) 2x/day at 7 AM + 7 PM with genuinely different content/angle each time. Decision should be based on early engagement data from first week. Duplicate posting (same video twice) not recommended — TikTok may flag it.

## n8n Schedule Trigger Setup

- [ ] Add Schedule Trigger node to n8n workflow firing at 6:00 AM CDT (11:00 AM UTC) daily — replaces Supabase daily-trigger dependency (which has 0 invocations, never ran)
- Current posting times per platform: Instagram 8 AM, LinkedIn 8 AM, YouTube 9 AM, Facebook 1 PM, Pinterest 8 PM (all CDT)
- TikTok posting time: TBD after April 15 frequency decision

## Weekly Analytics Report System
- [x] Add analytics proxy tRPC endpoint to server (Umami + Upload-Post data)
- [x] Add UMAMI_ENDPOINT and UMAMI_WEBSITE_ID to server env.ts
- [x] Add PDF report generator endpoint to server
- [x] Add AI analysis section using invokeLLM
- [x] Add Umami custom event tracking to marketing site CTA buttons
- [x] Build n8n workflow: YFIT Weekly Analytics Report (Monday 6 AM CDT)
- [x] Wire Resend email delivery with PDF attachment in n8n
- [x] Test end-to-end and send first sample report

## Monthly P&L / GST Accounting System
- [x] Database schema: 5 tables (stripe_income, expenses, expense_categories, csv_import_batches, monthly_reports)
- [x] Stripe income sync module (stripeSync.ts) — pulls charges, converts USD→CAD, calculates fees
- [x] CIBC CSV importer (csvImporter.ts) — parse CIBC format, auto-categorize, calculate GST ITCs
- [x] Accounting tRPC router (accountingRouter.ts) — CSV upload, expense CRUD, report generation
- [x] Accounting dashboard UI — CSV upload page, expense review table, report viewer
- [x] Monthly P&L PDF generator — Manitoba GST remittance layout
- [x] Monthly report email endpoint — POST /api/send-monthly-report
- [x] n8n workflow — first Monday after month-end trigger
- [x] Year-end annual statement generator
- [x] Push DB schema migrations

## Bulk CSV Backfill (Sept 2025 – Jun 2026)
- [ ] Add `bulkUploadCsv` tRPC mutation to accountingRouter (accepts array of {fileName, csvContent, statementMonth})
- [ ] Add bulk upload UI to Accounting.tsx: multi-file select, auto-detect month from filename, sequential import with progress
- [ ] Add auto-Stripe-sync after each CSV import (trigger syncStripeIncomeForMonth automatically)
- [ ] Add step-by-step CIBC CSV download instructions panel in the UI
- [ ] Test bulk import with 10 months of data (Sept 2025 – Jun 2026)
- [ ] Checkpoint and deploy

## Historical Quarterly Accounting Reports — August 2026
- [x] Inventory available CIBC credit-card statement imports and Stripe sales records for Q2 2025, Q3 2025, Q4 2025, Q1 2026, and Q2 2026
- [x] Backfill Stripe charges for April 2025 through June 2026; found two March 2026 charges: one fully refunded and one retained $104.99 USD charge
- [x] Reconcile draft quarterly gross Stripe sales, estimated fees, CIBC expenses, and provisional GST ITCs using source transactions
- [x] Generate five draft quarterly accounting reports and flag source assumptions and review items before tax use
- [ ] Review 64 imported CIBC transactions marked unreviewed before relying on provisional GST ITCs for a tax filing

## Marketing Site Redesign (Session 23)
- [x] Rewrite Home.tsx with visual-first layout (remove text-heavy card sections)
- [x] New problem-first hero headline: "The fitness app that tracks your medications and analyses your form"
- [x] Replace 8 text cards with 3 real app screenshot showcase
- [x] Replace text-based differentiator cards with visual feature panels (pink/blue)
- [x] Add competitor comparison table (YFIT vs MyFitnessPal vs Noom)
- [x] Add FAQ section with 5 accordion items
- [x] Add bottom CTA section
- [x] Add working mobile hamburger menu with all nav links
- [x] Fix Contact footer link to mailto:support@yfitai.com
- [x] Remove fake social proof placeholder avatars
- [x] Pricing: BEST VALUE on Yearly, MOST POPULAR on Lifetime (correct labels)
- [ ] Add actual app screenshots for Nutrition, Medications, Progress pages (need user to provide)
- [ ] Restore multilingual support (i18n) for new page structure
