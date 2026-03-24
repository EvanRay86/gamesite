// Heardle audio extraction pipeline using yt-dlp + ffmpeg
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import os from "os";

const exec = promisify(execFile);

const YTDLP =
  process.env.YTDLP_PATH ||
  path.join(
    os.homedir(),
    "AppData",
    "Roaming",
    "Python",
    "Python313",
    "Scripts",
    "yt-dlp.exe",
  );

const TEMP_BASE = path.join(os.tmpdir(), "heardle-admin");
const PUBLIC_HEARDLE = path.join(process.cwd(), "public", "heardle");

/**
 * Download a YouTube video's audio and convert to mp3.
 * Returns a session ID for later reference.
 */
export async function extractAudio(youtubeUrl: string): Promise<{
  sessionId: string;
  durationSeconds: number;
}> {
  const sessionId = `session-${Date.now()}`;
  const sessionDir = path.join(TEMP_BASE, sessionId);
  await fs.mkdir(sessionDir, { recursive: true });

  const audioPath = path.join(sessionDir, "full.mp3");

  // Download audio only, convert to mp3
  await exec(
    YTDLP,
    [
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "192K",
      "--retries",
      "3",
      "--fragment-retries",
      "3",
      "-o",
      audioPath,
      "--no-playlist",
      "--no-warnings",
      youtubeUrl,
    ],
    { timeout: 120000 },
  );

  // Get duration using ffmpeg
  const durationSeconds = await getAudioDuration(audioPath);

  return { sessionId, durationSeconds };
}

/**
 * Get audio duration in seconds using ffprobe.
 */
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await exec("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    return Math.floor(parseFloat(stdout.trim()));
  } catch {
    return 0;
  }
}

/**
 * Create a trimmed clip from the full audio.
 * startSeconds: where the clip starts (from beginning of song)
 * clipDuration: how long the clip is (e.g. 16s for the full heardle clip)
 */
export async function trimAudioClip(
  sessionId: string,
  startSeconds: number,
  clipDuration: number = 16,
): Promise<string> {
  const sessionDir = path.join(TEMP_BASE, sessionId);
  const fullPath = path.join(sessionDir, "full.mp3");
  const clipPath = path.join(sessionDir, "clip.mp3");

  await exec(
    "ffmpeg",
    [
      "-i",
      fullPath,
      "-ss",
      String(startSeconds),
      "-t",
      String(clipDuration),
      "-acodec",
      "libmp3lame",
      "-ab",
      "192k",
      "-y",
      clipPath,
    ],
    { timeout: 30000 },
  );

  return clipPath;
}

/**
 * Read an audio file from a session directory.
 */
export async function readSessionAudio(
  sessionId: string,
  filename: string,
): Promise<Buffer> {
  // Prevent path traversal
  const safeName = path.basename(filename);
  const audioPath = path.join(TEMP_BASE, sessionId, safeName);
  return fs.readFile(audioPath);
}

/**
 * Save the trimmed clip to public/heardle/{slug}/clip.mp3 and return the public path.
 */
export async function saveAudioClip(
  sessionId: string,
  songSlug: string,
): Promise<string> {
  const sessionDir = path.join(TEMP_BASE, sessionId);
  const clipPath = path.join(sessionDir, "clip.mp3");

  // Verify clip exists
  await fs.access(clipPath);

  const destDir = path.join(PUBLIC_HEARDLE, songSlug);
  await fs.mkdir(destDir, { recursive: true });

  const destPath = path.join(destDir, "clip.mp3");
  await fs.copyFile(clipPath, destPath);

  return `/heardle/${songSlug}/clip.mp3`;
}

/**
 * Clean up a session's temp files.
 */
export async function cleanupSession(sessionId: string): Promise<void> {
  const sessionDir = path.join(TEMP_BASE, sessionId);
  await fs.rm(sessionDir, { recursive: true, force: true });
}
