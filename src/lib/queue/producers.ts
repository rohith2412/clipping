import { FlowProducer } from "bullmq";
import { getRedisConnection } from "./connection";

const flowProducer = new FlowProducer({
  connection: getRedisConnection(),
});

export async function enqueueVideoProcessing(
  projectId: string,
  sourceUrl: string
) {
  const flow = await flowProducer.add({
    name: "finalize",
    queueName: "video-processing",
    data: { projectId },
    children: [
      {
        name: "post-process-clips",
        queueName: "video-processing",
        data: { projectId },
        children: [
          {
            name: "generate-clips",
            queueName: "video-processing",
            data: { projectId },
            children: [
              {
                name: "detect-peak-moments",
                queueName: "video-processing",
                data: { projectId },
                children: [
                  {
                    name: "extract-and-transcribe",
                    queueName: "video-processing",
                    data: { projectId },
                    children: [
                      {
                        name: "download-video",
                        queueName: "video-processing",
                        data: { projectId, sourceUrl },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  return flow.job.id;
}

export async function enqueuePublish(
  clipId: string,
  userId: string,
  platforms: string[],
  scheduleId?: string
) {
  const { publishingQueue } = await import("./queues");
  return publishingQueue.add("publish-clip", {
    clipId,
    userId,
    platforms,
    scheduleId,
  });
}

export async function enqueueVoiceover(
  clipId: string,
  projectId: string,
  voiceId: string,
  script: string
) {
  const { voiceoverQueue } = await import("./queues");
  return voiceoverQueue.add("generate-voiceover", {
    clipId,
    projectId,
    voiceId,
    script,
  });
}
