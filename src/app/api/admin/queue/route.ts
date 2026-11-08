import { auth } from "@/auth";
import { getRedisConnection } from "@/lib/queue/connection";
import { Queue } from "bullmq";
import * as api from "@/lib/utils/api-response";

const QUEUE_NAMES = [
  "video-processing",
  "publishing",
  "scheduled-posts",
  "voiceover",
  "analytics-sync",
  "cleanup",
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return api.forbidden();
  }

  const connection = getRedisConnection();
  const stats = await Promise.all(
    QUEUE_NAMES.map(async (name) => {
      try {
        const queue = new Queue(name, { connection });
        const counts = await queue.getJobCounts();
        await queue.close();
        return { name, ...counts };
      } catch {
        return { name, error: "unavailable" };
      }
    })
  );

  return api.success({ queues: stats });
}
