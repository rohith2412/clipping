"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import { PLANS } from "@/lib/config/plans";

type PlanId = "starter" | "pro";

export default function OnboardingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("starter");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, update } = useSession();

  if (session?.user?.role === "admin" || session?.user?.planStatus === "active") {
    router.replace("/dashboard");
    return null;
  }

  async function handleSelectPlan() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Choose your plan</h1>
        <p className="text-muted-foreground mt-1">
          Select a plan to start creating clips
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(
          ([id, plan]) => (
            <Card
              key={id}
              className={`cursor-pointer transition-all ${
                selectedPlan === id
                  ? "ring-2 ring-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedPlan(id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {id === "pro" && <Badge>Popular</Badge>}
                </div>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        )}
      </div>

      <Button
        className="w-full h-11"
        onClick={handleSelectPlan}
        disabled={loading}
      >
        {loading ? "Redirecting to checkout..." : (
          <>
            Continue with {PLANS[selectedPlan].name} — ${PLANS[selectedPlan].price}/mo
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
