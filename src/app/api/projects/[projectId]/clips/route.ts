import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Clip from "@/lib/db/models/clip.model";
import Project from "@/lib/db/models/project.model";
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
  })
    .select("_id")
    .lean();

  if (!project) return api.notFound("Project");

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const sort = searchParams.get("sort") ?? "sortOrder";

  const query: Record<string, any> = { projectId };
  if (status) query.status = status;

  const clips = await Clip.find(query)
    .sort(sort === "newest" ? { createdAt: -1 } : { sortOrder: 1 })
    .lean();

  return api.success({ clips, total: clips.length });
}
