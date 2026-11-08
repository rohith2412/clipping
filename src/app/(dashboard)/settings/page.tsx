"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { User, CreditCard, Users, ChevronRight } from "lucide-react";

const settingsLinks = [
  {
    href: "/settings/account",
    title: "Account",
    description: "Your profile and preferences",
    icon: User,
  },
  {
    href: "/settings/billing",
    title: "Billing",
    description: "Subscription, usage, and invoices",
    icon: CreditCard,
  },
  {
    href: "/settings/team",
    title: "Team",
    description: "Team members and permissions",
    icon: Users,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-3">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <link.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
