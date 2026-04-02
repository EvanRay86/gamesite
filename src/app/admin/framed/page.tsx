"use client";

import { useState, useCallback } from "react";

interface TrailerResult {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  channel: string;
}

type Step = "search" | "pick-trailer" | "extracting" | "pick-frames" | "configure" | "saving" | "done";

const VARIANTS = ["all", "action", "horror", "2000s", "sci-fi", "animated", "comedy"];

export default function AdminFramedPage() {
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [trailers, setTrailers] = useState<TrailerResult[]>([]);
  const [selectedTrailer, setSelectedTrailer] = useState<TrailerResult | null>(null);

  // Frame extraction
  const [sessionId, setSessionId] = useState("");
  const [candidateFrames, setCandidateFrames] = useState<string[]>([]);
  const [selectedFrames, setSelectedFrames] = useState<string[]>([]);

  // Puzzle config
  const [movieTitle, setMovieTitle] = useState("");
  const [movieYear, setMovieYear] = useState("");
  const [puzzleDate, setPuzzleDate] = useState(getTodayISO());
  const [variant, setVariant] = useState("all");
  const [movieSlug, setMovieSlug] = useState("");

  // Result
  const [savedResult, setSavedResult] = useState<{ framePaths: string[]; message: string; dateChanged?: boolean; assignedDate?: string } | null>(null);
  const [error, setError] = useState("");

  // ── Search ──────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/trailer/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrailers(data);
      setStep("pick-trailer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // ── Extract frames ──────────────────────────────────────────────────────
  const handleExtract = useCallback(async (trailer: TrailerResult) => {
    setSelectedTrailer(trailer);
    setStep("extracting");
    setError("");

    // Pre-fill movie info from trailer title
    const titleMatch = trailer.title.match(/^(.+?)\s*[\(\[]/);
    const yearMatch = trailer.title.match(/\((\d{4})\)/);
    if (titleMatch) setMovieTitle(titleMatch[1].replace(/\s*(Official\s*)?Trailer.*/i, "").trim());
    else setMovieTitle(trailer.title.replace(/\s*(Official\s*)?Trailer.*/i, "").replace(/\s*[\(\[].*/, "").trim());
    if (yearMatch) setMovieYear(yearMatch[1]);

    try {
      const res = await fetch("/api/admin/trailer/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trailer.url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSessionId(data.sessionId);
      setCandidateFrames(data.frames);
      setSelectedFrames([]);
      setStep("pick-frames");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
      setStep("pick-trailer");
    }
  }, []);

  // ── Toggle frame selection ──────────────────────────────────────────────
  const toggleFrame = useCallback((filename: string) => {
    setSelectedFrames((prev) => {
      if (prev.includes(filename)) {
        return prev.filter((f) => f !== filename);
      }
      if (prev.length >= 6) return prev;
      return [...prev, filename];
    });
  }, []);

  // ── Save puzzle ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const slug = movieSlug || slugify(movieTitle);
    if (!movieTitle || !movieYear || selectedFrames.length !== 6) {
      setError("Need title, year, and exactly 6 frames");
      return;
    }
    setStep("saving");
    setError("");

    try {
      const res = await fetch("/api/admin/framed/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          selectedFrames,
          title: movieTitle,
          year: parseInt(movieYear),
          date: puzzleDate,
          variant,
          movieSlug: slug,
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
  }, [sessionId, selectedFrames, movieTitle, movieYear, puzzleDate, variant, movieSlug]);

  // ── Reset ───────────────────────────────────────────────────────────────
  const reset = () => {
    setStep("search");
    setTrailers([]);
    setSelectedTrailer(null);
    setCandidateFrames([]);
    setSelectedFrames([]);
    setSavedResult(null);
    setError("");
    setMovieTitle("");
    setMovieYear("");
    setMovieSlug("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Framed Puzzle Builder</h1>
            <p className="text-sm text-gray-500 mt-1">
              Search for a movie trailer, extract frames, pick 6, and save as a puzzle.
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
          {(["search", "pick-trailer", "pick-frames", "configure", "done"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  getStepIndex(step) >= i ? "bg-green" : "bg-gray-200"
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">Search for a movie trailer</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. The Dark Knight, Inception, Pulp Fiction..."
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm
                           focus:border-green focus:outline-none transition-colors"
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="bg-green text-white font-bold rounded-xl px-6 py-3 text-sm
                           hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Pick Trailer ───────────────────────────────────────── */}
        {step === "pick-trailer" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Pick a trailer
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({trailers.length} results)
              </span>
            </h2>
            <div className="space-y-3">
              {trailers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleExtract(t)}
                  className="w-full flex items-center gap-4 rounded-xl border-2 border-gray-100
                             p-3 text-left hover:border-green hover:bg-green/5 transition-all"
                >
                  {t.thumbnail && (
                    <img
                      src={t.thumbnail}
                      alt=""
                      className="w-32 h-18 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{t.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {t.channel} &middot; {t.duration}
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
            <div className="animate-spin w-8 h-8 border-4 border-green border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Extracting frames...</h2>
            <p className="text-sm text-gray-500 mt-1">
              Downloading trailer and capturing frames. This takes 10-20 seconds.
            </p>
            {selectedTrailer && (
              <p className="text-xs text-gray-400 mt-2">{selectedTrailer.title}</p>
            )}
          </div>
        )}

        {/* ── Step: Pick Frames ────────────────────────────────────────── */}
        {step === "pick-frames" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Select 6 frames
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({selectedFrames.length}/6 selected)
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Click in order: hardest to guess → easiest to guess
                </p>
              </div>
              <button
                onClick={() => {
                  if (selectedFrames.length === 6) setStep("configure");
                }}
                disabled={selectedFrames.length !== 6}
                className="bg-green text-white font-bold rounded-xl px-5 py-2.5 text-sm
                           hover:opacity-90 transition-opacity disabled:opacity-30"
              >
                Next &rarr;
              </button>
            </div>

            {/* Selected frames preview */}
            {selectedFrames.length > 0 && (
              <div className="mb-4 p-3 bg-green/5 rounded-xl border border-green/20">
                <div className="text-xs font-semibold text-green mb-2">Selected order (hardest → easiest):</div>
                <div className="flex gap-2 overflow-x-auto">
                  {selectedFrames.map((f, i) => (
                    <div key={f} className="relative flex-shrink-0">
                      <img
                        src={`/api/admin/trailer/frame?session=${sessionId}&file=${f}`}
                        alt={`Frame ${i + 1}`}
                        className="w-24 h-14 rounded object-cover border-2 border-green"
                      />
                      <span className="absolute top-0.5 left-0.5 bg-green text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Frame grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {candidateFrames.map((f) => {
                const selIdx = selectedFrames.indexOf(f);
                const isSelected = selIdx !== -1;
                return (
                  <button
                    key={f}
                    onClick={() => toggleFrame(f)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all
                      ${isSelected
                        ? "border-green ring-2 ring-green/30 scale-[0.97]"
                        : "border-gray-200 hover:border-gray-400"
                      }`}
                  >
                    <img
                      src={`/api/admin/trailer/frame?session=${sessionId}&file=${f}`}
                      alt={f}
                      className="w-full aspect-video object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-green/20 flex items-center justify-center">
                        <span className="bg-green text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                          {selIdx + 1}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep("pick-trailer")}
              className="mt-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              &larr; Pick a different trailer
            </button>
          </div>
        )}

        {/* ── Step: Configure ──────────────────────────────────────────── */}
        {step === "configure" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm max-w-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Configure puzzle</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Movie Title
                </label>
                <input
                  type="text"
                  value={movieTitle}
                  onChange={(e) => {
                    setMovieTitle(e.target.value);
                    setMovieSlug(slugify(e.target.value));
                  }}
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm
                             focus:border-green focus:outline-none"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={movieYear}
                    onChange={(e) => setMovieYear(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm
                               focus:border-green focus:outline-none"
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
                               focus:border-green focus:outline-none"
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
                             focus:border-green focus:outline-none"
                >
                  {VARIANTS.map((v) => (
                    <option key={v} value={v}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
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
                  value={movieSlug || slugify(movieTitle)}
                  onChange={(e) => setMovieSlug(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm font-mono
                             focus:border-green focus:outline-none"
                />
              </div>
            </div>

            {/* Selected frames preview */}
            <div className="mt-6 p-3 bg-gray-50 rounded-xl">
              <div className="text-xs font-semibold text-gray-500 mb-2">Frames (hardest → easiest):</div>
              <div className="flex gap-2">
                {selectedFrames.map((f, i) => (
                  <img
                    key={f}
                    src={`/api/admin/trailer/frame?session=${sessionId}&file=${f}`}
                    alt={`Frame ${i + 1}`}
                    className="w-20 h-12 rounded object-cover border border-gray-200"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSave}
                className="bg-green text-white font-bold rounded-xl px-6 py-3 text-sm
                           hover:opacity-90 transition-opacity"
              >
                Save puzzle
              </button>
              <button
                onClick={() => setStep("pick-frames")}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                &larr; Back to frames
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Saving ─────────────────────────────────────────────── */}
        {step === "saving" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm text-center">
            <div className="animate-spin w-8 h-8 border-4 border-green border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Saving puzzle...</h2>
          </div>
        )}

        {/* ── Step: Done ───────────────────────────────────────────────── */}
        {step === "done" && savedResult && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
            <div className="text-4xl mb-3">🎬</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Puzzle saved!</h2>
            {savedResult.dateChanged && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-3 text-sm text-amber-800">
                The requested date was already taken — assigned to <strong>{savedResult.assignedDate}</strong> instead.
              </div>
            )}
            <p className="text-sm text-gray-600 mb-4">{savedResult.message}</p>

            <div className="flex gap-2 justify-center mb-6">
              {savedResult.framePaths.map((p, i) => (
                <img
                  key={p}
                  src={p}
                  alt={`Frame ${i + 1}`}
                  className="w-24 h-14 rounded-lg object-cover border border-gray-200"
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={reset}
                className="bg-green text-white font-bold rounded-xl px-6 py-3 text-sm
                           hover:opacity-90 transition-opacity"
              >
                Create another
              </button>
              <a
                href={`/daily/framed`}
                className="text-sm font-medium text-green hover:underline"
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

function getStepIndex(step: Step): number {
  const map: Record<Step, number> = {
    search: 0,
    "pick-trailer": 1,
    extracting: 2,
    "pick-frames": 2,
    configure: 3,
    saving: 4,
    done: 4,
  };
  return map[step];
}
