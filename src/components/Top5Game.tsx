"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Top5Puzzle, Top5Item } from "@/types/top5";
import { useReorder } from "@/lib/use-reorder";
import { shareOrCopy } from "@/lib/share";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";
import StatsButton from "@/components/StatsButton";

type Screen = "splash" | "playing" | "results";

const STORAGE_KEY = "top5-streak";

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

export default function Top5Game({ puzzle }: { puzzle: Top5Puzzle }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [shared, setShared] = useState(false);
  const [streak, setStreak] = useState(0);

  // Correct order is the original items array
  const correctOrder = puzzle.items;

  // Shuffled order for playing
  const initialOrder = useMemo(
    () => shuffleWithSeed(puzzle.items, puzzle.id + puzzle.puzzle_date),
    [puzzle.items, puzzle.id, puzzle.puzzle_date]
  );

  const [order, setOrder] = useState<Top5Item[]>(initialOrder);
  const [scores, setScores] = useState<number[] | null>(null);
  const [kbFocusIdx, setKbFocusIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const [showStats, setShowStats] = useState(false);

  const { stats, recordGame } = useGameStats("top-5", puzzle.puzzle_date);

  useEffect(() => {
    const s = loadStreak();
    setStreak(s.current);
  }, []);

  useEffect(() => {
    if (screen === "results" && scores) {
      const total = scores.reduce((a, b) => a + b, 0);
      recordGame(total >= 6, total);
      setTimeout(() => setShowStats(true), 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const {
    containerRef,
    activeIndex,
    overIndex,
    selectedIndex,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTap,
  } = useReorder(order, setOrder);

  // Keyboard reordering: focus item with Up/Down, Shift+Up/Down to move item
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
          if (prev >= order.length - 1) return prev;
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
          if (prev <= 0) return prev;
          setOrder((o) => {
            const next = [...o];
            [next[prev], next[prev - 1]] = [next[prev - 1], next[prev]];
            return next;
          });
          return prev - 1;
        });
      }
    },
    [order.length]
  );

  const handleSubmit = useCallback(() => {
    const s: number[] = order.map((item, i) => {
      const correctIdx = correctOrder.findIndex(
        (c) => c.name === item.name
      );
      const diff = Math.abs(correctIdx - i);
      if (diff === 0) return 2;
      if (diff === 1) return 1;
      return 0;
    });
    setScores(s);
    setScreen("results");

    // Streak
    const streakData = loadStreak();
    const total = s.reduce((a, b) => a + b, 0);
    if (total >= 6) {
      const newStreak = isConsecutiveDay(streakData.lastDate, puzzle.puzzle_date)
        ? streakData.current + 1
        : 1;
      saveStreak({ current: newStreak, lastDate: puzzle.puzzle_date });
      setStreak(newStreak);
    } else {
      saveStreak({ current: 0, lastDate: puzzle.puzzle_date });
      setStreak(0);
    }
  }, [order, correctOrder, puzzle.puzzle_date]);

  const handleShare = useCallback(async () => {
    if (!scores) return;
    const total = scores.reduce((a, b) => a + b, 0);
    const emoji = scores
      .map((s) => (s === 2 ? "\uD83D\uDFE9" : s === 1 ? "\uD83D\uDFE8" : "\uD83D\uDFE5"))
      .join("");

    const text = `Top 5 \u2014 ${puzzle.puzzle_date}\n"${puzzle.category}"\n${emoji}\nScore: ${total}/10\ngamesite.app/daily/top-5`;

    const ok = await shareOrCopy(text);
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [scores, puzzle.puzzle_date, puzzle.category]);

  // ── Splash ────────────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-8 animate-[fade-up_0.5s_ease_forwards]">
        <h1 className="font-body text-5xl font-extrabold text-text-primary tracking-tight mb-3">
          <span className="bg-gradient-to-r from-amber to-coral bg-clip-text text-transparent">
            Top 5
          </span>
        </h1>
        <p className="text-text-muted text-base mb-2">{puzzle.puzzle_date}</p>
        <p className="text-text-dim text-sm mb-8 max-w-xs text-center">
          Rank five items in the correct order. Drag to reorder or tap two items
          to swap, then submit.
        </p>
        <button
          onClick={() => setScreen("playing")}
          className="bg-gradient-to-br from-amber to-coral text-white border-none
                     px-10 py-4 rounded-full text-lg font-bold cursor-pointer
                     shadow-[0_4px_24px_rgba(247,183,49,0.3)]
                     hover:scale-105 hover:shadow-[0_6px_32px_rgba(247,183,49,0.5)]
                     transition-all duration-200"
        >
          Start
        </button>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────
  if (screen === "results" && scores) {
    const total = scores.reduce((a, b) => a + b, 0);
    let remark = "Better luck next time!";
    if (total === 10) remark = "Perfect ranking!";
    else if (total >= 8) remark = "Almost perfect!";
    else if (total >= 6) remark = "Solid knowledge!";

    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-8 animate-[fade-up_0.5s_ease_forwards]">
        <h2 className="font-body text-4xl font-extrabold text-text-primary mb-2">
          {remark}
        </h2>
        <p className="text-text-muted text-lg mb-2">
          <span className="text-amber font-bold">{total}/10</span> points
        </p>
        <p className="text-text-dim text-sm mb-6">
          &ldquo;{puzzle.category}&rdquo;
        </p>

        {streak > 0 && (
          <p className="text-amber font-semibold text-sm mb-4">
            {streak} day streak!
          </p>
        )}

        {/* Answer breakdown */}
        <div className="w-full max-w-md mb-8 space-y-2">
          {correctOrder.map((item, i) => {
            const userItem = order[i];
            const score = scores[i];
            const bg =
              score === 2
                ? "bg-teal/15 border-teal/40"
                : score === 1
                  ? "bg-amber/15 border-amber/40"
                  : "bg-coral/15 border-coral/40";
            const badge =
              score === 2
                ? "bg-teal/20 text-teal"
                : score === 1
                  ? "bg-amber/20 text-amber"
                  : "bg-coral/20 text-coral";

            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${bg}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${badge}`}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary text-sm font-semibold">
                    {item.name}
                  </p>
                  <p className="text-text-dim text-xs">{item.value}</p>
                </div>
                {userItem.name !== item.name && (
                  <p className="text-text-dim text-xs shrink-0">
                    You: {userItem.name}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleShare}
          className="bg-gradient-to-br from-amber to-coral text-white border-none
                     px-8 py-3 rounded-full text-base font-bold cursor-pointer
                     shadow-[0_4px_16px_rgba(247,183,49,0.3)]
                     hover:scale-105 transition-all duration-200"
        >
          {shared ? "Copied!" : "Share Results"}
        </button>

        <button
          onClick={() => setShowStats(true)}
          className="bg-surface text-text-muted border-[1.5px] border-border-light
                     rounded-full px-8 py-3 text-base font-bold cursor-pointer
                     transition-all hover:bg-surface-hover hover:text-text-secondary mt-3"
        >
          View Stats
        </button>

        <StatsModal
          open={showStats}
          onClose={() => setShowStats(false)}
          stats={stats}
          gameName="Top 5"
          color="amber"
        />
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-8">
      <h2 className="font-body text-2xl sm:text-3xl font-extrabold text-text-primary mb-2 text-center">
        {puzzle.category}
      </h2>
      <p className="text-text-dim text-sm mb-6">
        Rank from #1 (highest) to #5 (lowest)
      </p>

      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        role="listbox"
        aria-label="Ranking list — use Arrow keys to navigate, Shift+Arrow to reorder"
        tabIndex={0}
        onKeyDown={handleListKeyDown}
        className="w-full max-w-md space-y-2 mb-8 outline-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {order.map((item, i) => {
          const isDragging = activeIndex === i;
          const isOver = overIndex === i && activeIndex !== null && activeIndex !== i;
          const isSelected = selectedIndex === i;
          const isKbFocused = kbFocusIdx === i;

          return (
            <div
              key={item.name}
              role="option"
              aria-selected={isSelected || isKbFocused}
              aria-label={`Position ${i + 1}: ${item.name}`}
              onPointerDown={(e) => handlePointerDown(i, e)}
              onClick={() => handleTap(i)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-4 cursor-grab select-none
                         transition-all duration-150
                         ${isDragging ? "opacity-50 scale-95" : ""}
                         ${isOver ? "border-amber shadow-md" : "border-border-light"}
                         ${isSelected ? "border-amber bg-amber/10 ring-2 ring-amber/30" : "bg-surface/80"}
                         ${isKbFocused && !isSelected ? "ring-2 ring-sky/50" : ""}
                         hover:bg-surface-hover active:scale-[0.98]`}
              style={{ touchAction: "none" }}
            >
              <div className="w-8 h-8 rounded-full bg-amber/15 text-amber flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </div>
              <span className="text-text-primary font-medium text-base">
                {item.name}
              </span>
              <div className="ml-auto text-text-dim/40">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="5" cy="3" r="1.5" />
                  <circle cx="11" cy="3" r="1.5" />
                  <circle cx="5" cy="8" r="1.5" />
                  <circle cx="11" cy="8" r="1.5" />
                  <circle cx="5" cy="13" r="1.5" />
                  <circle cx="11" cy="13" r="1.5" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        className="bg-gradient-to-br from-amber to-coral text-white border-none
                   px-10 py-4 rounded-full text-lg font-bold cursor-pointer
                   shadow-[0_4px_24px_rgba(247,183,49,0.3)]
                   hover:scale-105 hover:shadow-[0_6px_32px_rgba(247,183,49,0.5)]
                   transition-all duration-200"
      >
        Submit Ranking
      </button>
    </div>
  );
}
