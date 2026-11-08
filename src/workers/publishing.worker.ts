import { Worker, Job } from "bullmq";
import { createRedisConnection } from "@/lib/queue/connection";
import connectDB from "@/lib/db/connection";
import Clip from "@/lib/db/models/clip.model";
import PlatformConnection from "@/lib/db/models/platform-connection.model";
import PublishLog from "@/lib/db/models/publish-log.model";
import { decrypt } from "@/lib/utils/encryption";
import { getSignedDownloadUrl } from "@/lib/integrations/s3";

async function publishToYouTube(
  clip: any,
  connection: any,
  rendition: any
) {
  const token = decrypt(connection.accessToken);
  const downloadUrl = await getSignedDownloadUrl(rendition.s3Key, 3600);

  const metadata = {
    snippet: {
      title: clip.title ?? "Untitled Clip",
      description: clip.description ?? "",
      tags: clip.hashtags ?? [],
      categoryId: "22",
    },
    status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
  };

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    }
  );

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) throw new Error("Failed to initiate YouTube upload");

  const videoRes = await fetch(downloadUrl);
  const videoBuffer = await videoRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: videoBuffer,
  });

  const result = await uploadRes.json();
  if (!result.id) throw new Error("YouTube upload failed");

  return {
    platformPostId: result.id,
    platformUrl: `https://youtube.com/shorts/${result.id}`,
  };
}

async function publishToTikTok(
  clip: any,
  connection: any,
  rendition: any
) {
  const token = decrypt(connection.accessToken);
  const downloadUrl = await getSignedDownloadUrl(rendition.s3Key, 3600);

  const res = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: clip.title ?? "",
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_comment: false,
          disable_duet: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: downloadUrl,
        },
      }),
    }
  );

  const result = await res.json();
  const publishId = result.data?.publish_id;
  if (!publishId) throw new Error("TikTok publish init failed");

  return {
    platformPostId: publishId,
    platformUrl: `https://tiktok.com`,
  };
}

async function publishToInstagram(
  clip: any,
  connection: any,
  rendition: any
) {
  const token = decrypt(connection.accessToken);
  const downloadUrl = await getSignedDownloadUrl(rendition.s3Key, 3600);

  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${connection.platformUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "REELS",
        video_url: downloadUrl,
        caption: `${clip.title ?? ""}\n\n${(clip.hashtags ?? []).map((h: string) => `#${h}`).join(" ")}`,
        access_token: token,
      }),
    }
  );

  const container = await containerRes.json();
  if (!container.id) throw new Error("Instagram container creation failed");

  await new Promise((r) => setTimeout(r, 5000));

  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${connection.platformUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: token,
      }),
    }
  );

  const result = await publishRes.json();
  if (!result.id) throw new Error("Instagram publish failed");

  return {
    platformPostId: result.id,
    platformUrl: `https://instagram.com/reel/${result.id}`,
  };
}

const PUBLISHERS: Record<string, typeof publishToYouTube> = {
  youtube: publishToYouTube,
  tiktok: publishToTikTok,
  instagram: publishToInstagram,
};

export function createPublishingWorker() {
  const worker = new Worker(
    "publishing",
    async (job: Job) => {
      const { clipId, userId, platforms, scheduleId } = job.data;
      await connectDB();

      const clip = await Clip.findById(clipId);
      if (!clip) throw new Error("Clip not found");

      const connections = await PlatformConnection.find({
        userId,
        platform: { $in: platforms },
        isActive: true,
      });

      const results: Record<
        string,
        { status: string; platformPostId?: string; platformUrl?: string; error?: string }
      > = {};

      for (const platform of platforms) {
        const conn = connections.find((c) => c.platform === platform);
        if (!conn) {
          results[platform] = { status: "failed", error: "Not connected" };
          continue;
        }

        const rendition =
          clip.renditions.find((r) => r.platform === platform) ??
          clip.renditions.find((r) => r.platform === "universal") ??
          clip.renditions[0];

        if (!rendition) {
          results[platform] = { status: "failed", error: "No rendition" };
          continue;
        }

        try {
          const publisher = PUBLISHERS[platform];
          if (!publisher) throw new Error(`No publisher for ${platform}`);

          const result = await publisher(clip, conn, rendition);
          results[platform] = { status: "published", ...result };

          const historyEntry = clip.publishHistory.find(
            (h: any) => h.platform === platform && h.status === "pending"
          );
          if (historyEntry) {
            (historyEntry as any).status = "published";
            (historyEntry as any).publishedAt = new Date();
            (historyEntry as any).platformPostId = result.platformPostId;
            (historyEntry as any).platformUrl = result.platformUrl;
          }
        } catch (err: any) {
          results[platform] = { status: "failed", error: err.message };

          const historyEntry = clip.publishHistory.find(
            (h: any) => h.platform === platform && h.status === "pending"
          );
          if (historyEntry) {
            (historyEntry as any).status = "failed";
            (historyEntry as any).error = err.message;
          }
        }

        await PublishLog.create({
          userId,
          clipId,
          scheduleId,
          platform,
          action: "publish",
          status: results[platform].status === "published" ? "published" : "failed",
          platformPostId: results[platform].platformPostId,
          platformUrl: results[platform].platformUrl,
          error: results[platform].error
            ? { message: results[platform].error }
            : undefined,
        });
      }

      const allPublished = Object.values(results).every(
        (r) => r.status === "published"
      );
      if (allPublished) clip.status = "published";
      await clip.save();

      return results;
    },
    {
      connection: createRedisConnection(),
      concurrency: 10,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[publishing-worker] Failed:`, err.message);
  });

  return worker;
}
