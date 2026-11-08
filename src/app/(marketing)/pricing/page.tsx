import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 49,
    description: "Perfect for individual creators",
    popular: false,
    features: {
      "Monthly clips": "100",
      "AI peak detection": true,
      "AI voiceover": true,
      "Burned-in captions": true,
      "YouTube Shorts": true,
      "TikTok": true,
      "Instagram Reels": true,
      "Post scheduling": true,
      "Clip editor": true,
      "Download clips": true,
      "Team collaboration": false,
      "Priority processing": false,
      "Advanced analytics": false,
      "Bulk scheduling": false,
      "Custom caption branding": false,
      "API access": false,
    },
  },
  {
    name: "Pro",
    price: 79,
    description: "For teams and power users",
    popular: true,
    features: {
      "Monthly clips": "Unlimited",
      "AI peak detection": true,
      "AI voiceover": true,
      "Burned-in captions": true,
      "YouTube Shorts": true,
      "TikTok": true,
      "Instagram Reels": true,
      "Post scheduling": true,
      "Clip editor": true,
      "Download clips": true,
      "Team collaboration": true,
      "Priority processing": true,
      "Advanced analytics": true,
      "Bulk scheduling": true,
      "Custom caption branding": true,
      "API access": true,
    },
  },
];

export default function PricingPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold">Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Simple plans. No free tier. No surprises.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid gap-8 sm:grid-cols-2 max-w-3xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-8 ${
                plan.popular
                  ? "border-2 border-primary bg-card"
                  : "border border-border bg-card"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <Button
                className="w-full mt-6"
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">
            Feature Comparison
          </h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-sm font-medium p-4">Feature</th>
                  <th className="text-center text-sm font-medium p-4">Starter</th>
                  <th className="text-center text-sm font-medium p-4">Pro</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(plans[0].features).map((feature) => (
                  <tr key={feature} className="border-b border-border last:border-0">
                    <td className="text-sm p-4">{feature}</td>
                    {plans.map((plan) => {
                      const value = plan.features[feature as keyof typeof plan.features];
                      return (
                        <td key={plan.name} className="text-center p-4">
                          {typeof value === "string" ? (
                            <span className="text-sm font-medium">{value}</span>
                          ) : value ? (
                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Pricing",
};
