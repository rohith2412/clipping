import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import path from "path";

const TEMP_DIR = process.env.WORKER_TEMP_DIR ?? "/tmp/clipengine";

export interface DownloadResult {
  filePath: string;
  fileSize: number;
}

export async function downloadVideo(
  url: string,
  projectId: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  const dir = path.join(TEMP_DIR, projectId);
  await mkdir(dir, { recursive: true });

  const outputPath = path.join(dir, "source.mp4");

  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", [
      "-f",
      "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
      "--merge-output-format",
      "mp4",
      "-o",
      outputPath,
      "--no-playlist",
      "--max-filesize",
      "2G",
      "--progress-template",
      "%(progress._percent_str)s",
      "--newline",
      url,
    ]);

    let lastProgress = 0;

    proc.stdout.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      const match = line.match(/([\d.]+)%/);
      if (match) {
        const pct = parseFloat(match[1]);
        if (pct > lastProgress) {
          lastProgress = pct;
          onProgress?.(pct);
        }
      }
    });

    proc.stderr.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line.includes("ERROR")) {
        console.error("[yt-dlp]", line);
      }
    });

    proc.on("close", (code) => {
      if (code === 0) {
        import("fs/promises").then(({ stat }) =>
          stat(outputPath).then((s) =>
            resolve({ filePath: outputPath, fileSize: s.size })
          )
        );
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

export function getTempDir(projectId: string): string {
  return path.join(TEMP_DIR, projectId);
}
