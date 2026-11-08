import { createVideoProcessingWorker } from "./video-processing.worker";
import { createPublishingWorker } from "./publishing.worker";
import { createScheduledPostsWorker } from "./scheduled-posts.worker";
import { createVoiceoverWorker } from "./voiceover.worker";
import { createAnalyticsSyncWorker } from "./analytics-sync.worker";
import { createCleanupWorker } from "./cleanup.worker";

async function main() {
  console.log("[workers] Starting all workers...");

  const videoWorker = createVideoProcessingWorker();
  const publishingWorker = createPublishingWorker();
  const scheduledWorker = createScheduledPostsWorker();
  const voiceoverWorker = createVoiceoverWorker();
  const analyticsWorker = createAnalyticsSyncWorker();
  const cleanupWorker = createCleanupWorker();

  console.log("[workers] All workers started.");

  const shutdown = async () => {
    console.log("[workers] Shutting down...");
    await Promise.all([
      videoWorker.close(),
      publishingWorker.close(),
      scheduledWorker.close(),
      voiceoverWorker.close(),
      analyticsWorker.close(),
      cleanupWorker.close(),
    ]);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[workers] Fatal error:", err);
  process.exit(1);
});
