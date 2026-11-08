"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Plus,
  Loader2,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const STATUS_MAP: Record<string, { icon: any; variant: any }> = {
  scheduled: { icon: Clock, variant: "secondary" },
  publishing: { icon: Loader2, variant: "secondary" },
  published: { icon: CheckCircle2, variant: "default" },
  partially_published: { icon: AlertCircle, variant: "secondary" },
  failed: { icon: XCircle, variant: "destructive" },
  canceled: { icon: XCircle, variant: "outline" },
};

function ScheduleForm({
  onSubmit,
  loading,
  defaultClipId,
  defaultProjectId,
}: {
  onSubmit: (data: any) => void;
  loading: boolean;
  defaultClipId?: string;
  defaultProjectId?: string;
}) {
  const [clipId, setClipId] = useState(defaultClipId ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["youtube"]);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = () => {
    if (!clipId || !date || !time || !platforms.length) return;
    onSubmit({
      clipId,
      projectId: defaultProjectId,
      scheduledFor: new Date(`${date}T${time}`).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platforms,
    });
  };

  return (
    <div className="space-y-4">
      {!defaultClipId && (
        <div>
          <label className="text-sm font-medium">Clip ID</label>
          <Input
            value={clipId}
            onChange={(e) => setClipId(e.target.value)}
            className="mt-1"
            placeholder="Paste clip ID"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Time</label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Platforms</label>
        <div className="flex gap-2 mt-1">
          {["youtube", "tiktok", "instagram"].map((p) => (
            <Button
              key={p}
              variant={platforms.includes(p) ? "default" : "outline"}
              size="sm"
              onClick={() => togglePlatform(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !clipId || !date || !time || !platforms.length}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Calendar className="h-4 w-4 mr-2" />
        )}
        Schedule Post
      </Button>
    </div>
  );
}

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const defaultClipId = searchParams.get("clipId") ?? undefined;
  const defaultProjectId = searchParams.get("projectId") ?? undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["schedules", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/schedule?${params}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setDialogOpen(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const res = await fetch(`/api/schedule/${scheduleId}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });

  const schedules = data?.schedules ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-muted-foreground">
            Manage your scheduled posts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center h-8 gap-1.5 px-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors">
              <Plus className="h-4 w-4" />
              Schedule Post
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule a Post</DialogTitle>
            </DialogHeader>
            <ScheduleForm
              onSubmit={(data) => createMutation.mutate(data)}
              loading={createMutation.isPending}
              defaultClipId={defaultClipId}
              defaultProjectId={defaultProjectId}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {["all", "scheduled", "published", "failed"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No scheduled posts</h3>
            <p className="text-muted-foreground mt-1 mb-6">
              Schedule your clips to be automatically posted at the best time
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule: any) => {
            const statusInfo =
              STATUS_MAP[schedule.status] ?? STATUS_MAP.scheduled;
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={schedule._id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-shrink-0">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {new Date(schedule.scheduledFor).getDate()}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {new Date(schedule.scheduledFor).toLocaleDateString(
                          undefined,
                          { month: "short" }
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {(schedule.clipId as any)?.title ?? "Untitled Clip"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(schedule.scheduledFor).toLocaleTimeString(
                          undefined,
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                      <div className="flex gap-1">
                        {schedule.platforms.map((p: string) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="text-xs"
                          >
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Badge variant={statusInfo.variant} className="flex-shrink-0">
                    <StatusIcon
                      className={`h-3 w-3 mr-1 ${
                        schedule.status === "publishing" ? "animate-spin" : ""
                      }`}
                    />
                    {schedule.status}
                  </Badge>

                  {schedule.status === "scheduled" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelMutation.mutate(schedule._id)}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
