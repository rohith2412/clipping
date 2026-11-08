import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
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
    .select("transcript peakMoments videoMetadata.title")
    .lean();

  if (!project) return api.notFound("Project");

  return api.success({
    transcript: project.transcript,
    peakMoments: project.peakMoments,
    title: project.videoMetadata?.title,
  });
}
