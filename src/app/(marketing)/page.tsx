import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Scissors,
  Zap,
  Mic,
  Calendar,
  BarChart3,
  PlaySquare,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI Peak Detection",
    description:
      "Our AI analyzes your video's transcript and audio to find the most engaging, viral-worthy moments automatically.",
  },
  {
    icon: Scissors,
    title: "Auto-Generate Clips",
    description:
      "Turn one long-form video into 10-20 perfectly timed short-form clips, optimized for each platform's format.",
  },
  {
    icon: Mic,
    title: "AI Voiceover",
    description:
      "Add professional AI-generated voiceover to your clips. Choose from multiple voices and styles.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Schedule your clips across YouTube Shorts, TikTok, and Instagram Reels from one calendar.",
  },
  {
    icon: BarChart3,
    title: "Cross-Platform Analytics",
    description:
      "Track views, engagement, and performance across all platforms in one unified dashboard.",
  },
  {
    icon: Sparkles,
    title: "Auto Captions & Hashtags",
    description:
      "AI generates burned-in captions, engaging titles, and trending hashtags for maximum reach.",
  },
];

const steps = [
  {
    step: "01",
    title: "Paste a YouTube Link",
    description: "Drop any YouTube video URL and we'll handle the rest.",
  },
  {
    step: "02",
    title: "AI Finds the Best Moments",
    description:
      "Our AI analyzes the transcript and audio to identify peak engagement moments.",
  },
  {
    step: "03",
    title: "Review & Customize",
    description:
      "Edit clips, add voiceover, customize captions, and tweak everything to your liking.",
  },
  {
    step: "04",
    title: "Schedule & Publish",
    description:
      "Post directly to YouTube Shorts, TikTok, and Instagram Reels on your schedule.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-4">
            AI-Powered Video Clipping Platform
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
            Turn long videos into{" "}
            <span className="text-primary">viral short-form clips</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Paste a YouTube link. AI detects the peak moments, generates clips
            with voiceover and captions, and schedules them across YouTube
            Shorts, TikTok, and Instagram.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base"
              asChild
            >
              <Link href="/how-it-works">See How It Works</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Plans start at $49/mo. No free tier — no limits on quality.
          </p>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Auto-post to all major platforms
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="flex items-center gap-2 text-muted-foreground">
              <PlaySquare className="h-6 w-6" />
              <span className="font-medium">YouTube Shorts</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 1 0 6.34 6.34V9.19a8.16 8.16 0 0 0 4.77 1.52V7.26a4.84 4.84 0 0 1-1.01-.57z" />
              </svg>
              <span className="font-medium">TikTok</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
              </svg>
              <span className="font-medium">Instagram Reels</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything you need to go viral
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From AI analysis to multi-platform publishing — one tool to rule
              your short-form content.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="relative p-6 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Four simple steps from YouTube video to viral clips
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground text-lg font-bold mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 sm:py-28" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No free tier. No hidden fees. Just powerful tools at a fair price.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 max-w-3xl mx-auto">
            {/* Starter */}
            <div className="relative rounded-xl border border-border bg-card p-8">
              <h3 className="text-xl font-bold">Starter</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Perfect for individual creators
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "100 clips per month",
                  "AI peak moment detection",
                  "AI voiceover generation",
                  "Burned-in captions",
                  "YouTube, TikTok, Instagram",
                  "Post scheduling",
                  "Clip editor",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-8" variant="outline" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>

            {/* Pro */}
            <div className="relative rounded-xl border-2 border-primary bg-card p-8">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
              <h3 className="text-xl font-bold">Pro</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">$79</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                For teams and power users
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Unlimited clips",
                  "Everything in Starter",
                  "Team collaboration (5 members)",
                  "Priority processing",
                  "Advanced analytics",
                  "Bulk scheduling",
                  "Custom caption branding",
                  "API access",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-8" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to start clipping?
          </h2>
          <p className="mt-4 text-lg opacity-90 max-w-xl mx-auto">
            Join creators who are turning their long-form content into a
            short-form content machine.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 h-12 px-8 text-base"
            asChild
          >
            <Link href="/signup">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
