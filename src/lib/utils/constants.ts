export const PIPELINE_STEPS = [
  { step: 1, name: "Downloading video", key: "downloading" },
  { step: 2, name: "Transcribing audio", key: "transcribing" },
  { step: 3, name: "Detecting peak moments", key: "analyzing" },
  { step: 4, name: "Generating clips", key: "generating_clips" },
  { step: 5, name: "Post-processing", key: "post_processing" },
  { step: 6, name: "Finalizing", key: "completed" },
] as const;

export const MAX_VIDEO_DURATION = 4 * 60 * 60; // 4 hours
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
export const TEMP_FILE_TTL = 24 * 60 * 60; // 24 hours in seconds

export const CLIP_DURATION = {
  min: 10,
  max: 180,
  defaultMin: 15,
  defaultMax: 60,
} as const;

export const RATE_LIMITS = {
  createProject: { windowMs: 60 * 60 * 1000, max: 10 },
  processProject: { windowMs: 60 * 60 * 1000, max: 10 },
  publishClip: { windowMs: 60 * 60 * 1000, max: 30 },
  voiceoverPreview: { windowMs: 60 * 60 * 1000, max: 20 },
  createSchedule: { windowMs: 60 * 60 * 1000, max: 60 },
  billing: { windowMs: 60 * 1000, max: 5 },
} as const;
