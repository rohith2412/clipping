import { Worker, Job } from "bullmq";
import { createRedisConnection } from "@/lib/queue/connection";
import connectDB from "@/lib/db/connection";
import Clip from "@/lib/db/models/clip.model";
import { generateSpeech } from "@/lib/integrations/elevenlabs";
import { generateVoiceoverScript } from "@/lib/integrations/openai";
import { uploadBuffer, getS3Key } from "@/lib/integrations/s3";
import { mixAudio } from "@/lib/video/ffmpeg";
import { writeFile } from "fs/promises";
import { getTempDir } from "@/lib/video/downloader";
import path from "path";
import { mkdir } from "fs/promises";

export function createVoiceoverWorker() {
  const worker = new Worker(
    "voiceover",
    async (job: Job) => {
      const { clipId, projectId, voiceId, script } = job.data;
      await connectDB();

      const clip = await Clip.findById(clipId);
      if (!clip) throw new Error("Clip not found");

      await Clip.findByIdAndUpdate(clipId, {
        "voiceover.status": "generating",
      });

      const finalScript = script || (await generateVoiceoverScript(clip.transcript ?? ""));

      const audioBuffer = await generateSpeech(finalScript, voiceId);

      const tempDir = getTempDir(projectId);
      await mkdir(tempDir, { recursive: true });
      const voiceoverPath = path.join(tempDir, `${clipId}_voiceover.mp3`);
      await writeFile(voiceoverPath, audioBuffer);

      const audioS3Key = getS3Key(
        projectId,
        "clips",
        clipId,
        "voiceover.mp3"
      );
      await uploadBuffer(audioS3Key, audioBuffer, "audio/mpeg");

      await Clip.findByIdAndUpdate(clipId, {
        "voiceover.status": "ready",
        "voiceover.voiceId": voiceId,
        "voiceover.script": finalScript,
        "voiceover.audioS3Key": audioS3Key,
      });

      return { audioS3Key };
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
    }
  );

  worker.on("failed", async (job, err) => {
    console.error(`[voiceover-worker] Failed:`, err.message);
    if (job?.data?.clipId) {
      await Clip.findByIdAndUpdate(job.data.clipId, {
        "voiceover.status": "failed",
      }).catch(console.error);
    }
  });

  return worker;
}
