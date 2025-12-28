import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Activity, Zap, Smartphone, BarChart3, Pill, Eye } from "lucide-react";

export default function Home() {
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const launchApp = () => {
    window.location.href = "https://yfit-deploy.vercel.app";
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-white/10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">YFIT</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#unique" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">What Makes Us Different</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <Button onClick={launchApp} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
              Launch App
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>AI-Powered Fitness Revolution</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Your Body, <br />
                <span className="text-gradient">Reimagined.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Experience the future of fitness with YFIT. Advanced AI coaching, real-time nutrition scanning, medication tracking, and hyper-personalized workout plans with form analysis.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={launchApp} size="lg" className="text-lg px-8 bg-primary hover:bg-primary/90 neon-glow">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button onClick={scrollToPricing} size="lg" variant="outline" className="text-lg px-8 border-white/20 hover:bg-white/5">
                  View Plans
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/10 border border-background flex items-center justify-center text-xs">
                      User
                    </div>
                  ))}
                </div>
                <p>Join 10,000+ users transforming their lives</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary to-accent opacity-30 blur-3xl rounded-full animate-pulse" />
              <img 
                src="/images/hero-dashboard.png" 
                alt="YFIT Dashboard Interface" 
                className="relative rounded-2xl border border-white/10 shadow-2xl glass-card transform hover:scale-[1.02] transition-transform duration-500"
              />
              <img 
                src="/images/ai-coach-avatar.png" 
                alt="AI Coach" 
                className="absolute -bottom-12 -left-12 w-48 h-48 rounded-2xl border border-white/10 shadow-xl glass-card hidden lg:block animate-bounce"
                style={{ animationDuration: '3s' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Unique Features Section - What Makes YFIT Different */}
      <section id="unique" className="py-24 relative bg-gradient-to-b from-transparent to-black/20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-bold">
              EXCLUSIVE FEATURES
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">What Makes YFIT Different</h2>
            <p className="text-lg text-muted-foreground">
              While other apps focus on basic tracking, YFIT offers features you won't find anywhere else.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Medication Tracking */}
            <Card className="glass-card border-accent/30 hover:border-accent/60 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 rounded-xl bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Pill className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-2xl">Medication Tracking</CardTitle>
                <CardDescription className="text-base">Integrated health management</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  YFIT is the <strong className="text-foreground">only fitness app</strong> that seamlessly integrates medication tracking with your fitness routine. Track prescriptions, supplements, and vitamins alongside your workouts and nutrition.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Smart reminders for medication schedules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Track interactions between supplements and workouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Holistic view of your health journey</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Form Analysis */}
            <Card className="glass-card border-primary/30 hover:border-primary/60 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Eye className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Real-Time Form Analysis</CardTitle>
                <CardDescription className="text-base">AI-powered injury prevention</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Our advanced AI analyzes your workout form in real-time using your device camera. Get instant feedback to <strong className="text-foreground">prevent injuries</strong> and maximize results—a feature most apps don't offer.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Live posture correction during exercises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Audio cues for immediate adjustments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Detailed form reports after each workout</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Complete Fitness Ecosystem</h2>
            <p className="text-lg text-muted-foreground">
              Powered by cutting-edge AI to deliver the most personalized fitness experience ever created.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card border-white/10 hover:border-primary/50 transition-colors group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>AI Nutrition Scanner</CardTitle>
                <CardDescription>Instant macro tracking with AR</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Simply point your camera at any meal. Our AI identifies ingredients and calculates macros instantly with 98% accuracy.
                </p>
                <img src="/images/nutrition-scan.png" alt="Nutrition Scanner" className="rounded-lg w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10 hover:border-primary/50 transition-colors group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Smart Coaching</CardTitle>
                <CardDescription>Personalized AI guidance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Your personal AI coach adapts to your progress, providing tailored workout plans and motivation when you need it most.
                </p>
                <img src="/images/ai-coach-avatar.png" alt="AI Coach" className="rounded-lg w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10 hover:border-primary/50 transition-colors group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle>Deep Analytics</CardTitle>
                <CardDescription>Data-driven progress tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Visualize your progress with professional-grade analytics. Track muscle recovery, sleep quality, and strength trends.
                </p>
                <img src="/images/workout-analytics.png" alt="Analytics" className="rounded-lg w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative bg-black/20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block mb-4 px-4 py-1 rounded-full bg-accent/20 text-accent text-sm font-bold animate-pulse">
              LIMITED TIME OFFER: FIRST MONTH FREE
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Choose Your Power</h2>
            <p className="text-lg text-muted-foreground">
              Unlock your full potential with our flexible pricing plans. No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Tier */}
            <Card className="glass-card border-white/10 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">Starter</CardTitle>
                <div className="text-3xl font-bold mt-2">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <CardDescription>Essential tracking tools</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Basic Workout Tracking</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Manual Meal Logging</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 3 Saved Routines</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={launchApp} className="w-full" variant="outline">Get Started</Button>
              </CardFooter>
            </Card>

            {/* Pro Monthly */}
            <Card className="glass-card border-primary/50 relative flex flex-col transform scale-105 z-10 shadow-2xl shadow-primary/10">
              <div className="absolute -top-4 left-0 right-0 text-center">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-primary">Pro Monthly</CardTitle>
                <div className="text-3xl font-bold mt-2">$12.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <CardDescription>Full AI access</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> AI Nutrition Scanner</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Medication Tracking</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Form Analysis</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Unlimited AI Coaching</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Advanced Analytics</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={launchApp} className="w-full bg-primary hover:bg-primary/90">Start Free Trial</Button>
              </CardFooter>
            </Card>

            {/* Pro Yearly */}
            <Card className="glass-card border-white/10 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">Pro Yearly</CardTitle>
                <div className="text-3xl font-bold mt-2">$99.99<span className="text-sm font-normal text-muted-foreground">/yr</span></div>
                <CardDescription>Save 35% annually</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> All Pro Features</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Exclusive Workshops</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Early Access Features</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={launchApp} className="w-full" variant="outline">Subscribe Yearly</Button>
              </CardFooter>
            </Card>

            {/* Lifetime */}
            <Card className="glass-card border-accent/50 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl text-accent">Lifetime</CardTitle>
                <div className="text-3xl font-bold mt-2">$249.99<span className="text-sm font-normal text-muted-foreground">/once</span></div>
                <CardDescription>Pay once, own forever</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Lifetime Pro Access</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Founder's Badge</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Direct Dev Access</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={launchApp} className="w-full bg-accent hover:bg-accent/90 text-white">Get Lifetime</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-black/40">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-heading font-bold">YFIT</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 YFIT AI. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
