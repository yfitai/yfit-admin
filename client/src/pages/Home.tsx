import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, ChevronDown, ChevronUp, Pill, Eye, Activity, Zap, Menu, X } from "lucide-react";
import { useTracking } from "@/hooks/useTracking";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663099417101/8TNedJULyoVCPDLa6UYde3";

const appScreenshots = [
  {
    src: `${CDN}/hero-dashboard_e4827135.png`,
    label: "Dashboard",
    caption: "Your entire health picture at a glance",
  },
  {
    src: `${CDN}/nutrition-scan_df58381c.png`,
    label: "Nutrition",
    caption: "Scan barcodes. Track macros. AI meal suggestions.",
  },
  {
    src: `${CDN}/workout-analytics_0b8e2b7f.png`,
    label: "Analytics",
    caption: "AI predictions for weight, strength & milestones",
  },
];

const faqItems = [
  {
    q: "Do I need gym equipment or a trainer?",
    a: "No. YFIT works whether you train at home, at the gym, or outdoors. The AI coach adapts to your environment and equipment availability.",
  },
  {
    q: "Is my health data private and secure?",
    a: "Yes. Your data is encrypted in transit and at rest. We never sell personal health data. You can export or delete your data at any time.",
  },
  {
    q: "Does it work for people who take medications?",
    a: "YFIT is the only fitness app built with medication tracking at its core. Log prescriptions and supplements, receive interaction warnings, and generate professional provider reports to share with your doctor.",
  },
  {
    q: "What's the difference between Free and Pro?",
    a: "The free plan gives you core tracking — workouts, manual meal logging, and 3 saved routines. Pro unlocks unlimited AI coaching, the barcode scanner, medication tracking, form analysis, advanced analytics, and AI predictions.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes. Cancel anytime from inside the app or through the Stripe billing portal. You keep Pro access until the end of your billing period.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-primary/20 rounded-xl overflow-hidden"
      onClick={() => setOpen(!open)}
    >
      <button className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-foreground hover:bg-primary/5 transition-colors">
        <span>{q}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
        ) : (
          <ChevronDown className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 text-muted-foreground leading-relaxed text-sm border-t border-primary/10 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { track } = useTracking();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const launchApp = (source: string) => {
    track(`cta_click_${source}`);
    window.location.href = "https://app.yfitai.com";
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* Promo Banner */}
      <div className="w-full bg-gradient-to-r from-primary to-accent text-white py-2.5 text-center text-sm font-semibold">
        🎉 Limited time: First month FREE on Pro — new users only 🎉
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-primary/15 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img
            src={`${CDN}/yfit-logo_e0bb531c.png`}
            alt="YFIT Logo"
            className="h-9 w-auto"
          />
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            <a href="#features" onClick={() => track("nav_features")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#compare" onClick={() => track("nav_compare")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Compare</a>
            <a href="#pricing" onClick={() => track("nav_pricing")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <a href="#faq" onClick={() => track("nav_faq")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</a>
            <LanguageSwitcher />
            <Button
              onClick={() => launchApp("nav")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-md"
            >
              Launch App
            </Button>
          </div>
          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-primary/10 px-6 py-4 flex flex-col gap-4">
            <a href="#features" onClick={() => { track("nav_features_mobile"); setMobileMenuOpen(false); }} className="text-sm font-medium text-foreground">Features</a>
            <a href="#compare" onClick={() => { track("nav_compare_mobile"); setMobileMenuOpen(false); }} className="text-sm font-medium text-foreground">Compare</a>
            <a href="#pricing" onClick={() => { track("nav_pricing_mobile"); setMobileMenuOpen(false); }} className="text-sm font-medium text-foreground">Pricing</a>
            <a href="#faq" onClick={() => { track("nav_faq_mobile"); setMobileMenuOpen(false); }} className="text-sm font-medium text-foreground">FAQ</a>
            <Button onClick={() => launchApp("nav_mobile")} className="bg-gradient-to-r from-primary to-accent text-white w-full">
              Launch App
            </Button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-28 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
                <Zap className="w-4 h-4" />
                The only all-in-one health &amp; fitness app
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-foreground">
                The fitness app that tracks your{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  medications
                </span>{" "}
                and analyses your{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">
                  form.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                YFIT AI combines workouts, nutrition, medications, sleep, AI coaching, and real-time form analysis in one app. No other fitness app does this.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => launchApp("hero_primary")}
                  size="lg"
                  className="text-base px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/20"
                >
                  Start Free Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  onClick={() => { track("hero_see_app"); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
                  size="lg"
                  variant="outline"
                  className="text-base px-8 border-primary/30 hover:bg-primary/5"
                >
                  See the App
                </Button>
              </div>
              {/* Honest feature badges */}
              <div className="flex flex-wrap gap-3 pt-2">
                {["8 health modules", "AI-powered coaching", "Free to start", "No credit card needed"].map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/8 border border-primary/20 rounded-full px-3 py-1">
                    <Check className="w-3 h-3" /> {badge}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative flex justify-center">
              <div className="absolute -inset-6 bg-gradient-to-r from-primary/15 to-accent/15 rounded-3xl blur-2xl" />
              <img
                src={`${CDN}/hero-dashboard_e4827135.png`}
                alt="YFIT Dashboard"
                className="relative rounded-2xl border border-primary/20 shadow-2xl w-full max-w-lg hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── APP SCREENSHOT SHOWCASE ── */}
      <section id="features" className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">See it in action</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every screen is built around one goal: making your health data easy to understand and act on.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {appScreenshots.map((shot) => (
              <div key={shot.label} className="group flex flex-col gap-4">
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 shadow-xl bg-white">
                  <img
                    src={shot.src}
                    alt={shot.label}
                    className="w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20 shadow-sm">
                      {shot.label}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground font-medium">{shot.caption}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button
              onClick={() => launchApp("features_cta")}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white px-10 shadow-lg shadow-primary/20"
            >
              Try it free — no credit card required
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── TWO UNIQUE DIFFERENTIATORS ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-block mb-3 px-4 py-1 rounded-full bg-accent/10 text-accent text-sm font-bold border border-accent/20">
              EXCLUSIVE TO YFIT
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">What no other app does</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These two features exist in YFIT and nowhere else.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Medication Tracking */}
            <div className="group relative rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-50 to-white p-8 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-40 h-40 bg-pink-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Pill className="w-7 h-7 text-pink-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Medication &amp; Supplement Tracking</h3>
                <p className="text-muted-foreground mb-5 leading-relaxed">
                  The only fitness app that lets you track prescriptions and supplements alongside your workouts — and generate professional reports to share with your doctor.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Log prescriptions, supplements & vitamins",
                    "Drug interaction warnings",
                    "Generate provider-ready PDF reports",
                    "Track medication adherence over time",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => launchApp("differentiator_medication")}
                  className="mt-7 bg-pink-600 hover:bg-pink-700 text-white"
                >
                  Track Medications Free
                </Button>
              </div>
            </div>

            {/* Form Analysis */}
            <div className="group relative rounded-3xl border border-primary/20 bg-gradient-to-br from-blue-50 to-white p-8 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Eye className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Real-Time AI Form Analysis</h3>
                <p className="text-muted-foreground mb-5 leading-relaxed">
                  Your webcam becomes a personal trainer. YFIT watches your form in real-time, counts reps, and gives instant audio feedback — preventing injury before it happens.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Live rep counting with AI feedback",
                    "Injury prevention alerts",
                    "Works with 10+ exercises",
                    "No wearable or extra hardware needed",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => launchApp("differentiator_form")}
                  className="mt-7 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                >
                  Try Form Analysis Free
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPETITOR COMPARISON TABLE ── */}
      <section id="compare" className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">How YFIT compares</h2>
            <p className="text-lg text-muted-foreground">
              Other apps do one thing well. YFIT does everything.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-primary/20 shadow-xl bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground w-1/3">Feature</th>
                  <th className="px-6 py-4 font-bold text-primary text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Activity className="w-5 h-5" />
                      YFIT AI
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground text-center">MyFitnessPal</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground text-center">Noom</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Medication & supplement tracking", yfit: true, mfp: false, noom: false, highlight: true },
                  { feature: "AI real-time form analysis", yfit: true, mfp: false, noom: false, highlight: true },
                  { feature: "Barcode nutrition scanner", yfit: true, mfp: true, noom: false, highlight: false },
                  { feature: "AI coaching & chat", yfit: true, mfp: false, noom: true, highlight: false },
                  { feature: "AI weight & strength predictions", yfit: true, mfp: false, noom: false, highlight: false },
                  { feature: "Progress photos & body measurements", yfit: true, mfp: true, noom: false, highlight: false },
                  { feature: "Workout tracking", yfit: true, mfp: true, noom: false, highlight: false },
                  { feature: "Provider-ready health reports (PDF)", yfit: true, mfp: false, noom: false, highlight: true },
                  { feature: "Free plan available", yfit: true, mfp: true, noom: false, highlight: false },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-primary/5 last:border-0 ${row.highlight ? "bg-primary/3" : ""}`}
                  >
                    <td className={`px-6 py-4 ${row.highlight ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {row.highlight && <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />}
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.yfit ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                          <Check className="w-4 h-4 text-primary font-bold" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 text-lg font-light">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.mfp ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted/50">
                          <Check className="w-4 h-4 text-muted-foreground" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 text-lg font-light">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.noom ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted/50">
                          <Check className="w-4 h-4 text-muted-foreground" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 text-lg font-light">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Comparison based on publicly available feature information as of 2025. Highlighted rows are features unique to YFIT.
          </p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-4">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">Choose your plan</h2>
            <p className="text-lg text-muted-foreground mb-2">Start free. Upgrade when you're ready.</p>
            <p className="text-sm font-semibold text-primary">No hidden fees · Cancel anytime · No credit card required for free plan</p>
          </div>

          {/* Limited offer banner */}
          <div className="max-w-xl mx-auto mb-10 mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl px-6 py-4">
            <span className="text-2xl">🎉</span>
            <p className="text-sm font-semibold text-foreground">
              <span className="text-primary">Limited time:</span> New users get their first Pro month FREE — no code needed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {/* Free */}
            <div className="rounded-2xl border border-primary/20 bg-white p-6 flex flex-col gap-5 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Starter</p>
                <div className="text-4xl font-bold text-foreground">$0<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <p className="text-sm text-muted-foreground mt-1">Essential tracking tools</p>
              </div>
              <ul className="space-y-2.5 flex-1">
                {["Basic workout tracking", "Manual meal logging", "3 saved routines", "5 barcode scans/month", "3 form analyses/month", "10 AI Coach queries/month", "Predictions preview"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => launchApp("pricing_free")} variant="outline" className="w-full border-primary/30 hover:bg-primary/5">
                Get Started Free
              </Button>
            </div>

            {/* Pro Monthly */}
            <div className="rounded-2xl border border-primary/30 bg-white p-6 flex flex-col gap-5 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pro Monthly</p>
                <div className="text-4xl font-bold text-foreground">$12.99<span className="text-base font-normal text-muted-foreground"> USD/mo</span></div>
                <p className="text-sm text-muted-foreground mt-1">Full AI access</p>
              </div>
              <ul className="space-y-2.5 flex-1">
                {["Unlimited barcode scanner", "Medication tracking", "Unlimited AI coaching", "Advanced analytics", "Full AI predictions", "Priority support"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => launchApp("pricing_monthly")} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white">
                Start Free Trial
              </Button>
            </div>

            {/* Pro Yearly — BEST VALUE */}
            <div className="rounded-2xl border-2 border-accent bg-gradient-to-b from-accent/5 to-white p-6 flex flex-col gap-5 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-accent to-primary text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  BEST VALUE
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-accent uppercase tracking-wide mb-1">Pro Yearly</p>
                <div className="text-4xl font-bold text-foreground">$99.99<span className="text-base font-normal text-muted-foreground"> USD/yr</span></div>
                <p className="text-sm text-accent font-semibold mt-1">Save 35% vs monthly</p>
              </div>
              <ul className="space-y-2.5 flex-1">
                {["Everything in Pro Monthly", "Exclusive workshops", "Early access to new features", "Priority support"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => launchApp("pricing_yearly")} className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white">
                Subscribe Yearly
              </Button>
            </div>

            {/* Lifetime — MOST POPULAR */}
            <div className="rounded-2xl border-2 border-primary bg-gradient-to-b from-primary/5 to-white p-6 flex flex-col gap-5 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  MOST POPULAR
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-1">Lifetime</p>
                <div className="text-4xl font-bold text-foreground">$249.99<span className="text-base font-normal text-muted-foreground"> USD</span></div>
                <p className="text-sm text-muted-foreground mt-1">Pay once, own forever</p>
              </div>
              <ul className="space-y-2.5 flex-1">
                {["Lifetime Pro access", "All future updates included", "Founder's badge", "Direct developer access"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => launchApp("pricing_lifetime")} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white">
                Get Lifetime Access
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Frequently asked questions</h2>
            <p className="text-muted-foreground">Everything you need to know before you start.</p>
          </div>
          <div className="space-y-3">
            {faqItems.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-5">
            Ready to take control of your health?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join YFIT free today. No credit card required. Upgrade to Pro when you're ready.
          </p>
          <Button
            onClick={() => launchApp("bottom_cta")}
            size="lg"
            className="text-lg px-12 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-xl shadow-primary/20"
          >
            Start Free Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">Free plan · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t border-primary/15 bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-5">
            <img src={`${CDN}/yfit-logo_e0bb531c.png`} alt="YFIT Logo" className="h-8 w-auto" />
            <p className="text-sm text-muted-foreground">© 2025 YFIT AI. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</a>
              <a href="mailto:support@yfitai.com" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
