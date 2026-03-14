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
- [ ] Add Stripe feature to project
- [ ] Set up payment processing for subscription tiers
- [ ] Implement refund handling
- [ ] Configure beta testing tier
- [ ] Test payment flows

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
- [ ] Add form analysis video (waiting for user upload)

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
