import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Clip from "@/lib/db/models/clip.model";
import Project from "@/lib/db/models/project.model";
import Schedule from "@/lib/db/models/schedule.model";
import * as api from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  await connectDB();

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    totalProjects,
    totalClips,
    publishedClips,
    scheduledPosts,
    recentClips,
  ] = await Promise.all([
    Project.countDocuments({ userId: session.user.id }),
    Clip.countDocuments({ userId: session.user.id }),
    Clip.countDocuments({ userId: session.user.id, status: "published" }),
    Schedule.countDocuments({
      userId: session.user.id,
      status: "scheduled",
    }),
    Clip.find({
      userId: session.user.id,
      "metrics.lastSyncedAt": { $gte: since },
    })
      .select("title metrics publishHistory")
      .sort({ "metrics.lastSyncedAt": -1 })
      .limit(20)
      .lean(),
  ]);

  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;

  for (const clip of recentClips) {
    for (const platform of ["youtube", "tiktok", "instagram"] as const) {
      const m = clip.metrics?.[platform];
      if (m) {
        totalViews += m.views ?? 0;
        totalLikes += m.likes ?? 0;
        totalComments += m.comments ?? 0;
        totalShares += m.shares ?? 0;
      }
    }
  }

  const topClips = recentClips
    .map((clip) => {
      let views = 0;
      for (const platform of ["youtube", "tiktok", "instagram"] as const) {
        views += clip.metrics?.[platform]?.views ?? 0;
      }
      return { ...clip, totalViews: views };
    })
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 10);

  return api.success({
    overview: {
      totalProjects,
      totalClips,
      publishedClips,
      scheduledPosts,
    },
    engagement: {
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      period: `${days}d`,
    },
    topClips,
  });
}
