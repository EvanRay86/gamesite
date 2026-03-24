"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface TrailerResult {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  channel: string;
}

type Step =
  | "search"
  | "pick-video"
  | "extracting"
  | "trim"
  | "configure"
  | "saving"
  | "done";

const VARIANTS = ["all", "pop", "rock", "hip-hop", "2000s", "country", "rnb"];
const CLIP_DURATIONS = [1, 2, 4, 7, 11, 16];

export default function AdminHeardlePage() {
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [videos, setVideos] = useState<TrailerResult[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<TrailerResult | null>(null);

  // Audio extraction
  const [sessionId, setSessionId] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [trimming, setTrimming] = useState(false);
  const [trimmed, setTrimmed] = useState(false);

  // Audio playback
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const animRef = useRef<number | null>(null);

  // Puzzle config
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songYear, setSongYear] = useState("");
  const [puzzleDate, setPuzzleDate] = useState(getTodayISO());
  const [variant, setVariant] = useState("all");
  const [songSlug, setSongSlug] = useState("");

  // Result
  const [savedResult, setSavedResult] = useState<{
    audioPath: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState("");

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Search ──────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/trailer/search?q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideos(data);
      setStep("pick-video");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // ── Extract audio ─────────────────────────────────────────────────────
  const handleExtract = useCallback(
    async (video: TrailerResult) => {
      setSelectedVideo(video);
      setStep("extracting");
      setError("");

      // Pre-fill song info from video title
      const cleaned = video.title
        .replace(/\s*[\(\[].*?[\)\]]/g, "")
        .replace(
          /\s*(Official\s*)?(Music\s*)?(Video|Audio|Lyrics|Visualizer|MV|HD|HQ).*/i,
          "",
        )
        .trim();
      const dashSplit = cleaned.split(/\s*[-–—]\s*/);
      if (dashSplit.length >= 2) {
        setSongArtist(dashSplit[0].trim());
        setSongTitle(dashSplit.slice(1).join(" – ").trim());
      } else {
        setSongTitle(cleaned);
        setSongArtist(video.channel || "");
      }

      try {
        const res = await fetch("/api/admin/heardle/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: video.url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSessionId(data.sessionId);
        setAudioDuration(data.durationSeconds);
        setStartSeconds(0);
        setTrimmed(false);
        setStep("trim");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Extraction failed");
        setStep("pick-video");
      }
    },
    [],
  );

  // ── Audio playback helpers ────────────────────────────────────────────
  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  const playPreview = useCallback(
    (file: string, maxDuration?: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      stopPlayback();

      audio.src = `/api/admin/heardle/preview?session=${sessionId}&file=${file}`;
      audio.currentTime = 0;
      audio.play().then(() => {
        setIsPlaying(true);
        const tick = () => {
          setPlaybackTime(audio.currentTime);
          if (maxDuration && audio.currentTime >= maxDuration) {
            stopPlayback();
            return;
          }
          if (!audio.paused) {
            animRef.current = requestAnimationFrame(tick);
          }
        };
        animRef.current = requestAnimationFrame(tick);
      });

      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
    },
    [sessionId, stopPlayback],
  );

  // ── Trim clip ─────────────────────────────────────────────────────────
  const handleTrim = useCallback(async () => {
    setTrimming(true);
    setError("");
    stopPlayback();

    try {
      const res = await fetch("/api/admin/heardle/trim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, startSeconds, clipDuration: 16 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrimmed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Trim failed");
    } finally {
      setTrimming(false);
    }
  }, [sessionId, startSeconds, stopPlayback]);

  // ── Save puzzle ───────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const slug = songSlug || slugify(`${songArtist}-${songTitle}`);
    if (!songTitle || !songArtist || !songYear || !trimmed) {
      setError("Need title, artist, year, and a trimmed clip");
      return;
    }
    setStep("saving");
    setError("");
    stopPlayback();

    try {
      const res = await fetch("/api/admin/heardle/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          title: songTitle,
          artist: songArtist,
          year: parseInt(songYear),
          date: puzzleDate,
          variant,
          songSlug: slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSavedResult(data);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setStep("configure");
    }
  }, [
    sessionId,
    songTitle,
    songArtist,
    songYear,
    puzzleDate,
    variant,
    songSlug,
    trimmed,
    stopPlayback,
  ]);

  // ── Reset ─────────────────────────────────────────────────────────────
  const reset = () => {
    stopPlayback();
    setStep("search");
    setVideos([]);
    setSelectedVideo(null);
    setSessionId("");
    setAudioDuration(0);
    setStartSeconds(0);
    setTrimmed(false);
    setSavedResult(null);
    setError("");
    setSongTitle("");
    setSongArtist("");
    setSongYear("");
    setSongSlug("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hidden audio element */}
        <audio ref={audioRef} />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Heardle Puzzle Builder
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Search for a song on YouTube, extract audio, trim a 16-second
              clip, and save as a puzzle.
            </p>
          </div>
          {step !== "search" && (
            <button
              onClick={reset}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Start over
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-8">
          {(
            [
              "search",
              "pick-video",
              "trim",
              "configure",
              "done",
            ] as const
          ).map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  getStepIndex(step) >= i ? "bg-purple" : "bg-gray-200"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Step: Search ─────────────────────────────────────────────── */}
        {step === "search" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Search for a song
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder='e.g. "Bohemian Rhapsody Queen", "Billie Jean Michael Jackson"...'
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm
                           focus:border-purple focus:outline-none transition-colors"
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="bg-purple text-white font-bold rounded-xl px-6 py-3 text-sm
                           hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Pick Video ───────────────────────────────────────── */}
        {step === "pick-video" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Pick a video
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({videos.length} results)
              </span>
            </h2>
            <div className="space-y-3">
              {videos.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleExtract(v)}
                  className="w-full flex items-center gap-4 rounded-xl border-2 border-gray-100
                             p-3 text-left hover:border-purple hover:bg-purple/5 transition-all"
                >
                  {v.thumbnail && (
                    <img
                      src={v.thumbnail}
                      alt=""
                      className="w-32 h-18 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">
                      {v.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {v.channel} &middot; {v.duration}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep("search")}
              className="mt-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              &larr; Back to search
            </button>
          </div>
        )}

        {/* ── Step: Extracting ─────────────────────────────────────────── */}
        {step === "extracting" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">
              Extracting audio...
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Downloading and converting audio. This takes 10-30 seconds.
            </p>
            {selectedVideo && (
              <p className="text-xs text-gray-400 mt-2">
                {selectedVideo.title}
              </p>
            )}
          </div>
        )}

        {/* ── Step: Trim ─────────────────────────────────────────────── */}
        {step === "trim" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Set clip start point
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Choose where the 16-second clip begins. The game will
              progressively reveal 1s → 2s → 4s → 7s → 11s → 16s of this
              clip.
            </p>

            {/* Full audio preview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Full audio ({formatTime(audioDuration)})
                </span>
                <button
                  onClick={() => {
                    if (isPlaying) {
                      stopPlayback();
                    } else {
                      playPreview("full.mp3");
                    }
                  }}
                  className="text-xs font-semibold text-purple hover:underline"
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play full"}
                </button>
              </div>

              {/* Timeline with start marker */}
              <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                {/* Playback progress */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-purple/20"
                  style={{
                    width: `${(playbackTime / Math.max(audioDuration, 1)) * 100}%`,
                  }}
                />

                {/* Selected clip region */}
                <div
                  className="absolute top-0 bottom-0 bg-purple/30 border-l-2 border-r-2 border-purple"
                  style={{
                    left: `${(startSeconds / Math.max(audioDuration, 1)) * 100}%`,
                    width: `${(Math.min(16, audioDuration - startSeconds) / Math.max(audioDuration, 1)) * 100}%`,
                  }}
                />

                {/* Clip duration labels inside the region */}
                <div
                  className="absolute top-0 bottom-0 flex items-center pointer-events-none"
                  style={{
                    left: `${(startSeconds / Math.max(audioDuration, 1)) * 100}%`,
                    width: `${(Math.min(16, audioDuration - startSeconds) / Math.max(audioDuration, 1)) * 100}%`,
                  }}
                >
                  <span className="text-[10px] font-bold text-purple ml-1">
                    16s clip
                  </span>
                </div>
              </div>
            </div>

            {/* Start time slider */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Clip start: {formatTime(startSeconds)}
              </label>
              <input
                type="range"
                min={0}
                max={Math.max(0, audioDuration - 16)}
                value={startSeconds}
                onChange={(e) => {
                  setStartSeconds(parseInt(e.target.value));
                  setTrimmed(false);
                }}
                className="w-full accent-purple"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0:00</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

            {/* Preview clip stages */}
            <div className="mb-6 p-4 bg-purple/5 rounded-xl border border-purple/20">
              <div className="text-xs font-semibold text-purple mb-3">
                Clip stages preview
              </div>
              <div className="flex gap-2">
                {CLIP_DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      if (trimmed) {
                        playPreview("clip.mp3", d);
                      } else {
                        playPreview("full.mp3", d);
                        // Set audio start to the selected offset
                        const audio = audioRef.current;
                        if (audio) {
                          audio.currentTime = startSeconds;
                        }
                      }
                    }}
                    className="flex-1 rounded-lg border-2 border-purple/20 bg-white py-2 text-center
                               text-xs font-bold text-purple hover:bg-purple hover:text-white
                               transition-all"
                  >
                    ▶ {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Trim button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTrim}
                disabled={trimming}
                className={`font-bold rounded-xl px-6 py-3 text-sm transition-opacity ${
                  trimmed
                    ? "bg-green-500 text-white"
                    : "bg-purple text-white hover:opacity-90"
                } disabled:opacity-50`}
              >
                {trimming
                  ? "Trimming..."
                  : trimmed
                    ? "✓ Clip trimmed"
                    : "Trim 16s clip"}
              </button>

              {trimmed && (
                <button
                  onClick={() => playPreview("clip.mp3")}
                  className="text-sm font-semibold text-purple hover:underline"
                >
                  ▶ Play trimmed clip
                </button>
              )}

              {trimmed && (
                <button
                  onClick={() => setStep("configure")}
                  className="ml-auto bg-purple text-white font-bold rounded-xl px-5 py-2.5 text-sm
                             hover:opacity-90 transition-opacity"
                >
                  Next &rarr;
                </button>
              )}
            </div>

            <button
              onClick={() => {
                stopPlayback();
                setStep("pick-video");
              }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              &larr; Pick a different video
            </button>
          </div>
        )}

        {/* ── Step: Configure ──────────────────────────────────────────── */}
        {step === "configure" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm max-w-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Configure puzzle
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Song Title
                </label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => {
                    setSongTitle(e.target.value);
                    setSongSlug(
                      slugify(`${songArtist}-${e.target.value}`),
                    );
                  }}
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm
                             focus:border-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Artist
                </label>
                <input
                  type="text"
                  value={songArtist}
                  onChange={(e) => {
                    setSongArtist(e.target.value);
                    setSongSlug(
                      slugify(`${e.target.value}-${songTitle}`),
                    );
                  }}
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm
                             focus:border-purple focus:outline-none"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={songYear}
                    onChange={(e) => setSongYear(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm
                               focus:border-purple focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Puzzle Date
                  </label>
                  <input
                    type="date"
                    value={puzzleDate}
                    onChange={(e) => setPuzzleDate(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm
                               focus:border-purple focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Variant
                </label>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm
                             focus:border-purple focus:outline-none"
                >
                  {VARIANTS.map((v) => (
                    <option key={v} value={v}>
                      {v === "rnb"
                        ? "R&B"
                        : v.charAt(0).toUpperCase() + v.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Slug (folder name)
                </label>
                <input
                  type="text"
                  value={songSlug || slugify(`${songArtist}-${songTitle}`)}
                  onChange={(e) => setSongSlug(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm font-mono
                             focus:border-purple focus:outline-none"
                />
              </div>
            </div>

            {/* Audio preview */}
            <div className="mt-6 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-500">
                  Trimmed clip (16s from {formatTime(startSeconds)})
                </div>
                <button
                  onClick={() => playPreview("clip.mp3")}
                  className="text-xs font-semibold text-purple hover:underline"
                >
                  ▶ Preview clip
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSave}
                className="bg-purple text-white font-bold rounded-xl px-6 py-3 text-sm
                           hover:opacity-90 transition-opacity"
              >
                Save puzzle
              </button>
              <button
                onClick={() => {
                  stopPlayback();
                  setStep("trim");
                }}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                &larr; Back to trim
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Saving ─────────────────────────────────────────────── */}
        {step === "saving" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">
              Saving puzzle...
            </h2>
          </div>
        )}

        {/* ── Step: Done ───────────────────────────────────────────────── */}
        {step === "done" && savedResult && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
            <div className="text-4xl mb-3">🎵</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Puzzle saved!
            </h2>
            <p className="text-sm text-gray-600 mb-4">{savedResult.message}</p>

            <div className="inline-flex items-center gap-2 bg-purple/10 text-purple rounded-full px-4 py-2 text-sm font-medium mb-6">
              <span>🎧</span>
              <span>{savedResult.audioPath}</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={reset}
                className="bg-purple text-white font-bold rounded-xl px-6 py-3 text-sm
                           hover:opacity-90 transition-opacity"
              >
                Create another
              </button>
              <a
                href="/daily/heardle"
                className="text-sm font-medium text-purple hover:underline"
              >
                View game &rarr;
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getStepIndex(step: Step): number {
  const map: Record<Step, number> = {
    search: 0,
    "pick-video": 1,
    extracting: 2,
    trim: 2,
    configure: 3,
    saving: 4,
    done: 4,
  };
  return map[step];
}
