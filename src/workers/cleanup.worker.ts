import { Worker } from "bullmq";
import { createRedisConnection } from "@/lib/queue/connection";
import connectDB from "@/lib/db/connection";
import Project from "@/lib/db/models/project.model";
import { deleteFile } from "@/lib/integrations/s3";

export function createCleanupWorker() {
  const worker = new Worker(
    "cleanup",
    async () => {
      await connectDB();

      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      );

      const staleProjects = await Project.find({
        status: { $in: ["completed", "failed"] },
        updatedAt: { $lt: thirtyDaysAgo },
        "storage.rawVideoKey": { $exists: true },
      })
        .select("storage")
        .limit(50);

      let cleaned = 0;

      for (const project of staleProjects) {
        try {
          if (project.storage?.rawVideoKey) {
            await deleteFile(project.storage.rawVideoKey);
            project.storage.rawVideoKey = undefined;
          }
          if (project.storage?.audioKey) {
            await deleteFile(project.storage.audioKey);
            project.storage.audioKey = undefined;
          }
          await project.save();
          cleaned++;
        } catch (err: any) {
          console.error(
            `[cleanup] Failed for project ${project._id}:`,
            err.message
          );
        }
      }

      return { cleaned };
    },
    {
      connection: createRedisConnection(),
      concurrency: 1,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[cleanup-worker] Failed:`, err.message);
  });

  return worker;
}
