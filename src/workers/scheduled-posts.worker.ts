import { Worker } from "bullmq";
import { createRedisConnection } from "@/lib/queue/connection";
import connectDB from "@/lib/db/connection";
import Schedule from "@/lib/db/models/schedule.model";
import { enqueuePublish } from "@/lib/queue/producers";

export function createScheduledPostsWorker() {
  const worker = new Worker(
    "scheduled-posts",
    async () => {
      await connectDB();

      const now = new Date();
      const duePosts = await Schedule.find({
        status: "scheduled",
        scheduledFor: { $lte: now },
      }).limit(50);

      for (const schedule of duePosts) {
        try {
          schedule.status = "publishing";
          await schedule.save();

          const job = await enqueuePublish(
            schedule.clipId.toString(),
            schedule.userId.toString(),
            schedule.platforms,
            schedule._id!.toString()
          );

          schedule.jobId = job.id;
          await schedule.save();
        } catch (err: any) {
          console.error(
            `[scheduled-posts] Failed to enqueue ${schedule._id}:`,
            err.message
          );
          schedule.status = "failed";
          schedule.results = schedule.platforms.map((p) => ({
            platform: p,
            status: "failed" as const,
            error: err.message,
          }));
          await schedule.save();
        }
      }

      return { processed: duePosts.length };
    },
    {
      connection: createRedisConnection(),
      concurrency: 1,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[scheduled-posts-worker] Failed:`, err.message);
  });

  return worker;
}
