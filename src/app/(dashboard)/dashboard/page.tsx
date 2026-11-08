"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Scissors,
  Video,
  Calendar,
  Eye,
  Plus,
  ArrowRight,
} from "lucide-react";

function StatsCards({ stats }: { stats: any }) {
  const cards = [
    {
      title: "Clips Generated",
      value: stats?.clipsGenerated ?? 0,
      icon: Scissors,
      description: "This month",
    },
    {
      title: "Videos Processed",
      value: stats?.videosProcessed ?? 0,
      icon: Video,
      description: "This month",
    },
    {
      title: "Scheduled Posts",
      value: stats?.scheduledPosts ?? 0,
      icon: Calendar,
      description: "Upcoming",
    },
    {
      title: "Total Views",
      value: stats?.totalViews ?? 0,
      icon: Eye,
      description: "All time",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UsageMeter({ usage }: { usage: any }) {
  if (!usage) return null;
  const percentage = usage.limit === Infinity
    ? 0
    : Math.min((usage.current / usage.limit) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{usage.current} clips used</span>
          <span className="text-muted-foreground">
            {usage.limit === Infinity ? "Unlimited" : `${usage.limit} limit`}
          </span>
        </div>
        {usage.limit !== Infinity && (
          <Progress value={percentage} className="h-2" />
        )}
      </CardContent>
    </Card>
  );
}

function RecentProjects({ projects }: { projects: any[] }) {
  if (!projects?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Video className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-medium">No projects yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Paste a YouTube URL to create your first project
          </p>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Projects</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {projects.map((project: any) => (
            <Link
              key={project._id}
              href={`/projects/${project._id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {project.videoMetadata?.thumbnailUrl ? (
                <img
                  src={project.videoMetadata.thumbnailUrl}
                  alt=""
                  className="w-16 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                  <Video className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {project.videoMetadata?.title ?? "Untitled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {project.clipCount} clips
                </p>
              </div>
              <Badge
                variant={
                  project.status === "completed"
                    ? "default"
                    : project.status === "failed"
                    ? "destructive"
                    : "secondary"
                }
              >
                {project.status}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/overview");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {session?.user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your clips
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      <StatsCards stats={data?.stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentProjects projects={data?.recentProjects ?? []} />
        </div>
        <div>
          <UsageMeter
            usage={
              data?.usage ?? {
                current: 0,
                limit: session?.user?.plan === "pro" ? Infinity : 100,
              }
            }
          />
        </div>
      </div>
    </div>
  );
}
