import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Clip from "@/lib/db/models/clip.model";
import { enqueueVoiceover } from "@/lib/queue/producers";
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

  const { voiceId, script } = body;
  if (!voiceId) {
    return api.error("voiceId is required", 400);
  }

  await connectDB();

  const clip = await Clip.findOne({
    _id: clipId,
    userId: session.user.id,
  });

  if (!clip) return api.notFound("Clip");

  clip.voiceover.enabled = true;
  clip.voiceover.status = "pending";
  clip.voiceover.voiceId = voiceId;
  if (script) clip.voiceover.script = script;
  await clip.save();

  const job = await enqueueVoiceover(
    clipId,
    clip.projectId.toString(),
    voiceId,
    script ?? ""
  );

  return api.success({ jobId: job.id }, 202);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { clipId } = await ctx.params;
  await connectDB();

  const clip = await Clip.findOneAndUpdate(
    { _id: clipId, userId: session.user.id },
    {
      $set: {
        "voiceover.enabled": false,
        "voiceover.status": "pending",
        "voiceover.script": undefined,
        "voiceover.audioS3Key": undefined,
      },
    },
    { new: true }
  );

  if (!clip) return api.notFound("Clip");
  return api.success(clip);
}
