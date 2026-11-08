import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/user.model";
import * as api from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("usage plan")
    .lean();
  if (!user) return api.unauthorized();

  return api.success({
    plan: user.plan,
    current: user.usage.clipsGenerated,
    limit: user.plan === "pro" ? null : user.usage.clipsLimit,
    voiceovers: user.usage.voiceoversGenerated,
    videosProcessed: user.usage.videosProcessed,
    periodStart: user.usage.currentPeriodStart,
    periodEnd: user.usage.currentPeriodEnd,
  });
}
