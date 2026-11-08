import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Project from "@/lib/db/models/project.model";
import Clip from "@/lib/db/models/clip.model";
import * as api from "@/lib/utils/api-response";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { projectId } = await ctx.params;
  await connectDB();

  const project = await Project.findOne({
    _id: projectId,
    userId: session.user.id,
  }).lean();

  if (!project) return api.notFound("Project");

  return api.success(project);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { projectId } = await ctx.params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return api.error("Invalid request body", 400);
  }

  await connectDB();

  const project = await Project.findOneAndUpdate(
    { _id: projectId, userId: session.user.id },
    { $set: body },
    { new: true }
  );

  if (!project) return api.notFound("Project");

  return api.success(project);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { projectId } = await ctx.params;
  await connectDB();

  const project = await Project.findOneAndDelete({
    _id: projectId,
    userId: session.user.id,
  });

  if (!project) return api.notFound("Project");

  await Clip.deleteMany({ projectId });

  return api.success({ deleted: true });
}
