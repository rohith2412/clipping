import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Clip from "@/lib/db/models/clip.model";
import PlatformConnection from "@/lib/db/models/platform-connection.model";
import { enqueuePublish } from "@/lib/queue/producers";
import * as api from "@/lib/utils/api-response";

type Ctx = { params: Promise<{ clipId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { clipId } = await ctx.params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return api.error("Invalid request body", 400);
  }

  const { platforms } = body;
  if (!platforms?.length) {
    return api.error("At least one platform is required", 400);
  }

  await connectDB();

  const clip = await Clip.findOne({
    _id: clipId,
    userId: session.user.id,
    status: "ready",
  });

  if (!clip) return api.notFound("Clip");

  const connections = await PlatformConnection.find({
    userId: session.user.id,
    platform: { $in: platforms },
    isActive: true,
  }).lean();

  const connectedPlatforms = connections.map((c) => c.platform);
  const missing = platforms.filter(
    (p: string) => !connectedPlatforms.includes(p as any)
  );

  if (missing.length) {
    return api.error(`Not connected to: ${missing.join(", ")}`, 400);
  }

  const job = await enqueuePublish(clipId, session.user.id, platforms);

  for (const platform of platforms) {
    clip.publishHistory.push({
      platform,
      status: "pending",
    } as any);
  }
  await clip.save();

  return api.success({ jobId: job.id, platforms }, 202);
}
