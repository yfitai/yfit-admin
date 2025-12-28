import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Activity, Zap, Smartphone, BarChart3, Pill, Eye, Target, Dumbbell, Heart, TrendingUp, Apple, Calendar, Brain } from "lucide-react";

export default function Home() {
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToGoals = () => {
    document.getElementById('goals')?.scrollIntoView({ behavior: 'smooth' });
  };

  const launchApp = () => {
    window.location.href = "https://yfit-deploy.vercel.app";
  };

  // 8 Quick Action Cards - matching the actual YFIT app
  const quickActions = [
    { 
      icon: Target, 
      title: "Goals", 
      description: "Set and track personalized fitness goals tailored to your unique journey",
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-600"
    },
    { 
      icon: Apple, 
      title: "Nutrition", 
      description: "Scan barcodes, log meals, and track macros with AI-powered nutrition insights",
      color: "from-green-500 to-green-600",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-600"
    },
    { 
      icon: Dumbbell, 
      title: "Fitness", 
      description: "Access personalized workout plans with real-time form analysis and coaching",
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-600"
    },
    { 
      icon: Calendar, 
      title: "Daily Tracker", 
      description: "Log your daily activities, meals, workouts, and medications in one place",
      color: "from-orange-500 to-orange-600",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-600"
    },
    { 
      icon: Pill, 
      title: "Medications", 
      description: "Track prescriptions, supplements, and generate provider reports for doctor visits",
      color: "from-pink-500 to-pink-600",
      iconBg: "bg-pink-500/20",
      iconColor: "text-pink-600"
    },
    { 
      icon: BarChart3, 
      title: "Progress", 
      description: "Visualize your transformation with detailed analytics and progress photos",
      color: "from-teal-500 to-teal-600",
      iconBg: "bg-teal-500/20",
      iconColor: "text-teal-600"
    },
    { 
      icon: TrendingUp, 
      title: "Predictions", 
      description: "AI-powered forecasts for your weight, strength, and fitness milestones",
      color: "from-indigo-500 to-indigo-600",
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-600"
    },
    { 
      icon: Brain, 
      title: "AI Coach", 
      description: "Your 24/7 intelligent fitness companion providing personalized guidance",
      color: "from-violet-500 to-violet-600",
      iconBg: "bg-violet-500/20",
      iconColor: "text-violet-600"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Limited Time Offer Banner */}
      <div className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 text-center font-semibold text-sm md:text-base animate-pulse">
        🎉 LIMITED TIME OFFER: Get 1 Month FREE on All Pro Plans! 🎉
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 glass-card border-b border-primary/20 bg-white/80">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/yfit-logo.png" alt="YFIT Logo" className="h-10 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#goals" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Quick Actions</a>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#unique" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">What Makes Us Different</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <Button onClick={launchApp} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg glow-effect">
              Launch App
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
                <span>AI-Powered Personalized Fitness</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-foreground">
                Your Body, <br />
                <span className="text-gradient">Reimagined.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Experience truly personalized fitness with YFIT. Advanced AI coaching, barcode nutrition scanning, medication tracking with provider reports, and real-time form analysis—all tailored to your unique goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={launchApp} size="lg" className="text-lg px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white glow-effect">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button onClick={scrollToGoals} size="lg" variant="outline" className="text-lg px-8 border-primary/30 hover:bg-primary/5">
                  Explore Features
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
                src="/images/hero-dashboard.png" 
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
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">Quick Actions</h2>
            <p className="text-lg text-muted-foreground">
              Get started with your health journey. YFIT provides 8 powerful tools to help you achieve your fitness goals with personalized AI guidance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className="glass-card border-primary/20 hover:border-primary/40 transition-all group cursor-pointer hover:shadow-xl hover:-translate-y-1 duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 rounded-2xl ${action.iconBg} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${action.iconColor}`} />
                    </div>
                    <CardTitle className="text-lg font-bold">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center leading-relaxed">
                      {action.description}
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
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-bold">
              EXCLUSIVE FEATURES
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">What Makes YFIT Different</h2>
            <p className="text-lg text-muted-foreground">
              While other apps focus on basic tracking, YFIT offers features you won't find anywhere else.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Medication Tracking */}
            <Card className="glass-card border-accent/30 hover:border-accent/50 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Pill className="w-8 h-8 text-pink-600" />
                </div>
                <CardTitle className="text-2xl">Medication Tracking</CardTitle>
                <CardDescription className="text-base">Integrated health management with provider reports</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  YFIT is the <strong className="text-foreground">only fitness app</strong> that seamlessly integrates medication tracking with your fitness routine. Track prescriptions, supplements, and vitamins alongside your workouts and nutrition.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                    <span>Smart reminders for medication schedules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                    <span>Track interactions between supplements and workouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                    <span>Generate provider reports for doctor visits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                    <span>Holistic view of your health journey</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Form Analysis */}
            <Card className="glass-card border-primary/30 hover:border-primary/50 transition-all group relative overflow-hidden">
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
      <section id="features" className="py-20 relative bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">Complete Fitness Ecosystem</h2>
            <p className="text-lg text-muted-foreground">
              Powered by cutting-edge AI to deliver the most personalized fitness experience ever created.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Barcode Scanner</CardTitle>
                <CardDescription>Instant nutrition tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Simply scan any food barcode with your camera. Our database instantly logs nutritional information and calculates your daily macros.
                </p>
                <img src="/images/nutrition-scan.png" alt="Barcode Scanner" className="rounded-lg w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Smart AI Coaching</CardTitle>
                <CardDescription>Personalized guidance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Your personal AI coach adapts to your progress, providing tailored workout plans, nutrition advice, and motivation when you need it most.
                </p>
                <img src="/images/workout-analytics.png" alt="AI Coach" className="rounded-lg w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle>Deep Analytics</CardTitle>
                <CardDescription>Data-driven progress tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Visualize your progress with professional-grade analytics. Track muscle recovery, sleep quality, strength trends, and more.
                </p>
                <img src="/images/hero-dashboard.png" alt="Analytics" className="rounded-lg w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">Choose Your Power</h2>
            <p className="text-lg text-muted-foreground">
              Unlock your full potential with our flexible pricing plans. No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Tier */}
            <Card className="glass-card border-primary/20 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">Starter</CardTitle>
                <div className="text-3xl font-bold mt-2 text-foreground">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
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
            <Card className="glass-card border-primary/30 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Pro Monthly</CardTitle>
                <div className="text-3xl font-bold mt-2 text-foreground">$12.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <CardDescription>Full AI access + 1 month FREE</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Barcode Scanner</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Medication Tracking</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Form Analysis</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Unlimited AI Coaching</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Advanced Analytics</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={launchApp} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white">Start Free Trial</Button>
              </CardFooter>
            </Card>

            {/* Pro Yearly - BEST VALUE */}
            <Card className="glass-card border-accent/50 relative flex flex-col transform scale-105 z-10 shadow-2xl">
              <div className="absolute -top-4 left-0 right-0 text-center">
                <span className="bg-gradient-to-r from-accent to-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">BEST VALUE</span>
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-accent">Pro Yearly</CardTitle>
                <div className="text-3xl font-bold mt-2 text-foreground">$99.99<span className="text-sm font-normal text-muted-foreground">/yr</span></div>
                <CardDescription>Save 35% + 1 month FREE</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> All Pro Features</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Exclusive Workshops</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Early Access Features</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Priority Support</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={launchApp} className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white">Subscribe Yearly</Button>
              </CardFooter>
            </Card>

            {/* Lifetime - MOST POPULAR */}
            <Card className="glass-card border-primary/50 relative flex flex-col">
              <div className="absolute -top-4 left-0 right-0 text-center">
                <span className="bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">MOST POPULAR</span>
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-primary">Lifetime</CardTitle>
                <div className="text-3xl font-bold mt-2 text-foreground">$249.99<span className="text-sm font-normal text-muted-foreground">/once</span></div>
                <CardDescription>Pay once, own forever</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Lifetime Pro Access</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Founder's Badge</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Direct Dev Access</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> All Future Updates</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={launchApp} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white">Get Lifetime</Button>
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
              <img src="/images/yfit-logo.png" alt="YFIT Logo" className="h-8 w-auto" />
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 YFIT AI. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
