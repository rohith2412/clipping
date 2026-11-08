import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export async function extractAudio(
  videoPath: string,
  outputPath: string
): Promise<string> {
  await execFileAsync("ffmpeg", [
    "-i", videoPath,
    "-vn",
    "-acodec", "pcm_s16le",
    "-ar", "16000",
    "-ac", "1",
    "-y",
    outputPath,
  ]);
  return outputPath;
}

export async function cutClip(
  videoPath: string,
  outputPath: string,
  startTime: number,
  endTime: number
): Promise<string> {
  await execFileAsync("ffmpeg", [
    "-ss", startTime.toString(),
    "-to", endTime.toString(),
    "-i", videoPath,
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-y",
    outputPath,
  ]);
  return outputPath;
}

export async function convertToVertical(
  inputPath: string,
  outputPath: string,
  mode: "crop" | "blur-pad" = "blur-pad"
): Promise<string> {
  const filters =
    mode === "crop"
      ? "crop=ih*9/16:ih,scale=1080:1920"
      : [
          "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1[fg]",
          "[0:v]scale=1080:1920,boxblur=20:20[bg]",
          "[bg][fg]overlay=(W-w)/2:(H-h)/2",
        ].join(";");

  const args =
    mode === "crop"
      ? ["-i", inputPath, "-vf", filters, "-c:a", "copy", "-y", outputPath]
      : [
          "-i", inputPath,
          "-filter_complex", filters,
          "-c:v", "libx264",
          "-preset", "medium",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          "-y",
          outputPath,
        ];

  await execFileAsync("ffmpeg", args);
  return outputPath;
}

export async function burnCaptions(
  videoPath: string,
  srtPath: string,
  outputPath: string,
  style?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    bgColor?: string;
  }
): Promise<string> {
  const fontName = style?.fontFamily ?? "Inter";
  const fontSize = style?.fontSize ?? 24;
  const color = (style?.color ?? "#FFFFFF").replace("#", "&H00").split("").reverse().join("");

  await execFileAsync("ffmpeg", [
    "-i", videoPath,
    "-vf",
    `subtitles=${srtPath}:force_style='FontName=${fontName},FontSize=${fontSize},PrimaryColour=${color},Outline=2,Shadow=1,MarginV=60'`,
    "-c:a", "copy",
    "-y",
    outputPath,
  ]);
  return outputPath;
}

export async function mixAudio(
  videoPath: string,
  voiceoverPath: string,
  outputPath: string,
  originalVolume = 0.3,
  voiceoverVolume = 1.0
): Promise<string> {
  await execFileAsync("ffmpeg", [
    "-i", videoPath,
    "-i", voiceoverPath,
    "-filter_complex",
    `[0:a]volume=${originalVolume}[orig];[1:a]volume=${voiceoverVolume}[vo];[orig][vo]amix=inputs=2:duration=longest`,
    "-c:v", "copy",
    "-y",
    outputPath,
  ]);
  return outputPath;
}

export async function getVideoDuration(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet",
    "-show_entries", "format=duration",
    "-of", "csv=p=0",
    filePath,
  ]);
  return parseFloat(stdout.trim());
}

export async function getVideoInfo(filePath: string) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);
  return JSON.parse(stdout);
}
