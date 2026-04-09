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
- [ ] Connect Facebook Page (Page ID + token) — BROKEN, personal profile only, tackle tomorrow
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
