"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, User } from "lucide-react";
import Link from "next/link";

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/user/preferences");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
  });

  const [name, setName] = useState("");
  const [captionStyle, setCaptionStyle] = useState("burned-in");
  const [timezone, setTimezone] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);

  if (userData && !name) {
    setName(userData.name ?? "");
    setCaptionStyle(userData.preferences?.captionStyle ?? "burned-in");
    setTimezone(
      userData.preferences?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone
    );
    setEmailNotifications(userData.preferences?.emailNotifications ?? true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          preferences: {
            captionStyle,
            timezone,
            emailNotifications,
          },
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Settings
        </Link>
        <h1 className="text-2xl font-bold">Account</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              value={session?.user?.email ?? ""}
              disabled
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed (linked to Google account)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Default Caption Style</label>
            <Select value={captionStyle} onValueChange={(v: any) => setCaptionStyle(v ?? "burned-in")}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="burned-in">Burned In</SelectItem>
                <SelectItem value="srt">SRT File</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Timezone</label>
            <Select value={timezone} onValueChange={(v: any) => setTimezone(v ?? "UTC")}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">
                  Pacific (PT)
                </SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">
                Processing complete, publish success/failure
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full"
      >
        {saveMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Changes
      </Button>
    </div>
  );
}
