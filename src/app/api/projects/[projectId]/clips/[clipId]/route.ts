import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Clip from "@/lib/db/models/clip.model";
import * as api from "@/lib/utils/api-response";

type Ctx = { params: Promise<{ projectId: string; clipId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { projectId, clipId } = await ctx.params;
  await connectDB();

  const clip = await Clip.findOne({
    _id: clipId,
    projectId,
    userId: session.user.id,
  }).lean();

  if (!clip) return api.notFound("Clip");
  return api.success(clip);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { projectId, clipId } = await ctx.params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return api.error("Invalid request body", 400);
  }

  const allowed = [
    "title",
    "description",
    "hashtags",
    "isApproved",
    "isFavorite",
    "sortOrder",
    "captions",
  ];
  const update: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  await connectDB();

  const clip = await Clip.findOneAndUpdate(
    { _id: clipId, projectId, userId: session.user.id },
    { $set: update },
    { new: true }
  );

  if (!clip) return api.notFound("Clip");
  return api.success(clip);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { projectId, clipId } = await ctx.params;
  await connectDB();

  const clip = await Clip.findOneAndDelete({
    _id: clipId,
    projectId,
    userId: session.user.id,
  });

  if (!clip) return api.notFound("Clip");
  return api.success({ deleted: true });
}
