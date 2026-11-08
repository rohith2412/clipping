import { Worker, Job } from "bullmq";
import { createRedisConnection } from "@/lib/queue/connection";
import connectDB from "@/lib/db/connection";
import Project from "@/lib/db/models/project.model";
import Clip from "@/lib/db/models/clip.model";
import User from "@/lib/db/models/user.model";
import { downloadVideo, getTempDir } from "@/lib/video/downloader";
import { extractAudio, cutClip, convertToVertical } from "@/lib/video/ffmpeg";
import { transcribeAudio } from "@/lib/integrations/deepgram";
import { detectPeakMoments, generateClipMetadata } from "@/lib/integrations/openai";
import { uploadFile, getS3Key } from "@/lib/integrations/s3";
import { rm, mkdir } from "fs/promises";
import path from "path";

async function updateProjectStatus(
  projectId: string,
  status: string,
  pipeline: Partial<{
    currentStep: number;
    stepName: string;
    progress: number;
  }>
) {
  await Project.findByIdAndUpdate(projectId, {
    status,
    ...Object.fromEntries(
      Object.entries(pipeline).map(([k, v]) => [`pipeline.${k}`, v])
    ),
  });
}

async function handleDownloadVideo(job: Job) {
  const { projectId, sourceUrl } = job.data;
  await connectDB();

  await updateProjectStatus(projectId, "downloading", {
    currentStep: 1,
    stepName: "Downloading video",
    progress: 0,
  });

  const result = await downloadVideo(sourceUrl, projectId, async (pct) => {
    await job.updateProgress(pct);
    await updateProjectStatus(projectId, "downloading", { progress: pct });
  });

  const s3Key = getS3Key(projectId, "source.mp4");
  await uploadFile(s3Key, result.filePath, "video/mp4");

  await Project.findByIdAndUpdate(projectId, {
    "storage.rawVideoKey": s3Key,
    "storage.rawVideoSize": result.fileSize,
  });

  return { s3Key, filePath: result.filePath, fileSize: result.fileSize };
}

async function handleTranscribe(job: Job) {
  const { projectId } = job.data;
  await connectDB();

  await updateProjectStatus(projectId, "transcribing", {
    currentStep: 2,
    stepName: "Transcribing audio",
    progress: 0,
  });

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const tempDir = getTempDir(projectId);
  const videoPath = path.join(tempDir, "source.mp4");
  const audioPath = path.join(tempDir, "audio.wav");

  await extractAudio(videoPath, audioPath);
  await updateProjectStatus(projectId, "transcribing", { progress: 30 });

  const audioS3Key = getS3Key(projectId, "audio.wav");
  await uploadFile(audioS3Key, audioPath, "audio/wav");

  await updateProjectStatus(projectId, "transcribing", { progress: 50 });

  const transcript = await transcribeAudio(audioPath);

  await updateProjectStatus(projectId, "transcribing", { progress: 90 });

  const transcriptS3Key = getS3Key(projectId, "transcript.json");
  await uploadFile(
    transcriptS3Key,
    Buffer.from(JSON.stringify(transcript)) as any,
    "application/json"
  );

  await Project.findByIdAndUpdate(projectId, {
    "storage.audioKey": audioS3Key,
    "storage.transcriptKey": transcriptS3Key,
    transcript: {
      fullText: transcript.fullText,
      segments: transcript.segments,
      language: transcript.language,
    },
  });

  return { transcriptS3Key, segments: transcript.segments };
}

async function handleDetectPeakMoments(job: Job) {
  const { projectId } = job.data;
  await connectDB();

  await updateProjectStatus(projectId, "analyzing", {
    currentStep: 3,
    stepName: "Detecting peak moments",
    progress: 0,
  });

  const project = await Project.findById(projectId);
  if (!project?.transcript?.segments?.length) {
    throw new Error("No transcript available");
  }

  const moments = await detectPeakMoments(
    project.transcript.fullText ?? "",
    project.transcript.segments,
    {
      maxClips: project.config.maxClips,
      minClipDuration: project.config.minClipDuration,
      maxClipDuration: project.config.maxClipDuration,
    }
  );

  await Project.findByIdAndUpdate(projectId, {
    peakMoments: moments,
  });

  await updateProjectStatus(projectId, "analyzing", { progress: 100 });

  return { moments };
}

async function handleGenerateClips(job: Job) {
  const { projectId } = job.data;
  await connectDB();

  await updateProjectStatus(projectId, "generating_clips", {
    currentStep: 4,
    stepName: "Generating clips",
    progress: 0,
  });

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const selectedMoments = project.peakMoments.filter((m) => m.selected);
  const tempDir = getTempDir(projectId);
  const videoPath = path.join(tempDir, "source.mp4");
  const clipsDir = path.join(tempDir, "clips");
  await mkdir(clipsDir, { recursive: true });

  const clipIds: string[] = [];

  for (let i = 0; i < selectedMoments.length; i++) {
    const moment = selectedMoments[i];

    const clip = await Clip.create({
      projectId: project._id,
      userId: project.userId,
      sourceStartTime: moment.startTime,
      sourceEndTime: moment.endTime,
      duration: moment.endTime - moment.startTime,
      transcript: moment.transcript,
      category: moment.category,
      status: "generating",
      sortOrder: i,
      voiceover: { enabled: project.config.voiceoverEnabled, status: "pending" },
      captions: { style: project.config.captionStyle },
    });

    const clipPath = path.join(clipsDir, `${clip._id}_universal.mp4`);
    await cutClip(videoPath, clipPath, moment.startTime, moment.endTime);

    const renditions = [];

    for (const platform of project.config.targetPlatforms) {
      const platformPath = path.join(clipsDir, `${clip._id}_${platform}.mp4`);
      await convertToVertical(clipPath, platformPath);

      const s3Key = getS3Key(
        projectId,
        "clips",
        clip._id.toString(),
        `${platform}.mp4`
      );
      const uploaded = await uploadFile(s3Key, platformPath, "video/mp4");

      renditions.push({
        platform,
        s3Key,
        width: 1080,
        height: 1920,
        fileSize: uploaded.size,
        codec: "h264",
        fps: 30,
        format: "mp4",
      });
    }

    const universalS3Key = getS3Key(
      projectId,
      "clips",
      clip._id.toString(),
      "universal.mp4"
    );
    await uploadFile(universalS3Key, clipPath, "video/mp4");
    renditions.push({
      platform: "universal",
      s3Key: universalS3Key,
      format: "mp4",
    });

    await Clip.findByIdAndUpdate(clip._id, { renditions });
    clipIds.push(clip._id.toString());

    const progress = Math.round(((i + 1) / selectedMoments.length) * 100);
    await updateProjectStatus(projectId, "generating_clips", { progress });
  }

  await Project.findByIdAndUpdate(projectId, {
    clipCount: clipIds.length,
  });

  return { clipIds };
}

async function handlePostProcess(job: Job) {
  const { projectId } = job.data;
  await connectDB();

  await updateProjectStatus(projectId, "post_processing", {
    currentStep: 5,
    stepName: "Post-processing clips",
    progress: 0,
  });

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const clips = await Clip.find({ projectId: project._id, status: "generating" });

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];

    const metadata = await generateClipMetadata(
      clip.transcript ?? "",
      project.videoMetadata.title ?? "",
      project.config.targetPlatforms[0] ?? "youtube"
    );

    await Clip.findByIdAndUpdate(clip._id, {
      title: metadata.title,
      description: metadata.description,
      hashtags: metadata.hashtags,
      status: "ready",
    });

    const progress = Math.round(((i + 1) / clips.length) * 100);
    await updateProjectStatus(projectId, "post_processing", { progress });
  }

  return { processedCount: clips.length };
}

async function handleFinalize(job: Job) {
  const { projectId } = job.data;
  await connectDB();

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const clips = await Clip.find({ projectId: project._id });
  const readyCount = clips.filter((c) => c.status === "ready").length;
  const failedCount = clips.filter((c) => c.status === "failed").length;

  let finalStatus: string;
  if (failedCount === clips.length) {
    finalStatus = "failed";
  } else if (failedCount > 0) {
    finalStatus = "partially_failed";
  } else {
    finalStatus = "completed";
  }

  await Project.findByIdAndUpdate(projectId, {
    status: finalStatus,
    "pipeline.currentStep": 6,
    "pipeline.stepName": "Complete",
    "pipeline.progress": 100,
    "pipeline.completedAt": new Date(),
    clipCount: readyCount,
  });

  await User.findByIdAndUpdate(project.userId, {
    $inc: {
      "usage.clipsGenerated": readyCount,
      "usage.videosProcessed": 1,
    },
  });

  // Clean up temp files
  try {
    const tempDir = getTempDir(projectId);
    await rm(tempDir, { recursive: true, force: true });
  } catch {
    // Non-critical
  }

  return { finalStatus, readyCount, failedCount };
}

const handlers: Record<string, (job: Job) => Promise<any>> = {
  "download-video": handleDownloadVideo,
  "extract-and-transcribe": handleTranscribe,
  "detect-peak-moments": handleDetectPeakMoments,
  "generate-clips": handleGenerateClips,
  "post-process-clips": handlePostProcess,
  finalize: handleFinalize,
};

export function createVideoProcessingWorker() {
  const worker = new Worker(
    "video-processing",
    async (job: Job) => {
      const handler = handlers[job.name];
      if (!handler) {
        throw new Error(`Unknown job: ${job.name}`);
      }

      console.log(`[worker] Starting ${job.name} for project ${job.data.projectId}`);
      const result = await handler(job);
      console.log(`[worker] Completed ${job.name} for project ${job.data.projectId}`);

      return result;
    },
    {
      connection: createRedisConnection(),
      concurrency: parseInt(process.env.WORKER_CONCURRENCY_VIDEO ?? "2"),
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[worker] Failed ${job?.name}:`, err.message);
    if (job?.data?.projectId) {
      Project.findByIdAndUpdate(job.data.projectId, {
        "pipeline.error": {
          step: job.name,
          message: err.message,
          retries: job.attemptsMade,
        },
      }).catch(console.error);
    }
  });

  return worker;
}
