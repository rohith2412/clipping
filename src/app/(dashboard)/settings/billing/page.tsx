"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, CreditCard, ExternalLink } from "lucide-react";
import { PLANS } from "@/lib/config/plans";

export default function BillingPage() {
  const { data: session } = useSession();
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: usage, isLoading } = useQuery({
    queryKey: ["billing-usage"],
    queryFn: async () => {
      const res = await fetch("/api/billing/usage");
      const json = await res.json();
      return json.data;
    },
  });

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } finally {
      setPortalLoading(false);
    }
  }

  async function changePlan(plan: "starter" | "pro") {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.data?.url) {
      window.location.href = data.data.url;
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const currentPlan = session?.user?.plan ?? "starter";
  const plan = PLANS[currentPlan];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and usage</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You&apos;re on the {plan.name} plan
              </CardDescription>
            </div>
            <Badge variant={session?.user?.planStatus === "active" ? "default" : "destructive"}>
              {session?.user?.planStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">${plan.price}</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {plan.features.slice(0, 6).map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={openPortal} disabled={portalLoading}>
              <CreditCard className="h-4 w-4 mr-2" />
              {portalLoading ? "Loading..." : "Manage Subscription"}
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
            {currentPlan === "starter" && (
              <Button onClick={() => changePlan("pro")}>
                Upgrade to Pro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Period</CardTitle>
          {usage?.periodStart && usage?.periodEnd && (
            <CardDescription>
              {new Date(usage.periodStart).toLocaleDateString()} —{" "}
              {new Date(usage.periodEnd).toLocaleDateString()}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Clips Generated</span>
              <span className="text-muted-foreground">
                {usage?.current ?? 0} / {usage?.limit ?? "Unlimited"}
              </span>
            </div>
            {usage?.limit && (
              <Progress
                value={Math.min(((usage?.current ?? 0) / usage.limit) * 100, 100)}
                className="h-2"
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Videos Processed</span>
              <span className="font-medium">{usage?.videosProcessed ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Voiceovers Generated</span>
              <span className="font-medium">{usage?.voiceovers ?? 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
