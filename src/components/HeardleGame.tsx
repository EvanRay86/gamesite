"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { songBank, CLIP_DURATIONS, type HeardlePuzzle } from "@/lib/heardle-puzzles";
import { shareOrCopy } from "@/lib/share";

const MAX_GUESSES = 6;
const SC_WIDGET_API = "https://w.soundcloud.com/player/api.js";

interface Props {
  puzzle: HeardlePuzzle;
  variant?: string;
}

// SoundCloud Widget API types
interface SCWidget {
  bind(event: string, callback: (...args: unknown[]) => void): void;
  unbind(event: string): void;
  play(): void;
  pause(): void;
  seekTo(ms: number): void;
  getPosition(callback: (pos: number) => void): void;
  getDuration(callback: (dur: number) => void): void;
}

interface SCWidgetStatic {
  (iframe: HTMLIFrameElement): SCWidget;
  Events: {
    READY: string;
    PLAY: string;
    PAUSE: string;
    PLAY_PROGRESS: string;
    FINISH: string;
  };
}

declare global {
  interface Window {
    SC?: { Widget: SCWidgetStatic };
  }
}

export default function HeardleGame({ puzzle, variant }: Props) {
  const [currentStage, setCurrentStage] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [showSplash, setShowSplash] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [widgetReady, setWidgetReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SCWidget | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  // Load SoundCloud Widget API script
  useEffect(() => {
    if (document.querySelector(`script[src="${SC_WIDGET_API}"]`)) return;
    const script = document.createElement("script");
    script.src = SC_WIDGET_API;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Initialize widget once iframe and API are both loaded
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const initWidget = () => {
      if (!window.SC?.Widget) return;
      const widget = window.SC.Widget(iframe);
      widgetRef.current = widget;

      widget.bind(window.SC.Widget.Events.READY, () => {
        setWidgetReady(true);
      });

      widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, ((...args: unknown[]) => {
        const data = args[0] as { currentPosition: number; relativePosition: number };
        const posSeconds = data.currentPosition / 1000;
        setPlayProgress(posSeconds);
      }));

      widget.bind(window.SC.Widget.Events.PAUSE, () => {
        setIsPlaying(false);
      });

      widget.bind(window.SC.Widget.Events.FINISH, () => {
        setIsPlaying(false);
        setPlayProgress(0);
      });
    };

    // Wait for SC API to be available
    if (window.SC?.Widget) {
      initWidget();
    } else {
      const check = setInterval(() => {
        if (window.SC?.Widget) {
          clearInterval(check);
          initWidget();
        }
      }, 100);
      return () => clearInterval(check);
    }
  }, [showSplash]);

  // Cleanup stop timer on unmount
  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  const currentDuration = CLIP_DURATIONS[currentStage];
  const fullDuration = CLIP_DURATIONS[CLIP_DURATIONS.length - 1];

  // Filter song suggestions
  const suggestions = useMemo(() => {
    if (inputValue.length < 1) return [];
    const lower = inputValue.toLowerCase();
    return songBank
      .filter(
        (s) =>
          s.toLowerCase().includes(lower) &&
          !guesses.includes(s),
      )
      .slice(0, 6);
  }, [inputValue, guesses]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const stopAudio = useCallback(() => {
    const widget = widgetRef.current;
    if (!widget) return;
    widget.pause();
    widget.seekTo(0);
    setIsPlaying(false);
    setPlayProgress(0);
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  const playClip = useCallback(() => {
    const widget = widgetRef.current;
    if (!widget || !widgetReady) return;

    stopAudio();
    widget.seekTo(0);

    const maxTime = gameState !== "playing" ? fullDuration : currentDuration;

    // Small delay to let seekTo settle before playing
    setTimeout(() => {
      widget.play();
      setIsPlaying(true);

      // Schedule pause after clip duration
      stopTimerRef.current = setTimeout(() => {
        widget.pause();
        widget.seekTo(0);
        setIsPlaying(false);
        setPlayProgress(0);
      }, maxTime * 1000);
    }, 50);
  }, [currentDuration, fullDuration, gameState, stopAudio, widgetReady]);

  const formatAnswer = (p: HeardlePuzzle) => `${p.title} – ${p.artist}`;

  const submitGuess = useCallback(
    (guess: string) => {
      if (gameState !== "playing") return;
      const trimmed = guess.trim();
      if (!trimmed || guesses.includes(trimmed)) return;

      stopAudio();

      const newGuesses = [...guesses, trimmed];
      setGuesses(newGuesses);
      setInputValue("");
      setShowDropdown(false);

      // Check win — match on "Title – Artist" or just the title
      const answer = formatAnswer(puzzle);
      const isCorrect =
        trimmed.toLowerCase() === answer.toLowerCase() ||
        trimmed.toLowerCase() === puzzle.title.toLowerCase();

      if (isCorrect) {
        setGameState("won");
        return;
      }

      if (newGuesses.length >= MAX_GUESSES) {
        setGameState("lost");
        return;
      }

      // Reveal longer clip
      setCurrentStage((prev) => Math.min(prev + 1, MAX_GUESSES - 1));
    },
    [gameState, guesses, puzzle, stopAudio],
  );

  const skipGuess = useCallback(() => {
    if (gameState !== "playing") return;

    stopAudio();

    const newGuesses = [...guesses, "⏭ Skipped"];
    setGuesses(newGuesses);

    if (newGuesses.length >= MAX_GUESSES) {
      setGameState("lost");
      return;
    }

    setCurrentStage((prev) => Math.min(prev + 1, MAX_GUESSES - 1));
  }, [gameState, guesses, stopAudio]);

  const generateShareText = useCallback(() => {
    const guessCount = gameState === "won" ? guesses.length : "X";
    const squares: string[] = guesses.map((g) => {
      const answer = formatAnswer(puzzle);
      const isCorrect =
        g.toLowerCase() === answer.toLowerCase() ||
        g.toLowerCase() === puzzle.title.toLowerCase();
      return isCorrect ? "🟩" : g === "⏭ Skipped" ? "⬜" : "🟥";
    });
    while (squares.length < MAX_GUESSES) squares.push("⬛");

    const variantLabel = variant && variant !== "all" ? ` (${variant})` : "";
    return `🎵 Heardle${variantLabel} — ${guessCount}/${MAX_GUESSES}\n${squares.join("")}\ngamesite.app/daily/heardle`;
  }, [gameState, guesses, puzzle, variant]);

  const handleShare = useCallback(async () => {
    const text = generateShareText();
    const ok = await shareOrCopy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generateShareText]);

  const variantLabel = variant && variant !== "all"
    ? variant.charAt(0).toUpperCase() + variant.slice(1)
    : null;

  const isFinished = gameState !== "playing";

  // Build SoundCloud embed URL
  const scEmbedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(puzzle.soundcloudUrl)}&auto_play=false&buying=false&liking=false&download=false&sharing=false&show_artwork=false&show_comments=false&show_playcount=false&show_user=false&hide_related=true&visual=false&start_track=0&callback=true`;

  // Splash screen
  if (showSplash) {
    return (
      <div
        className={`flex min-h-[80vh] flex-col items-center justify-center px-4 transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
      >
        <div className="bg-white rounded-2xl shadow-lg border border-border-light p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎵</div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Heardle</h1>
          {variantLabel && (
            <span className="inline-block text-xs font-semibold text-purple bg-purple/10 rounded-full px-3 py-1 mb-3">
              {variantLabel}
            </span>
          )}
          <p className="text-text-muted text-sm mb-6">
            Name the song from its opening seconds. You get 6 guesses —
            each wrong guess or skip unlocks a longer clip.
          </p>

          <div className="space-y-3 text-left text-sm text-text-secondary mb-6">
            <div className="flex items-start gap-3">
              <span className="font-bold text-purple">1.</span>
              <span>Listen to the intro and guess the song</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-purple">2.</span>
              <span>Wrong? A longer clip is unlocked</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-purple">3.</span>
              <span>Guess in as few tries as possible</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 mb-6">
            {CLIP_DURATIONS.map((d, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="bg-purple/20 rounded-sm"
                  style={{ width: 16 + i * 8, height: 8 }}
                />
                <span className="text-[10px] text-text-dim mt-1">{d}s</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowSplash(false)}
            className="w-full bg-purple text-white font-bold rounded-full py-3 text-sm
                       hover:opacity-90 transition-opacity"
          >
            Play
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-[80vh] flex-col items-center px-4 py-8 transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
    >
      {/* Hidden SoundCloud widget iframe */}
      <iframe
        ref={iframeRef}
        src={scEmbedUrl}
        width="0"
        height="0"
        allow="autoplay"
        className="absolute opacity-0 pointer-events-none"
        title="SoundCloud Player"
      />

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Heardle
              {variantLabel && (
                <span className="ml-2 text-sm font-semibold text-purple">
                  {variantLabel}
                </span>
              )}
            </h1>
          </div>
          <div className="text-sm text-text-muted font-medium tabular-nums">
            {currentStage + 1} / {MAX_GUESSES}
          </div>
        </div>

        {/* Audio Player */}
        <div className="rounded-xl border-2 border-border-light bg-white p-5 mb-4 shadow-lg">
          {/* Progress bar background showing all clip stages */}
          <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden mb-3">
            {/* Stage markers */}
            {CLIP_DURATIONS.map((d, i) => (
              <div
                key={i}
                className={`absolute top-0 bottom-0 border-r border-white/60 transition-colors duration-300 ${
                  i <= currentStage || isFinished
                    ? "bg-purple/20"
                    : "bg-gray-100"
                }`}
                style={{
                  left: i === 0 ? 0 : `${(CLIP_DURATIONS[i - 1] / fullDuration) * 100}%`,
                  width: `${((d - (i === 0 ? 0 : CLIP_DURATIONS[i - 1])) / fullDuration) * 100}%`,
                }}
              />
            ))}

            {/* Playback progress */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-purple/40 transition-[width] duration-100"
              style={{
                width: `${(playProgress / fullDuration) * 100}%`,
              }}
            />

            {/* Current clip limit indicator */}
            {!isFinished && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-purple"
                style={{
                  left: `${(currentDuration / fullDuration) * 100}%`,
                }}
              />
            )}

            {/* Stage duration labels */}
            <div className="absolute inset-0 flex items-center">
              {CLIP_DURATIONS.map((d, i) => (
                <div
                  key={i}
                  className={`flex-none text-center text-[10px] font-bold ${
                    i <= currentStage || isFinished ? "text-purple" : "text-text-dim"
                  }`}
                  style={{
                    width: `${((d - (i === 0 ? 0 : CLIP_DURATIONS[i - 1])) / fullDuration) * 100}%`,
                  }}
                >
                  {d}s
                </div>
              ))}
            </div>
          </div>

          {/* Play button */}
          <button
            onClick={isPlaying ? stopAudio : playClip}
            disabled={!widgetReady}
            className="w-full flex items-center justify-center gap-2 bg-purple text-white font-bold
                       rounded-full py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {!widgetReady ? (
              "Loading audio..."
            ) : isPlaying ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="3" y="2" width="4" height="12" rx="1" />
                  <rect x="9" y="2" width="4" height="12" rx="1" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2l10 6-10 6V2z" />
                </svg>
                {isFinished ? "Play full clip" : `Play ${currentDuration}s`}
              </>
            )}
          </button>
        </div>

        {/* Game finished state */}
        {isFinished && (
          <div className="bg-white rounded-xl border border-border-light p-5 mb-4 text-center shadow-sm">
            {gameState === "won" ? (
              <>
                <div className="text-3xl mb-2">🎉</div>
                <h2 className="text-lg font-bold text-text-primary">
                  You got it!
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  <span className="font-semibold text-text-primary">
                    {puzzle.title}
                  </span>{" "}
                  by{" "}
                  <span className="font-semibold text-text-primary">
                    {puzzle.artist}
                  </span>{" "}
                  ({puzzle.year}) — guessed in{" "}
                  <span className="font-bold text-purple">{guesses.length}</span>{" "}
                  {guesses.length === 1 ? "try" : "tries"}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">😔</div>
                <h2 className="text-lg font-bold text-text-primary">
                  Better luck tomorrow!
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  The answer was{" "}
                  <span className="font-semibold text-text-primary">
                    {puzzle.title}
                  </span>{" "}
                  by{" "}
                  <span className="font-semibold text-text-primary">
                    {puzzle.artist}
                  </span>{" "}
                  ({puzzle.year})
                </p>
              </>
            )}

            {/* Guess history squares */}
            <div className="flex items-center justify-center gap-1 mt-3">
              {guesses.map((g, i) => {
                const answer = formatAnswer(puzzle);
                const isCorrect =
                  g.toLowerCase() === answer.toLowerCase() ||
                  g.toLowerCase() === puzzle.title.toLowerCase();
                return (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-sm ${
                      isCorrect
                        ? "bg-purple text-white"
                        : g === "⏭ Skipped"
                          ? "bg-gray-300 text-white"
                          : "bg-red-400 text-white"
                    }`}
                  >
                    {isCorrect ? "✓" : g === "⏭ Skipped" ? "–" : "✗"}
                  </div>
                );
              })}
              {Array.from({ length: MAX_GUESSES - guesses.length }).map(
                (_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-8 h-8 rounded-md bg-gray-200"
                  />
                ),
              )}
            </div>

            <button
              onClick={handleShare}
              className="mt-4 bg-purple text-white font-bold rounded-full px-6 py-2.5 text-sm
                         hover:opacity-90 transition-opacity"
            >
              {copied ? "Copied!" : "Share result"}
            </button>
          </div>
        )}

        {/* Input area — only while playing */}
        {!isFinished && (
          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() => {
                    if (inputValue.length > 0) setShowDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && suggestions.length > 0) {
                      submitGuess(suggestions[0]);
                    }
                  }}
                  placeholder="Search for a song..."
                  className="w-full rounded-xl border-2 border-border-light bg-white px-4 py-3 text-sm
                             text-text-primary placeholder-text-dim
                             focus:border-purple focus:outline-none transition-colors"
                />

                {/* Dropdown */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-border-light shadow-lg z-20 overflow-hidden">
                    {suggestions.map((song) => (
                      <button
                        key={song}
                        onClick={() => submitGuess(song)}
                        className="w-full text-left px-4 py-2.5 text-sm text-text-primary
                                   hover:bg-purple/10 transition-colors border-b border-border-light last:border-0"
                      >
                        {song}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={skipGuess}
                className="rounded-xl border-2 border-border-light bg-white px-4 py-3 text-sm font-semibold
                           text-text-muted hover:border-purple hover:text-purple transition-colors"
                title="Skip — unlock longer clip"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Guess history */}
        {guesses.length > 0 && !isFinished && (
          <div className="mt-4 space-y-1.5">
            {guesses.map((guess, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  guess === "⏭ Skipped"
                    ? "bg-gray-100 text-text-dim italic"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <span className="font-bold text-xs w-5">{i + 1}.</span>
                <span>{guess}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
