import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Clip from "@/lib/db/models/clip.model";
import { getSignedDownloadUrl } from "@/lib/integrations/s3";
import * as api from "@/lib/utils/api-response";

type Ctx = { params: Promise<{ clipId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { clipId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "universal";

  await connectDB();

  const clip = await Clip.findOne({
    _id: clipId,
    userId: session.user.id,
  }).lean();

  if (!clip) return api.notFound("Clip");

  const rendition =
    clip.renditions.find((r) => r.platform === platform) ??
    clip.renditions[0];

  if (!rendition) {
    return api.error("No rendition available", 404);
  }

  const url = await getSignedDownloadUrl(rendition.s3Key, 3600);

  return api.success({ url, platform: rendition.platform });
}
