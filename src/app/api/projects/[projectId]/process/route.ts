import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Project from "@/lib/db/models/project.model";
import User from "@/lib/db/models/user.model";
import { enqueueVideoProcessing } from "@/lib/queue/producers";
import * as api from "@/lib/utils/api-response";

type Ctx = { params: Promise<{ projectId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { projectId } = await ctx.params;
  await connectDB();

  const user = await User.findById(session.user.id).select("usage plan").lean();
  if (!user) return api.unauthorized();

  if (
    user.plan === "starter" &&
    user.usage.clipsGenerated >= user.usage.clipsLimit
  ) {
    return api.error("Monthly clip limit reached", 429);
  }

  const project = await Project.findOne({
    _id: projectId,
    userId: session.user.id,
  });

  if (!project) return api.notFound("Project");

  if (!["pending", "failed"].includes(project.status)) {
    return api.error("Project is already being processed", 400);
  }

  project.status = "pending";
  project.pipeline = {
    currentStep: 0,
    totalSteps: 6,
    stepName: "Queued",
    progress: 0,
    startedAt: new Date(),
    completedAt: undefined,
    error: undefined,
  };

  const jobId = await enqueueVideoProcessing(
    projectId,
    project.sourceUrl
  );

  project.jobId = jobId ?? undefined;
  await project.save();

  return api.success({ jobId, status: "processing" }, 202);
}
