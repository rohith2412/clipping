"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Scissors,
  Loader2,
  PlaySquare,
  ArrowLeft,
  Sparkles,
  Mic2,
  Subtitles,
} from "lucide-react";
import Link from "next/link";

const PLATFORMS = [
  { id: "youtube", label: "YouTube Shorts", icon: "🎬" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "instagram", label: "Instagram Reels", icon: "📸" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"url" | "configure">("url");
  const [metadata, setMetadata] = useState<any>(null);
  const [projectId, setProjectId] = useState("");

  const [config, setConfig] = useState({
    maxClips: 15,
    minClipDuration: 15,
    maxClipDuration: 60,
    targetPlatforms: ["youtube"] as string[],
    voiceoverEnabled: false,
    captionStyle: "burned-in" as string,
  });

  const handleSubmitUrl = async () => {
    if (!url.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: url, config }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create project");
        return;
      }

      setProjectId(json.data._id);
      setMetadata(json.data.videoMetadata);
      setStep("configure");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcessing = async () => {
    setLoading(true);
    setError("");

    try {
      const patchRes = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      if (!patchRes.ok) {
        setError("Failed to update config");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/projects/${projectId}/process`, {
        method: "POST",
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to start processing");
        setLoading(false);
        return;
      }

      router.push(`/projects/${projectId}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const togglePlatform = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      targetPlatforms: prev.targetPlatforms.includes(id)
        ? prev.targetPlatforms.filter((p) => p !== id)
        : [...prev.targetPlatforms, id],
    }));
  };

  if (step === "url") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link
            href="/projects"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Link>
          <h1 className="text-2xl font-bold">New Project</h1>
          <p className="text-muted-foreground mt-1">
            Paste a YouTube video URL to get started
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <PlaySquare className="absolute left-3 top-3 h-5 w-5 text-red-500" />
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 h-12 text-base"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitUrl()}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                onClick={handleSubmitUrl}
                disabled={!url.trim() || loading}
                className="w-full h-11"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Scissors className="h-4 w-4 mr-2" />
                )}
                {loading ? "Fetching video info..." : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Supports YouTube videos up to 4 hours. Our AI will analyze the
            content and find the best moments to clip.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => setStep("url")}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Change URL
        </button>
        <h1 className="text-2xl font-bold">Configure Clips</h1>
        <p className="text-muted-foreground mt-1">
          Customize how your clips are generated
        </p>
      </div>

      {metadata && (
        <Card>
          <CardContent className="flex gap-4 pt-6">
            {metadata.thumbnailUrl && (
              <img
                src={metadata.thumbnailUrl}
                alt=""
                className="w-40 h-24 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-medium truncate">{metadata.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {metadata.channelName} &middot;{" "}
                {Math.floor((metadata.duration ?? 0) / 60)}m{" "}
                {(metadata.duration ?? 0) % 60}s
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Clip Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium">
              Number of Clips: {config.maxClips}
            </label>
            <Slider
              value={[config.maxClips]}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val;
                setConfig((p) => ({ ...p, maxClips: v }));
              }}
              min={5}
              max={30}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5</span>
              <span>30</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Min Duration</label>
              <Select
                value={String(config.minClipDuration)}
                onValueChange={(v: any) =>
                  setConfig((p) => ({
                    ...p,
                    minClipDuration: parseInt(v ?? "15"),
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="20">20 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Max Duration</label>
              <Select
                value={String(config.maxClipDuration)}
                onValueChange={(v: any) =>
                  setConfig((p) => ({
                    ...p,
                    maxClipDuration: parseInt(v ?? "60"),
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="45">45 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="90">90 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  config.targetPlatforms.includes(p.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-sm font-medium">{p.label}</span>
                {config.targetPlatforms.includes(p.id) && (
                  <Badge className="ml-auto" variant="default">
                    On
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enhancements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">AI Voiceover</p>
                <p className="text-xs text-muted-foreground">
                  Add AI-generated narration to clips
                </p>
              </div>
            </div>
            <Switch
              checked={config.voiceoverEnabled}
              onCheckedChange={(v) =>
                setConfig((p) => ({ ...p, voiceoverEnabled: v }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Subtitles className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Captions</p>
                <p className="text-xs text-muted-foreground">
                  Burned-in subtitles for accessibility
                </p>
              </div>
            </div>
            <Select
              value={config.captionStyle}
              onValueChange={(v: any) =>
                setConfig((p) => ({ ...p, captionStyle: v ?? "burned-in" }))
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="burned-in">Burned In</SelectItem>
                <SelectItem value="srt">SRT File</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button
        onClick={handleStartProcessing}
        disabled={loading || !config.targetPlatforms.length}
        className="w-full h-12 text-base"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-5 w-5 mr-2" />
        )}
        {loading ? "Starting..." : "Generate Clips"}
      </Button>
    </div>
  );
}
