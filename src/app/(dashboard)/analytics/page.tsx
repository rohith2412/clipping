"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  ThumbsUp,
  MessageSquare,
  Share2,
  TrendingUp,
  Video,
  Calendar,
  BarChart3,
} from "lucide-react";

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?days=${days}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const overview = data?.overview ?? {};
  const engagement = data?.engagement ?? {};
  const topClips = data?.topClips ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your clip performance across platforms
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.totalProjects ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clips
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.totalClips ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.publishedClips ?? 0} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scheduled
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.scheduledPosts ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Upcoming posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(engagement.totalViews ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {days} days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Eye className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-lg font-bold">
                {(engagement.totalViews ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <ThumbsUp className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-lg font-bold">
                {(engagement.totalLikes ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-lg font-bold">
                {(engagement.totalComments ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Share2 className="h-5 w-5 text-orange-500" />
            <div>
              <div className="text-lg font-bold">
                {(engagement.totalShares ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Shares</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Clips</CardTitle>
        </CardHeader>
        <CardContent>
          {topClips.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No published clips with metrics yet. Publish some clips and
              check back later.
            </p>
          ) : (
            <div className="space-y-3">
              {topClips.map((clip: any, i: number) => (
                <div
                  key={clip._id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50"
                >
                  <span className="text-lg font-bold text-muted-foreground w-6 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {clip.title ?? "Untitled"}
                    </p>
                    <div className="flex gap-3 mt-1">
                      {clip.publishHistory?.map((h: any, j: number) => (
                        <Badge key={j} variant="outline" className="text-xs">
                          {h.platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold">
                      {(clip.totalViews ?? 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
