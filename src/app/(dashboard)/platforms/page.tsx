"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlaySquare,
  Music2,
  Camera,
  Link2,
  Unlink,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";

const PLATFORM_INFO = {
  youtube: {
    name: "YouTube",
    description: "Upload to YouTube Shorts",
    icon: PlaySquare,
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  tiktok: {
    name: "TikTok",
    description: "Post to TikTok",
    icon: Music2,
    color: "text-foreground",
    bgColor: "bg-muted",
  },
  instagram: {
    name: "Instagram",
    description: "Publish to Instagram Reels",
    icon: Camera,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
  },
} as const;

export default function PlatformsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const justConnected = searchParams.get("connected");
  const error = searchParams.get("error");

  const { data, isLoading } = useQuery({
    queryKey: ["platform-connections"],
    queryFn: async () => {
      const res = await fetch("/api/platforms/connections");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const res = await fetch(`/api/platforms/connect/${platform}`);
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      }
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => {
      await fetch("/api/platforms/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-connections"] });
    },
  });

  const connections = data?.connections ?? [];
  const connectedPlatforms = connections.map((c: any) => c.platform);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Connections</h1>
        <p className="text-muted-foreground">
          Connect your social media accounts to publish clips
        </p>
      </div>

      {justConnected && (
        <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Successfully connected {justConnected}
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 rounded-lg">
          <span className="text-sm text-destructive">
            Connection failed: {error}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(PLATFORM_INFO) as Array<keyof typeof PLATFORM_INFO>).map(
          (platform) => {
            const info = PLATFORM_INFO[platform];
            const Icon = info.icon;
            const connection = connections.find(
              (c: any) => c.platform === platform
            );
            const isConnected = !!connection;

            return (
              <Card key={platform} className="relative overflow-hidden">
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <div
                    className={`w-14 h-14 rounded-full ${info.bgColor} flex items-center justify-center mb-4`}
                  >
                    <Icon className={`h-7 w-7 ${info.color}`} />
                  </div>

                  <h3 className="font-semibold text-lg">{info.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {info.description}
                  </p>

                  {isConnected ? (
                    <div className="mt-4 w-full space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                      {connection.platformUsername && (
                        <p className="text-xs text-muted-foreground">
                          @{connection.platformUsername}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          disconnectMutation.mutate(platform)
                        }
                        disabled={disconnectMutation.isPending}
                      >
                        <Unlink className="h-3 w-3 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="mt-4 w-full"
                      onClick={() => connectMutation.mutate(platform)}
                      disabled={connectMutation.isPending}
                    >
                      {connectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4 mr-2" />
                      )}
                      Connect
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          }
        )}
      </div>
    </div>
  );
}
