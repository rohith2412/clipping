import { Queue } from "bullmq";
import { getRedisConnection } from "./connection";

const connection = getRedisConnection();

export const videoProcessingQueue = new Queue("video-processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
    removeOnComplete: { age: 7 * 24 * 3600 },
    removeOnFail: { age: 30 * 24 * 3600 },
  },
});

export const publishingQueue = new Queue("publishing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 60_000 },
    removeOnComplete: { age: 3 * 24 * 3600 },
    removeOnFail: { age: 30 * 24 * 3600 },
  },
});

export const scheduledPostsQueue = new Queue("scheduled-posts", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 60_000 },
  },
});

export const voiceoverQueue = new Queue("voiceover", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 15_000 },
  },
});

export const analyticsSyncQueue = new Queue("analytics-sync", {
  connection,
});

export const cleanupQueue = new Queue("cleanup", {
  connection,
});
