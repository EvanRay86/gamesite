// Trailer frame extraction pipeline using yt-dlp + ffmpeg
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import os from "os";

const exec = promisify(execFile);

// Use the Python-installed yt-dlp (most up to date)
const YTDLP = process.env.YTDLP_PATH ||
  path.join(os.homedir(), "AppData", "Roaming", "Python", "Python313", "Scripts", "yt-dlp.exe");

const TEMP_BASE = path.join(os.tmpdir(), "framed-admin");
const PUBLIC_FRAMED = path.join(process.cwd(), "public", "framed");

export interface TrailerSearchResult {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  channel: string;
}

export interface ExtractedFrames {
  sessionId: string;
  frames: string[]; // relative paths under /tmp served via API
}

/**
 * Search YouTube for trailers using yt-dlp (no API key needed).
 */
export async function searchTrailers(
  query: string,
  maxResults = 5,
): Promise<TrailerSearchResult[]> {
  const { stdout } = await exec(YTDLP, [
    `ytsearch${maxResults}:${query} official trailer`,
    "--dump-json",
    "--flat-playlist",
    "--no-warnings",
  ], { timeout: 30000, maxBuffer: 5 * 1024 * 1024 });

  const results: TrailerSearchResult[] = [];
  // yt-dlp outputs one JSON object per line
  for (const line of stdout.trim().split("\n")) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);
      results.push({
        id: data.id,
        title: data.title || data.fulltitle || "Unknown",
        url: data.url || `https://www.youtube.com/watch?v=${data.id}`,
        thumbnail:
          data.thumbnail ||
          data.thumbnails?.[data.thumbnails.length - 1]?.url ||
          "",
        duration: formatDuration(data.duration),
        channel: data.channel || data.uploader || "",
      });
    } catch {
      // skip malformed lines
    }
  }

  return results;
}

/**
 * Download a YouTube trailer and extract frames every N seconds.
 * Returns paths to the extracted frame images.
 */
export async function extractFrames(
  youtubeUrl: string,
  intervalSeconds = 5,
): Promise<ExtractedFrames> {
  const sessionId = `session-${Date.now()}`;
  const sessionDir = path.join(TEMP_BASE, sessionId);
  await fs.mkdir(sessionDir, { recursive: true });

  const videoPath = path.join(sessionDir, "trailer.mp4");

  // Download trailer at 720p
  await exec(
    YTDLP,
    [
      "-f", "bestvideo[height<=720]+bestaudio/best[height<=720]/best",
      "--merge-output-format", "mp4",
      "--retries", "3",
      "--fragment-retries", "3",
      "-o", videoPath,
      "--no-playlist",
      "--no-warnings",
      youtubeUrl,
    ],
    { timeout: 120000 },
  );

  // Extract frames
  const framesDir = path.join(sessionDir, "frames");
  await fs.mkdir(framesDir, { recursive: true });

  await exec(
    "ffmpeg",
    [
      "-i", videoPath,
      "-vf", `fps=1/${intervalSeconds}`,
      "-q:v", "2",
      "-y",
      path.join(framesDir, "frame-%03d.jpg"),
    ],
    { timeout: 60000 },
  );

  // List extracted frames
  const files = await fs.readdir(framesDir);
  const frameFiles = files
    .filter((f) => f.endsWith(".jpg"))
    .sort()
    .map((f) => path.join(framesDir, f));

  // Clean up video file to save space
  await fs.unlink(videoPath).catch(() => {});

  return {
    sessionId,
    frames: frameFiles,
  };
}

/**
 * Read a frame image from a session directory.
 */
export async function readFrameImage(
  sessionId: string,
  filename: string,
): Promise<Buffer> {
  // Prevent path traversal via sessionId
  if (sessionId.includes("..") || sessionId.includes("/") || sessionId.includes("\\")) {
    throw new Error("Invalid session ID");
  }
  const framePath = path.join(TEMP_BASE, sessionId, "frames", filename);
  return fs.readFile(framePath);
}

/**
 * Save selected frames to Supabase Storage and return the public URLs.
 */
export async function saveSelectedFrames(
  sessionId: string,
  selectedFrameFilenames: string[],
  movieSlug: string,
): Promise<string[]> {
  if (selectedFrameFilenames.length !== 6) {
    throw new Error("Must select exactly 6 frames");
  }

  const { getSupabaseAdmin } = await import("@/lib/supabase-admin");
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase admin client not available");

  const publicUrls: string[] = [];

  for (let i = 0; i < 6; i++) {
    const srcPath = path.join(
      TEMP_BASE,
      sessionId,
      "frames",
      selectedFrameFilenames[i],
    );
    const fileBuffer = await fs.readFile(srcPath);
    const storagePath = `${movieSlug}/frame-${i + 1}.jpg`;

    const { error } = await supabase.storage
      .from("framed-puzzles")
      .upload(storagePath, fileBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) throw new Error(`Failed to upload frame ${i + 1}: ${error.message}`);

    const { data } = supabase.storage
      .from("framed-puzzles")
      .getPublicUrl(storagePath);

    publicUrls.push(data.publicUrl);
  }

  return publicUrls;
}

/**
 * Clean up a session's temp files.
 */
export async function cleanupSession(sessionId: string): Promise<void> {
  const sessionDir = path.join(TEMP_BASE, sessionId);
  await fs.rm(sessionDir, { recursive: true, force: true });
}

/**
 * List frame filenames in a session.
 */
export async function listSessionFrames(
  sessionId: string,
): Promise<string[]> {
  const framesDir = path.join(TEMP_BASE, sessionId, "frames");
  const files = await fs.readdir(framesDir);
  return files.filter((f) => f.endsWith(".jpg")).sort();
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "?:??";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
