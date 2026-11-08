"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Download,
  Play,
  Send,
  Heart,
  Check,
  Loader2,
  Trash2,
  MoreHorizontal,
  Mic2,
  Subtitles,
  Calendar,
  Eye,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PIPELINE_STEPS = [
  "Downloading video",
  "Transcribing audio",
  "Detecting peak moments",
  "Generating clips",
  "Post-processing",
  "Finalizing",
];

function ProcessingView({ project }: { project: any }) {
  const step = project.pipeline?.currentStep ?? 0;
  const progress = project.pipeline?.progress ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">
              {project.pipeline?.stepName ?? "Queued"}
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="space-y-3">
          {PIPELINE_STEPS.map((name, i) => {
            const isDone = i < step;
            const isCurrent = i === step;

            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isDone
                      ? "text-foreground"
                      : isCurrent
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {name}
                </span>
              </div>
            );
          })}
        </div>

        {project.pipeline?.error && (
          <div className="p-3 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive font-medium">Error</p>
            <p className="text-sm text-destructive/80 mt-1">
              {project.pipeline.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClipCard({ clip, projectId }: { clip: any; projectId: string }) {
  const [publishing, setPublishing] = useState(false);

  const handleDownload = async (platform?: string) => {
    const res = await fetch(
      `/api/clips/${clip._id}/download?platform=${platform ?? "universal"}`
    );
    const json = await res.json();
    if (json.data?.url) {
      window.open(json.data.url, "_blank");
    }
  };

  const handlePublish = async (platforms: string[]) => {
    setPublishing(true);
    await fetch(`/api/clips/${clip._id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platforms }),
    });
    setPublishing(false);
  };

  const handleToggleFavorite = async () => {
    await fetch(`/api/projects/${projectId}/clips/${clip._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !clip.isFavorite }),
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[9/16] bg-muted max-h-64">
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant="secondary" className="text-xs">
            {Math.round(clip.duration)}s
          </Badge>
        </div>
        {clip.voiceover?.enabled && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-2 text-xs"
          >
            <Mic2 className="h-3 w-3 mr-1" />
            Voiceover
          </Badge>
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        <h4 className="text-sm font-medium truncate">
          {clip.title ?? `Clip ${clip.sortOrder + 1}`}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {clip.description ?? "No description"}
        </p>

        {clip.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {clip.hashtags.slice(0, 3).map((tag: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {clip.publishHistory?.length > 0 && (
          <div className="flex gap-1">
            {clip.publishHistory.map((h: any, i: number) => (
              <Badge
                key={i}
                variant={h.status === "published" ? "default" : "secondary"}
                className="text-xs"
              >
                {h.platform}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 pt-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleToggleFavorite}
          >
            <Heart
              className={`h-4 w-4 ${
                clip.isFavorite ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleDownload()}
          >
            <Download className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors disabled:opacity-50" disabled={publishing}>
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handlePublish(["youtube"])}>
                Publish to YouTube
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePublish(["tiktok"])}>
                Publish to TikTok
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePublish(["instagram"])}>
                Publish to Instagram
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handlePublish(["youtube", "tiktok", "instagram"])
                }
              >
                Publish to All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors ml-auto">
                <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href={`/projects/${projectId}/clips/${clip._id}`} className="w-full">
                  Edit Clip
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href={`/schedule?clipId=${clip._id}&projectId=${projectId}`}
                  className="w-full"
                >
                  Schedule Post
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status &&
        !["completed", "failed", "pending"].includes(status)
      ) {
        return 3000;
      }
      return false;
    },
  });

  const { data: clipsData } = useQuery({
    queryKey: ["clips", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/clips`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
    enabled: project?.status === "completed",
  });

  const handleDelete = async () => {
    if (!confirm("Delete this project and all its clips?")) return;
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    router.push("/projects");
  };

  const handleRetry = async () => {
    await fetch(`/api/projects/${projectId}/process`, { method: "POST" });
  };

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-medium">Project not found</h2>
        <Button asChild className="mt-4">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const isProcessing = ![
    "pending",
    "completed",
    "failed",
  ].includes(project.status);

  const clips = clipsData?.clips ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/projects"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Projects
          </Link>
          <h1 className="text-2xl font-bold truncate">
            {project.videoMetadata?.title ?? "Untitled Project"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
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
            <span className="text-sm text-muted-foreground">
              {project.videoMetadata?.channelName}
            </span>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {project.status === "failed" && (
            <Button variant="outline" onClick={handleRetry}>
              Retry
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center size-8 rounded-lg border border-border bg-background hover:bg-muted transition-colors">
                <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isProcessing && <ProcessingView project={project} />}

      {project.status === "completed" && (
        <Tabs defaultValue="clips">
          <TabsList>
            <TabsTrigger value="clips">
              Clips ({clips.length})
            </TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="clips" className="mt-4">
            {clips.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-muted-foreground">
                    No clips generated yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {clips.map((clip: any) => (
                  <ClipCard
                    key={clip._id}
                    clip={clip}
                    projectId={projectId}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Video Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>
                      {Math.floor(
                        (project.videoMetadata?.duration ?? 0) / 60
                      )}
                      m{" "}
                      {(project.videoMetadata?.duration ?? 0) % 60}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Views</span>
                    <span>
                      {(
                        project.videoMetadata?.viewCount ?? 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Channel</span>
                    <span>{project.videoMetadata?.channelName}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing Config</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Clips</span>
                    <span>{project.config?.maxClips}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>
                      {project.config?.minClipDuration}-
                      {project.config?.maxClipDuration}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platforms</span>
                    <span>
                      {project.config?.targetPlatforms?.join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Voiceover</span>
                    <span>
                      {project.config?.voiceoverEnabled ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Captions</span>
                    <span>{project.config?.captionStyle}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {project.status === "pending" && (
        <Card>
          <CardContent className="flex flex-col items-center py-10">
            <p className="text-muted-foreground mb-4">
              Ready to process. Click below to start generating clips.
            </p>
            <Button onClick={handleRetry}>Start Processing</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
