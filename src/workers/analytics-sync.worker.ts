import { Worker } from "bullmq";
import { createRedisConnection } from "@/lib/queue/connection";
import connectDB from "@/lib/db/connection";
import Clip from "@/lib/db/models/clip.model";
import PlatformConnection from "@/lib/db/models/platform-connection.model";
import { decrypt } from "@/lib/utils/encryption";

async function fetchYouTubeMetrics(videoId: string, token: string) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const stats = data.items?.[0]?.statistics;
  if (!stats) return null;
  return {
    views: parseInt(stats.viewCount ?? "0"),
    likes: parseInt(stats.likeCount ?? "0"),
    comments: parseInt(stats.commentCount ?? "0"),
    shares: 0,
  };
}

async function fetchTikTokMetrics(videoId: string, token: string) {
  const res = await fetch(
    `https://open.tiktokapis.com/v2/video/query/?fields=like_count,comment_count,share_count,view_count`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filters: { video_ids: [videoId] },
      }),
    }
  );
  const data = await res.json();
  const video = data.data?.videos?.[0];
  if (!video) return null;
  return {
    views: video.view_count ?? 0,
    likes: video.like_count ?? 0,
    comments: video.comment_count ?? 0,
    shares: video.share_count ?? 0,
  };
}

async function fetchInstagramMetrics(mediaId: string, token: string) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=plays,likes,comments,shares&access_token=${token}`
  );
  const data = await res.json();
  const metrics: Record<string, number> = {};
  for (const item of data.data ?? []) {
    metrics[item.name] = item.values?.[0]?.value ?? 0;
  }
  return {
    views: metrics.plays ?? 0,
    likes: metrics.likes ?? 0,
    comments: metrics.comments ?? 0,
    shares: metrics.shares ?? 0,
  };
}

const FETCHERS: Record<string, (id: string, token: string) => Promise<any>> = {
  youtube: fetchYouTubeMetrics,
  tiktok: fetchTikTokMetrics,
  instagram: fetchInstagramMetrics,
};

export function createAnalyticsSyncWorker() {
  const worker = new Worker(
    "analytics-sync",
    async () => {
      await connectDB();

      const clips = await Clip.find({
        status: "published",
        "publishHistory.status": "published",
      }).limit(200);

      let synced = 0;

      for (const clip of clips) {
        for (const entry of clip.publishHistory) {
          if (entry.status !== "published" || !entry.platformPostId) continue;

          const conn = await PlatformConnection.findOne({
            userId: clip.userId,
            platform: entry.platform,
            isActive: true,
          });
          if (!conn) continue;

          try {
            const fetcher = FETCHERS[entry.platform];
            if (!fetcher) continue;

            const token = decrypt(conn.accessToken);
            const metrics = await fetcher(entry.platformPostId, token);
            if (!metrics) continue;

            (clip.metrics as any)[entry.platform] = metrics;
            clip.metrics!.lastSyncedAt = new Date();
            synced++;
          } catch (err: any) {
            console.error(
              `[analytics-sync] ${entry.platform}/${entry.platformPostId}:`,
              err.message
            );
          }
        }

        await clip.save();
      }

      return { synced };
    },
    {
      connection: createRedisConnection(),
      concurrency: 1,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[analytics-sync-worker] Failed:`, err.message);
  });

  return worker;
}
