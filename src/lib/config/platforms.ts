export const PLATFORM_SPECS = {
  youtube: {
    name: "YouTube Shorts",
    maxDuration: 60,
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    maxFileSize: 256 * 1024 * 1024,
    supportedFormats: ["mp4"],
    codec: "h264",
    icon: "Youtube",
  },
  tiktok: {
    name: "TikTok",
    maxDuration: 600,
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    maxFileSize: 4 * 1024 * 1024 * 1024,
    supportedFormats: ["mp4", "webm"],
    codec: "h264",
    icon: "Music2",
  },
  instagram: {
    name: "Instagram Reels",
    maxDuration: 90,
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    maxFileSize: 1024 * 1024 * 1024,
    supportedFormats: ["mp4"],
    codec: "h264",
    icon: "Instagram",
  },
} as const;

export type Platform = keyof typeof PLATFORM_SPECS;
export const PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram"];
