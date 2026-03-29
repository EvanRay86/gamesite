"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { TimelinePuzzle, TimelineEvent } from "@/types/timeline";
import { useReorder } from "@/lib/use-reorder";
import { shareOrCopy } from "@/lib/share";

type Screen = "splash" | "playing" | "results";

const MAX_ATTEMPTS = 3;
const STORAGE_KEY = "timeline-streak";

function loadStreak(): { current: number; lastDate: string } {
  if (typeof window === "undefined") return { current: 0, lastDate: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { current: 0, lastDate: "" };
}

function saveStreak(data: { current: number; lastDate: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function isConsecutiveDay(prev: string, next: string): boolean {
  const d1 = new Date(prev);
  const d2 = new Date(next);
  const diff = d2.getTime() - d1.getTime();
  return diff > 0 && diff <= 86400000 * 1.5;
}

function shuffleWithSeed<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    h = (h * 16807 + 0) | 0;
    const j = Math.abs(h) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function TimelineGame({ puzzle }: { puzzle: TimelinePuzzle }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [shared, setShared] = useState(false);
  const [streak, setStreak] = useState(0);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [won, setWon] = useState(false);
  const [lockedPositions, setLockedPositions] = useState<Set<number>>(
    new Set()
  );
  const [attemptResults, setAttemptResults] = useState<boolean[][]>([]);
  const [flashResults, setFlashResults] = useState<boolean[] | null>(null);

  const correctOrder = puzzle.events;

  const initialOrder = useMemo(
    () => shuffleWithSeed(puzzle.events, puzzle.id + puzzle.puzzle_date),
    [puzzle.events, puzzle.id, puzzle.puzzle_date]
  );

  const [order, setOrder] = useState<TimelineEvent[]>(initialOrder);
  const [kbFocusIdx, setKbFocusIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = loadStreak();
    setStreak(s.current);
  }, []);

  const {
    containerRef,
    activeIndex,
    overIndex,
    selectedIndex,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTap,
  } = useReorder(order, setOrder, { lockedIndices: lockedPositions });

  // Keyboard reordering: Arrow keys navigate, Shift+Arrow to move items (skips locked)
  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" && !e.shiftKey) {
        e.preventDefault();
        setKbFocusIdx((prev) => Math.min(prev + 1, order.length - 1));
      } else if (e.key === "ArrowUp" && !e.shiftKey) {
        e.preventDefault();
        setKbFocusIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "ArrowDown" && e.shiftKey) {
        e.preventDefault();
        setKbFocusIdx((prev) => {
          if (prev >= order.length - 1 || lockedPositions.has(prev) || lockedPositions.has(prev + 1)) return prev;
          setOrder((o) => {
            const next = [...o];
            [next[prev], next[prev + 1]] = [next[prev + 1], next[prev]];
            return next;
          });
          return prev + 1;
        });
      } else if (e.key === "ArrowUp" && e.shiftKey) {
        e.preventDefault();
        setKbFocusIdx((prev) => {
          if (prev <= 0 || lockedPositions.has(prev) || lockedPositions.has(prev - 1)) return prev;
          setOrder((o) => {
            const next = [...o];
            [next[prev], next[prev - 1]] = [next[prev - 1], next[prev]];
            return next;
          });
          return prev - 1;
        });
      }
    },
    [order.length, lockedPositions]
  );

  const handleCheck = useCallback(() => {
    // Check each position
    const results = order.map(
      (event, i) => event.description === correctOrder[i].description
    );
    const newAttemptResults = [...attemptResults, results];
    setAttemptResults(newAttemptResults);
    setFlashResults(results);

    // Lock correct positions
    const newLocked = new Set(lockedPositions);
    results.forEach((correct, i) => {
      if (correct) newLocked.add(i);
    });
    setLockedPositions(newLocked);

    const allCorrect = results.every(Boolean);
    const newAttemptsUsed = attemptsUsed + 1;
    setAttemptsUsed(newAttemptsUsed);

    // Clear flash after a moment
    setTimeout(() => {
      setFlashResults(null);

      if (allCorrect) {
        setWon(true);
        setScreen("results");
        const streakData = loadStreak();
        const newStreak = isConsecutiveDay(
          streakData.lastDate,
          puzzle.puzzle_date
        )
          ? streakData.current + 1
          : 1;
        saveStreak({ current: newStreak, lastDate: puzzle.puzzle_date });
        setStreak(newStreak);
      } else if (newAttemptsUsed >= MAX_ATTEMPTS) {
        setWon(false);
        setScreen("results");
        saveStreak({ current: 0, lastDate: puzzle.puzzle_date });
        setStreak(0);
      }
    }, 800);
  }, [
    order,
    correctOrder,
    attemptResults,
    lockedPositions,
    attemptsUsed,
    puzzle.puzzle_date,
  ]);

  const handleShare = useCallback(async () => {
    const lines = attemptResults.map((results) =>
      results
        .map((c) => (c ? "\uD83D\uDFE9" : "\uD83D\uDFE5"))
        .join("")
    );

    const status = won
      ? `Solved ${attemptsUsed}/${MAX_ATTEMPTS}`
      : `X/${MAX_ATTEMPTS}`;
    const text = `Timeline \u2014 ${puzzle.puzzle_date}\n${status}\n${lines.join("\n")}\ngamesite.app/daily/timeline`;

    const ok = await shareOrCopy(text);
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [attemptResults, won, attemptsUsed, puzzle.puzzle_date]);

  // ── Splash ────────────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-8 animate-[fade-up_0.5s_ease_forwards]">
        <h1 className="font-body text-5xl font-extrabold text-text-primary tracking-tight mb-3">
          <span className="bg-gradient-to-r from-teal to-sky bg-clip-text text-transparent">
            Timeline
          </span>
        </h1>
        <p className="text-text-muted text-base mb-2">{puzzle.puzzle_date}</p>
        <p className="text-text-dim text-sm mb-8 max-w-xs text-center">
          Put five events in chronological order. You have {MAX_ATTEMPTS}{" "}
          attempts. Correct positions lock in place.
        </p>
        <button
          onClick={() => setScreen("playing")}
          className="bg-gradient-to-br from-teal to-sky text-white border-none
                     px-10 py-4 rounded-full text-lg font-bold cursor-pointer
                     shadow-[0_4px_24px_rgba(78,205,196,0.3)]
                     hover:scale-105 hover:shadow-[0_6px_32px_rgba(78,205,196,0.5)]
                     transition-all duration-200"
        >
          Start
        </button>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────
  if (screen === "results") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-8 animate-[fade-up_0.5s_ease_forwards]">
        <h2 className="font-body text-4xl font-extrabold text-text-primary mb-2">
          {won ? "Timeline complete!" : "Better luck next time!"}
        </h2>
        {won && (
          <p className="text-text-muted text-lg mb-2">
            Solved in{" "}
            <span className="text-teal font-bold">
              {attemptsUsed}/{MAX_ATTEMPTS}
            </span>{" "}
            attempt{attemptsUsed > 1 ? "s" : ""}
          </p>
        )}

        {streak > 0 && (
          <p className="text-teal font-semibold text-sm mb-4">
            {streak} day streak!
          </p>
        )}

        {/* Attempt history */}
        <div className="w-full max-w-md mb-6">
          {attemptResults.map((results, ai) => (
            <div key={ai} className="flex items-center gap-2 mb-1">
              <span className="text-text-dim text-xs w-20">
                Attempt {ai + 1}:
              </span>
              <span className="text-base">
                {results
                  .map((c) => (c ? "\uD83D\uDFE9" : "\uD83D\uDFE5"))
                  .join("")}
              </span>
            </div>
          ))}
        </div>

        {/* Correct order with years */}
        <div className="w-full max-w-md mb-8 space-y-2">
          {correctOrder.map((event, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-teal/30 bg-teal/10 px-4 py-3"
            >
              <div className="w-14 text-teal font-bold text-sm shrink-0">
                {event.year}
              </div>
              <p className="text-text-primary text-sm">{event.description}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleShare}
          className="bg-gradient-to-br from-teal to-sky text-white border-none
                     px-8 py-3 rounded-full text-base font-bold cursor-pointer
                     shadow-[0_4px_16px_rgba(78,205,196,0.3)]
                     hover:scale-105 transition-all duration-200"
        >
          {shared ? "Copied!" : "Share Results"}
        </button>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="font-body text-xl font-bold text-text-primary">
          Order these events
        </h2>
        <span className="text-text-dim text-sm">
          Attempt {attemptsUsed + 1}/{MAX_ATTEMPTS}
        </span>
      </div>

      <p className="text-text-dim text-xs mb-4">
        Earliest at top, most recent at bottom
      </p>

      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        role="listbox"
        aria-label="Event list — use Arrow keys to navigate, Shift+Arrow to reorder"
        tabIndex={0}
        onKeyDown={handleListKeyDown}
        className="w-full max-w-md space-y-2 mb-8 outline-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {order.map((event, i) => {
          const isLocked = lockedPositions.has(i);
          const isDragging = activeIndex === i;
          const isOver =
            overIndex === i && activeIndex !== null && activeIndex !== i;
          const isSelected = selectedIndex === i;
          const isKbFocused = kbFocusIdx === i;

          const flashCorrect = flashResults?.[i] === true;
          const flashWrong = flashResults?.[i] === false;

          let borderClass = "border-border-light";
          let bgClass = "bg-surface/80";

          if (isLocked) {
            borderClass = "border-teal/40";
            bgClass = "bg-teal/10";
          } else if (flashCorrect) {
            borderClass = "border-teal/60";
            bgClass = "bg-teal/15";
          } else if (flashWrong) {
            borderClass = "border-coral/60";
            bgClass = "bg-coral/10";
          } else if (isOver) {
            borderClass = "border-teal shadow-md";
          } else if (isSelected) {
            borderClass = "border-teal ring-2 ring-teal/30";
            bgClass = "bg-teal/10";
          }

          return (
            <div
              key={event.description}
              role="option"
              aria-selected={isSelected || isKbFocused}
              aria-label={`Position ${i + 1}: ${event.description}${isLocked ? " (locked)" : ""}`}
              onPointerDown={(e) => handlePointerDown(i, e)}
              onClick={() => handleTap(i)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-4 select-none
                         transition-all duration-150
                         ${isDragging ? "opacity-50 scale-95" : ""}
                         ${borderClass} ${bgClass}
                         ${isKbFocused && !isSelected ? "ring-2 ring-sky/50" : ""}
                         ${isLocked ? "cursor-default" : "cursor-grab hover:bg-surface-hover active:scale-[0.98]"}`}
              style={{ touchAction: isLocked ? "auto" : "none" }}
            >
              {isLocked ? (
                <div className="w-7 h-7 rounded-full bg-teal/20 text-teal flex items-center justify-center shrink-0">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-text-dim/10 text-text-dim flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
              )}
              <span className="text-text-primary text-sm font-medium flex-1">
                {event.description}
              </span>
              {!isLocked && (
                <div className="text-text-dim/40 shrink-0">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <circle cx="5" cy="3" r="1.5" />
                    <circle cx="11" cy="3" r="1.5" />
                    <circle cx="5" cy="8" r="1.5" />
                    <circle cx="11" cy="8" r="1.5" />
                    <circle cx="5" cy="13" r="1.5" />
                    <circle cx="11" cy="13" r="1.5" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleCheck}
        disabled={flashResults !== null}
        className="bg-gradient-to-br from-teal to-sky text-white border-none
                   px-10 py-4 rounded-full text-lg font-bold cursor-pointer
                   shadow-[0_4px_24px_rgba(78,205,196,0.3)]
                   hover:scale-105 hover:shadow-[0_6px_32px_rgba(78,205,196,0.5)]
                   transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Check Order
      </button>
    </div>
  );
}
