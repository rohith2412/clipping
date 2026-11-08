import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Project from "@/lib/db/models/project.model";
import { fetchVideoMetadata, isValidYouTubeUrl } from "@/lib/video/metadata-fetcher";
import * as api from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status");

  const query: Record<string, any> = { userId: session.user.id };
  if (status) query.status = status;

  const [projects, total] = await Promise.all([
    Project.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-transcript -peakMoments")
      .lean(),
    Project.countDocuments(query),
  ]);

  return api.success({
    projects,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return api.error("Invalid request body", 400);
  }

  const { sourceUrl, config } = body;

  if (!sourceUrl || !isValidYouTubeUrl(sourceUrl)) {
    return api.error("Invalid YouTube URL", 400);
  }

  await connectDB();

  let videoMetadata;
  try {
    videoMetadata = await fetchVideoMetadata(sourceUrl);
  } catch {
    videoMetadata = {
      title: "Untitled Video",
      description: "",
      channelName: "",
      channelId: "",
      thumbnailUrl: "",
      duration: 0,
      publishedAt: "",
      viewCount: 0,
      tags: [],
    };
  }

  const project = await Project.create({
    userId: session.user.id,
    teamId: session.user.teamId,
    sourceUrl,
    sourceProvider: "youtube",
    videoMetadata,
    status: "pending",
    config: {
      maxClips: config?.maxClips ?? 15,
      minClipDuration: config?.minClipDuration ?? 15,
      maxClipDuration: config?.maxClipDuration ?? 60,
      targetPlatforms: config?.targetPlatforms ?? ["youtube"],
      voiceoverEnabled: config?.voiceoverEnabled ?? false,
      voiceId: config?.voiceId,
      captionStyle: config?.captionStyle ?? "burned-in",
    },
    pipeline: {
      currentStep: 0,
      totalSteps: 6,
      progress: 0,
    },
  });

  return api.success(project, 201);
}
