"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Save,
  Loader2,
  Mic2,
  Subtitles,
  Download,
  Play,
} from "lucide-react";

export default function ClipEditorPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const clipId = params.clipId as string;

  const { data: clip, isLoading } = useQuery({
    queryKey: ["clip", clipId],
    queryFn: async () => {
      const res = await fetch(
        `/api/projects/${projectId}/clips/${clipId}`
      );
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
  });

  const { data: voicesData } = useQuery({
    queryKey: ["voices"],
    queryFn: async () => {
      const res = await fetch("/api/voiceover/voices");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
  });

  const [form, setForm] = useState<any>(null);

  if (clip && !form) {
    setForm({
      title: clip.title ?? "",
      description: clip.description ?? "",
      hashtags: (clip.hashtags ?? []).join(", "),
      captionStyle: clip.captions?.style ?? "burned-in",
      captionPosition: clip.captions?.position ?? "bottom",
      captionFontSize: clip.captions?.fontSize ?? 24,
      captionColor: clip.captions?.color ?? "#FFFFFF",
    });
  }

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(
        `/api/projects/${projectId}/clips/${clipId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            hashtags: data.hashtags
              .split(",")
              .map((h: string) => h.trim())
              .filter(Boolean),
            captions: {
              style: data.captionStyle,
              position: data.captionPosition,
              fontSize: data.captionFontSize,
              color: data.captionColor,
            },
          }),
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clip", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clips", projectId] });
    },
  });

  const voiceoverMutation = useMutation({
    mutationFn: async ({
      voiceId,
      script,
    }: {
      voiceId: string;
      script: string;
    }) => {
      const res = await fetch(`/api/clips/${clipId}/voiceover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, script }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clip", clipId] });
    },
  });

  const removeVoiceoverMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clips/${clipId}/voiceover`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clip", clipId] });
    },
  });

  const handleDownload = async (platform?: string) => {
    const res = await fetch(
      `/api/clips/${clipId}/download?platform=${platform ?? "universal"}`
    );
    const json = await res.json();
    if (json.data?.url) {
      window.open(json.data.url, "_blank");
    }
  };

  if (isLoading || !form) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!clip) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Clip not found</p>
        <Button asChild className="mt-4">
          <Link href={`/projects/${projectId}`}>Back to Project</Link>
        </Button>
      </div>
    );
  }

  const voices = voicesData?.voices ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Project
          </Link>
          <h1 className="text-2xl font-bold">Edit Clip</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleDownload()}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="mt-3 text-center">
                <Badge variant="secondary">
                  {clip.sourceStartTime.toFixed(1)}s -{" "}
                  {clip.sourceEndTime.toFixed(1)}s
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Duration: {Math.round(clip.duration)}s
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p: any) => ({ ...p, title: e.target.value }))
                  }
                  className="mt-1"
                  placeholder="Clip title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p: any) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  className="mt-1"
                  rows={3}
                  placeholder="Short description for social media"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Hashtags (comma-separated)
                </label>
                <Input
                  value={form.hashtags}
                  onChange={(e) =>
                    setForm((p: any) => ({
                      ...p,
                      hashtags: e.target.value,
                    }))
                  }
                  className="mt-1"
                  placeholder="viral, trending, clips"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Subtitles className="h-5 w-5" />
                Captions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Style</label>
                  <Select
                    value={form.captionStyle}
                    onValueChange={(v) =>
                      setForm((p: any) => ({ ...p, captionStyle: v }))
                    }
                  >
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
                  <label className="text-sm font-medium">Position</label>
                  <Select
                    value={form.captionPosition}
                    onValueChange={(v) =>
                      setForm((p: any) => ({
                        ...p,
                        captionPosition: v,
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Font Size: {form.captionFontSize}px
                </label>
                <Slider
                  value={[form.captionFontSize]}
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : val;
                    setForm((p: any) => ({
                      ...p,
                      captionFontSize: v,
                    }));
                  }}
                  min={14}
                  max={48}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic2 className="h-5 w-5" />
                Voiceover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clip.voiceover?.status === "ready" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="default">Voiceover Ready</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeVoiceoverMutation.mutate()}
                      disabled={removeVoiceoverMutation.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                  {clip.voiceover?.script && (
                    <p className="text-sm text-muted-foreground">
                      {clip.voiceover.script}
                    </p>
                  )}
                </div>
              ) : clip.voiceover?.status === "generating" ? (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating voiceover...</span>
                </div>
              ) : (
                <VoiceoverForm
                  voices={voices}
                  onGenerate={(voiceId, script) =>
                    voiceoverMutation.mutate({ voiceId, script })
                  }
                  loading={voiceoverMutation.isPending}
                />
              )}
            </CardContent>
          </Card>

          {clip.renditions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Downloads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {clip.renditions.map((r: any, i: number) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(r.platform)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {r.platform} ({r.width}x{r.height})
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function VoiceoverForm({
  voices,
  onGenerate,
  loading,
}: {
  voices: any[];
  onGenerate: (voiceId: string, script: string) => void;
  loading: boolean;
}) {
  const [voiceId, setVoiceId] = useState("");
  const [script, setScript] = useState("");

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Voice</label>
        <Select value={voiceId} onValueChange={(v: any) => setVoiceId(v ?? "")}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Choose a voice" />
          </SelectTrigger>
          <SelectContent>
            {voices.map((v: any) => (
              <SelectItem key={v.voice_id} value={v.voice_id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">
          Script (optional, AI generates if empty)
        </label>
        <Textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="mt-1"
          rows={3}
          placeholder="Leave empty for AI-generated script"
        />
      </div>
      <Button
        onClick={() => onGenerate(voiceId, script)}
        disabled={!voiceId || loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Mic2 className="h-4 w-4 mr-2" />
        )}
        Generate Voiceover
      </Button>
    </div>
  );
}
