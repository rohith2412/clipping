import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface VideoMetadata {
  title: string;
  description: string;
  channelName: string;
  channelId: string;
  thumbnailUrl: string;
  duration: number;
  publishedAt: string;
  viewCount: number;
  tags: string[];
}

export async function fetchVideoMetadata(url: string): Promise<VideoMetadata> {
  const { stdout } = await execFileAsync("yt-dlp", [
    "--dump-json",
    "--no-playlist",
    "--no-download",
    url,
  ]);

  const data = JSON.parse(stdout);

  return {
    title: data.title ?? "",
    description: data.description ?? "",
    channelName: data.uploader ?? data.channel ?? "",
    channelId: data.channel_id ?? "",
    thumbnailUrl: data.thumbnail ?? "",
    duration: data.duration ?? 0,
    publishedAt: data.upload_date
      ? `${data.upload_date.slice(0, 4)}-${data.upload_date.slice(4, 6)}-${data.upload_date.slice(6, 8)}`
      : "",
    viewCount: data.view_count ?? 0,
    tags: data.tags ?? [],
  };
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}
