"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Scissors,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; variant: any; icon: any }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  downloading: { label: "Downloading", variant: "secondary", icon: Loader2 },
  transcribing: { label: "Transcribing", variant: "secondary", icon: Loader2 },
  analyzing: { label: "Analyzing", variant: "secondary", icon: Loader2 },
  clipping: { label: "Generating Clips", variant: "secondary", icon: Scissors },
  processing: { label: "Processing", variant: "secondary", icon: Loader2 },
  finalizing: { label: "Finalizing", variant: "secondary", icon: Loader2 },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive", icon: XCircle },
};

export default function ProjectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects?limit=50");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const projects = data?.projects ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-muted-foreground mt-1 mb-6 max-w-md">
              Create your first project by pasting a YouTube video URL. Our
              AI will find the best moments and generate clips.
            </p>
            <Button asChild size="lg">
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                Create First Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => {
            const statusInfo = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <Link key={project._id} href={`/projects/${project._id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="relative aspect-video bg-muted">
                    {project.videoMetadata?.thumbnailUrl ? (
                      <img
                        src={project.videoMetadata.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      variant={statusInfo.variant}
                      className="absolute top-2 right-2"
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate">
                      {project.videoMetadata?.title ?? "Untitled"}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span>
                        {Math.floor(
                          (project.videoMetadata?.duration ?? 0) / 60
                        )}
                        m
                      </span>
                      {project.clipCount > 0 && (
                        <span>{project.clipCount} clips</span>
                      )}
                      <span>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
