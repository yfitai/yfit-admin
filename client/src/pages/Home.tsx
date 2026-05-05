import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Activity, Zap, Smartphone, BarChart3, Pill, Eye, Target, Dumbbell, Heart, TrendingUp, Apple, Calendar, Brain } from "lucide-react";
import { useTracking } from "@/hooks/useTracking";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Home() {
  const { track } = useTracking();
  const { t } = useTranslation();

  const scrollToPricing = () => {
    track("nav_click_pricing");
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToGoals = () => {
    track("nav_click_features");
    document.getElementById('goals')?.scrollIntoView({ behavior: 'smooth' });
  };

  const launchApp = (source: string) => {
    track(`cta_click_${source}`);
    window.location.href = "https://yfit-deploy.vercel.app";
  };

  // 8 Quick Action Cards - matching the actual YFIT app
  const quickActions = [
    { 
      icon: Target, 
      titleKey: "quickActionsSection.goals",
      descKey: "quickActionsSection.goalsDesc",
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-600"
    },
    { 
      icon: Apple, 
      titleKey: "quickActionsSection.nutrition",
      descKey: "quickActionsSection.nutritionDesc",
      color: "from-green-500 to-green-600",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-600"
    },
    { 
      icon: Dumbbell, 
      titleKey: "quickActionsSection.fitness",
      descKey: "quickActionsSection.fitnessDesc",
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-600"
    },
    { 
      icon: Calendar, 
      titleKey: "quickActionsSection.dailyTracker",
      descKey: "quickActionsSection.dailyTrackerDesc",
      color: "from-orange-500 to-orange-600",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-600"
    },
    { 
      icon: Pill, 
      titleKey: "quickActionsSection.medications",
      descKey: "quickActionsSection.medicationsDesc",
      color: "from-pink-500 to-pink-600",
      iconBg: "bg-pink-500/20",
      iconColor: "text-pink-600"
    },
    { 
      icon: BarChart3, 
      titleKey: "quickActionsSection.progress",
      descKey: "quickActionsSection.progressDesc",
      color: "from-teal-500 to-teal-600",
      iconBg: "bg-teal-500/20",
      iconColor: "text-teal-600"
    },
    { 
      icon: TrendingUp, 
      titleKey: "quickActionsSection.predictions",
      descKey: "quickActionsSection.predictionsDesc",
      color: "from-indigo-500 to-indigo-600",
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-600"
    },
    { 
      icon: Brain, 
      titleKey: "quickActionsSection.aiCoach",
      descKey: "quickActionsSection.aiCoachDesc",
      color: "from-violet-500 to-violet-600",
      iconBg: "bg-violet-500/20",
      iconColor: "text-violet-600"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Limited Time Offer Banner */}
      <div className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 text-center font-semibold text-sm md:text-base animate-pulse">
        🎉 {t('pricing.limitedOffer')} 🎉
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 glass-card border-b border-primary/20 bg-white/80">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663099417101/8TNedJULyoVCPDLa6UYde3/yfit-logo_e0bb531c.png" alt="YFIT Logo" className="h-10 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#goals"
              onClick={() => track("nav_click_quick_actions")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('nav.quickActions')}
            </a>
            <a
              href="#features"
              onClick={() => track("nav_click_features")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('nav.features')}
            </a>
            <a
              href="#unique"
              onClick={() => track("nav_click_unique")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('nav.whatMakesUsDifferent')}
            </a>
            <a
              href="#pricing"
              onClick={() => track("nav_click_pricing")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t('nav.pricing')}
            </a>
            <LanguageSwitcher />
            <Button
              onClick={() => launchApp("nav_launch_app")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg glow-effect"
            >
              {t('nav.launchApp')}
            </Button>
          </div>
          {/* Mobile: just language switcher + launch */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <Button
              onClick={() => launchApp("nav_launch_app_mobile")}
              size="sm"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
            >
              {t('nav.launchApp')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>{t('hero.badge')}</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-foreground">
                Your Body, <br />
                <span className="text-gradient">Reimagined.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                {t('hero.subheadline')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => launchApp("hero_start_journey")}
                  size="lg"
                  className="text-lg px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white glow-effect"
                >
                  {t('hero.cta')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  onClick={scrollToGoals}
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 border-primary/30 hover:bg-primary/5"
                >
                  {t('hero.exploreFeaturesBtn')}
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-background flex items-center justify-center text-xs font-semibold">
                      {i}K
                    </div>
                  ))}
                </div>
                <p>Join 10,000+ users transforming their lives</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-primary/20 to-accent/20 opacity-50 blur-3xl rounded-full" />
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663099417101/8TNedJULyoVCPDLa6UYde3/hero-dashboard_e4827135.png" 
                alt="YFIT Dashboard Interface" 
                className="relative rounded-2xl border border-primary/20 shadow-2xl glass-card transform hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8 Quick Action Cards */}
      <section id="goals" className="py-20 relative bg-gradient-to-b from-transparent to-primary/5">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">{t('quickActionsSection.title')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('quickActionsSection.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const title = t(action.titleKey);
              return (
                <Card
                  key={index}
                  onClick={() => track(`feature_card_click_${title.toLowerCase().replace(/\s+/g, '_')}`)}
                  className="glass-card border-primary/20 hover:border-primary/40 transition-all group cursor-pointer hover:shadow-xl hover:-translate-y-1 duration-300"
                >
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 rounded-2xl ${action.iconBg} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${action.iconColor}`} />
                    </div>
                    <CardTitle className="text-lg font-bold">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center leading-relaxed">
                      {t(action.descKey)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Unique Features Section - What Makes YFIT Different */}
      <section id="unique" className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block mb-4 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
              EXCLUSIVE FEATURES
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">{t('uniqueSection.title')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('uniqueSection.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Medication Tracking */}
            <Card
              onClick={() => track("feature_detail_click_medication")}
              className="glass-card border-accent/30 hover:border-accent/50 transition-all group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Pill className="w-8 h-8 text-pink-600" />
                </div>
                <CardTitle className="text-2xl">{t('uniqueSection.medicationTitle')}</CardTitle>
                <CardDescription className="text-base">{t('uniqueSection.medicationDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                    <span>{t('uniqueSection.medicationFeature1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                    <span>{t('uniqueSection.medicationFeature2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                    <span>{t('uniqueSection.medicationFeature3')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Form Analysis */}
            <Card
              onClick={() => track("feature_detail_click_form_analysis")}
              className="glass-card border-primary/30 hover:border-primary/50 transition-all group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Eye className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">{t('uniqueSection.formAnalysisTitle')}</CardTitle>
                <CardDescription className="text-base">{t('uniqueSection.formAnalysisDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('uniqueSection.formAnalysisFeature1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('uniqueSection.formAnalysisFeature2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('uniqueSection.formAnalysisFeature3')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 relative bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">{t('featuresSection.title')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('featuresSection.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>{t('featuresSection.aiNutritionTitle')}</CardTitle>
                <CardDescription>{t('featuresSection.aiNutritionDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary flex-shrink-0" />{t('featuresSection.aiNutritionFeature1')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary flex-shrink-0" />{t('featuresSection.aiNutritionFeature2')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary flex-shrink-0" />{t('featuresSection.aiNutritionFeature3')}</li>
                </ul>
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663099417101/8TNedJULyoVCPDLa6UYde3/nutrition-scan_df58381c.png" alt="Barcode Scanner" className="rounded-lg w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>{t('featuresSection.analyticsTitle')}</CardTitle>
                <CardDescription>{t('featuresSection.analyticsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent flex-shrink-0" />{t('featuresSection.analyticsFeature1')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent flex-shrink-0" />{t('featuresSection.analyticsFeature2')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent flex-shrink-0" />{t('featuresSection.analyticsFeature3')}</li>
                </ul>
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663099417101/8TNedJULyoVCPDLa6UYde3/workout-analytics_0b8e2b7f.png" alt="AI Coach" className="rounded-lg w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle>{t('featuresSection.progressTitle')}</CardTitle>
                <CardDescription>{t('featuresSection.progressDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 flex-shrink-0" />{t('featuresSection.progressFeature1')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 flex-shrink-0" />{t('featuresSection.progressFeature2')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 flex-shrink-0" />{t('featuresSection.progressFeature3')}</li>
                </ul>
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663099417101/8TNedJULyoVCPDLa6UYde3/hero-dashboard_e4827135.png" alt="Analytics" className="rounded-lg w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">{t('pricing.title')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Tier */}
            <Card className="glass-card border-primary/20 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{t('pricing.starterTitle')}</CardTitle>
                <div className="text-3xl font-bold mt-2 text-foreground">{t('pricing.starterPrice')}<span className="text-sm font-normal text-muted-foreground">{t('pricing.starterPeriod')}</span></div>
                <CardDescription>{t('pricing.starterDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {t('pricing.starterFeature1')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {t('pricing.starterFeature2')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {t('pricing.starterFeature3')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 5 Barcode Scans / month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 3 Form Analyses / month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 10 AI Coach queries / month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Predictions preview</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => launchApp("pricing_starter")}
                  className="w-full"
                  variant="outline"
                >
                  {t('pricing.starterCta')}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Monthly */}
            <Card className="glass-card border-primary/30 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl text-primary">{t('pricing.proMonthlyTitle')}</CardTitle>
                <div className="text-3xl font-bold mt-2 text-foreground">{t('pricing.proMonthlyPrice')}<span className="text-sm font-normal text-muted-foreground">{t('pricing.proMonthlyPeriod')}</span></div>
                <CardDescription>{t('pricing.proMonthlyDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Unlimited Barcode Scanner</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Medication Tracking</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {t('pricing.proMonthlyFeature2')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {t('pricing.proMonthlyFeature3')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Full AI Predictions</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => launchApp("pricing_pro_monthly")}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                >
                  {t('pricing.proMonthlyCta')}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Yearly - BEST VALUE */}
            <Card className="glass-card border-accent/50 relative flex flex-col transform scale-105 z-10 shadow-2xl">
              <div className="absolute -top-4 left-0 right-0 text-center">
                <span className="bg-gradient-to-r from-accent to-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">BEST VALUE</span>
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-accent">{t('pricing.proYearlyTitle')}</CardTitle>
                <div className="text-3xl font-bold mt-2 text-foreground">{t('pricing.proYearlyPrice')}<span className="text-sm font-normal text-muted-foreground">{t('pricing.proYearlyPeriod')}</span></div>
                <CardDescription>{t('pricing.proYearlyDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> {t('pricing.proYearlyFeature1')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> {t('pricing.proYearlyFeature2')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> {t('pricing.proYearlyFeature3')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> {t('pricing.proMonthlyFeature4')}</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => launchApp("pricing_pro_yearly")}
                  className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white"
                >
                  {t('pricing.proYearlyCta')}
                </Button>
              </CardFooter>
            </Card>

            {/* Lifetime - MOST POPULAR */}
            <Card className="glass-card border-primary/50 relative flex flex-col">
              <div className="absolute -top-4 left-0 right-0 text-center">
                <span className="bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">{t('pricing.proMonthlyBadge')}</span>
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-primary">{t('pricing.lifetimeTitle')}</CardTitle>
                <div className="text-3xl font-bold mt-2 text-foreground">{t('pricing.lifetimePrice')}<span className="text-sm font-normal text-muted-foreground">{t('pricing.lifetimePeriod')}</span></div>
                <CardDescription>{t('pricing.lifetimeDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {t('pricing.lifetimeFeature1')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {t('pricing.lifetimeFeature2')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {t('pricing.lifetimeFeature3')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> All Future Updates</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => launchApp("pricing_lifetime")}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                >
                  {t('pricing.lifetimeCta')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-primary/20 bg-gradient-to-b from-transparent to-primary/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663099417101/8TNedJULyoVCPDLa6UYde3/yfit-logo_e0bb531c.png" alt="YFIT Logo" className="h-8 w-auto" />
            </div>
            <div className="text-sm text-muted-foreground">
              {t('footer.copyright')}
            </div>
            <div className="flex gap-6">
              <a
                href="#"
                onClick={() => track("footer_click_privacy")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t('footer.privacy')}
              </a>
              <a
                href="#"
                onClick={() => track("footer_click_terms")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t('footer.terms')}
              </a>
              <a
                href="#"
                onClick={() => track("footer_click_contact")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t('footer.contact')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
