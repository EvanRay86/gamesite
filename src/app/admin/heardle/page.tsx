"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface SoundCloudTrack {
  id: number;
  title: string;
  url: string;
  artwork: string | null;
  durationMs: number;
  artist: string;
  year: number | null;
}

type Step = "search" | "pick-track" | "configure" | "saving" | "done";

const VARIANTS = ["all", "pop", "rock", "hip-hop", "2000s", "country", "rnb"];

const SC_WIDGET_API = "https://w.soundcloud.com/player/api.js";

export default function AdminHeardlePage() {
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [tracks, setTracks] = useState<SoundCloudTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SoundCloudTrack | null>(null);

  // Audio preview
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Puzzle config
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songYear, setSongYear] = useState("");
  const [puzzleDate, setPuzzleDate] = useState(getTodayISO());
  const [variant, setVariant] = useState("all");

  // Result
  const [savedResult, setSavedResult] = useState<{ message: string } | null>(null);
  const [error, setError] = useState("");

  // Load SoundCloud Widget API
  useEffect(() => {
    if (document.querySelector(`script[src="${SC_WIDGET_API}"]`)) return;
    const script = document.createElement("script");
    script.src = SC_WIDGET_API;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // ── Search SoundCloud ──────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/heardle/search?q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTracks(data);
      setStep("pick-track");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // ── Select a track ─────────────────────────────────────────────────────
  const handleSelectTrack = useCallback((track: SoundCloudTrack) => {
    setSelectedTrack(track);
    setSongTitle(track.title);
    setSongArtist(track.artist);
    setSongYear(track.year ? String(track.year) : "");
    setPreviewUrl(
      `https://w.soundcloud.com/player/?url=${encodeURIComponent(track.url)}&auto_play=false&show_artwork=true&show_comments=false&show_playcount=false&hide_related=true&visual=false`,
    );
    setStep("configure");
  }, []);

  // ── Save puzzle ────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!selectedTrack || !songTitle || !songArtist || !songYear) {
      setError("Need title, artist, and year");
      return;
    }
    setStep("saving");
    setError("");

    try {
      const res = await fetch("/api/admin/heardle/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soundcloudUrl: selectedTrack.url,
          title: songTitle,
          artist: songArtist,
          year: parseInt(songYear),
          date: puzzleDate,
          variant,
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
  }, [selectedTrack, songTitle, songArtist, songYear, puzzleDate, variant]);

  // ── Reset ──────────────────────────────────────────────────────────────
  const reset = () => {
    setStep("search");
    setTracks([]);
    setSelectedTrack(null);
    setSavedResult(null);
    setError("");
    setSongTitle("");
    setSongArtist("");
    setSongYear("");
    setPreviewUrl("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Heardle Puzzle Builder
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Search SoundCloud for a song, preview it, and save as a puzzle.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {step !== "search" && (
              <button
                onClick={reset}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Start over
              </button>
            )}
            <a
              href="/admin"
              className="text-sm font-medium text-purple hover:opacity-80 transition-opacity"
            >
              &larr; Back to Admin
            </a>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-8">
          {(["search", "pick-track", "configure", "done"] as const).map(
            (s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    getStepIndex(step) >= i ? "bg-purple" : "bg-gray-200"
                  }`}
                />
              </div>
            ),
          )}
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
              Search for a song on SoundCloud
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder='e.g. "Bohemian Rhapsody Queen", "Billie Jean"...'
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

        {/* ── Step: Pick Track ─────────────────────────────────────────── */}
        {step === "pick-track" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Pick a track
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({tracks.length} results)
              </span>
            </h2>
            <div className="space-y-3">
              {tracks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTrack(t)}
                  className="w-full flex items-center gap-4 rounded-xl border-2 border-gray-100
                             p-3 text-left hover:border-purple hover:bg-purple/5 transition-all"
                >
                  {t.artwork && (
                    <img
                      src={t.artwork}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">
                      {t.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {t.artist} &middot; {formatDuration(t.durationMs)}
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

        {/* ── Step: Configure ──────────────────────────────────────────── */}
        {step === "configure" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm max-w-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Configure puzzle
            </h2>

            {/* SoundCloud preview player */}
            {previewUrl && (
              <div className="mb-6 rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  width="100%"
                  height="166"
                  allow="autoplay"
                  className="border-0"
                  title="SoundCloud Preview"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Song Title
                </label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
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
                  onChange={(e) => setSongArtist(e.target.value)}
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

              {/* SoundCloud URL (read-only) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  SoundCloud URL
                </label>
                <input
                  type="text"
                  value={selectedTrack?.url || ""}
                  readOnly
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm font-mono
                             bg-gray-50 text-gray-500"
                />
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
                onClick={() => setStep("pick-track")}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                &larr; Pick a different track
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

            {selectedTrack && (
              <div className="inline-flex items-center gap-2 bg-purple/10 text-purple rounded-full px-4 py-2 text-sm font-medium mb-6">
                <span>🎧</span>
                <span className="truncate max-w-xs">{selectedTrack.url}</span>
              </div>
            )}

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

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getStepIndex(step: Step): number {
  const map: Record<Step, number> = {
    search: 0,
    "pick-track": 1,
    configure: 2,
    saving: 3,
    done: 3,
  };
  return map[step];
}
