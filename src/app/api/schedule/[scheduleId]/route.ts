import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Schedule from "@/lib/db/models/schedule.model";
import * as api from "@/lib/utils/api-response";

type Ctx = { params: Promise<{ scheduleId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { scheduleId } = await ctx.params;
  await connectDB();

  const schedule = await Schedule.findOne({
    _id: scheduleId,
    userId: session.user.id,
  })
    .populate("clipId", "title duration renditions")
    .lean();

  if (!schedule) return api.notFound("Schedule");
  return api.success(schedule);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { scheduleId } = await ctx.params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return api.error("Invalid request body", 400);
  }

  await connectDB();

  const schedule = await Schedule.findOne({
    _id: scheduleId,
    userId: session.user.id,
  });

  if (!schedule) return api.notFound("Schedule");

  if (!["scheduled"].includes(schedule.status)) {
    return api.error("Can only modify scheduled posts", 400);
  }

  const allowed = ["scheduledFor", "timezone", "platforms", "platformConfig"];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      (schedule as any)[key] = body[key];
    }
  }

  if (body.scheduledFor) {
    const d = new Date(body.scheduledFor);
    if (d <= new Date()) {
      return api.error("Scheduled time must be in the future", 400);
    }
    schedule.scheduledFor = d;
  }

  await schedule.save();
  return api.success(schedule);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { scheduleId } = await ctx.params;
  await connectDB();

  const schedule = await Schedule.findOne({
    _id: scheduleId,
    userId: session.user.id,
  });

  if (!schedule) return api.notFound("Schedule");

  if (!["scheduled", "failed"].includes(schedule.status)) {
    return api.error("Cannot cancel a post that is already publishing", 400);
  }

  schedule.status = "canceled";
  await schedule.save();

  return api.success({ canceled: true });
}
