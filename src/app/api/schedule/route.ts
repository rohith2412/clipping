import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Schedule from "@/lib/db/models/schedule.model";
import Clip from "@/lib/db/models/clip.model";
import PlatformConnection from "@/lib/db/models/platform-connection.model";
import * as api from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  await connectDB();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const query: Record<string, any> = { userId: session.user.id };
  if (status) query.status = status;
  if (from || to) {
    query.scheduledFor = {};
    if (from) query.scheduledFor.$gte = new Date(from);
    if (to) query.scheduledFor.$lte = new Date(to);
  }

  const schedules = await Schedule.find(query)
    .sort({ scheduledFor: 1 })
    .populate("clipId", "title duration renditions status")
    .lean();

  return api.success({ schedules });
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

  const { clipId, projectId, scheduledFor, timezone, platforms, platformConfig } = body;

  if (!clipId || !scheduledFor || !platforms?.length) {
    return api.error("clipId, scheduledFor, and platforms are required", 400);
  }

  const scheduledDate = new Date(scheduledFor);
  if (scheduledDate <= new Date()) {
    return api.error("Scheduled time must be in the future", 400);
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

  const schedule = await Schedule.create({
    userId: session.user.id,
    clipId,
    projectId: projectId ?? clip.projectId,
    scheduledFor: scheduledDate,
    timezone: timezone ?? "UTC",
    platforms,
    platformConfig: platformConfig ?? {},
    status: "scheduled",
    results: platforms.map((p: string) => ({ platform: p, status: "pending" })),
  });

  return api.success(schedule, 201);
}
