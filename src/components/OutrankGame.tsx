"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { OutrankItem, OutrankChallenge } from "@/types/outrank";
import {
  buildPoolByCategory,
  createRound,
  type OutrankPair,
} from "@/lib/outrank-engine";
import { OUTRANK_CATEGORIES, resolveCategorySet } from "@/lib/outrank-categories";
import { shareOrCopy, shareToX } from "@/lib/share";

const BRAND = "#45B7D1";
const BEST_KEY = "gamesite-outrank-best";
const NAME_KEY = "gamesite-outrank-name";
const REVEAL_MS = 1500;

type Phase = "intro" | "playing" | "gameover";
type Side = "left" | "right";

interface Props {
  pool: OutrankItem[];
  mode: "solo" | "challenge";
  challenge?: OutrankChallenge | null;
}

export default function OutrankGame({ pool, mode, challenge }: Props) {
  const poolByCat = useMemo(() => buildPoolByCategory(pool), [pool]);
  const categorySet = challenge?.categorySet ?? "mixed";
  const allowedCategories = useMemo(
    () => resolveCategorySet(categorySet),
    [categorySet],
  );

  const [phase, setPhase] = useState<Phase>("intro");
  const [pair, setPair] = useState<OutrankPair | null>(null);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<Side | null>(null);
  const [best, setBest] = useState(0);
  const [name, setName] = useState("");

  // Challenge-creation UI state
  const [shareId, setShareId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const roundRef = useRef<ReturnType<typeof createRound> | null>(null);
  const seedRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasContent = poolByCat.size > 0;

  useEffect(() => {
    try {
      const b = parseInt(localStorage.getItem(BEST_KEY) ?? "0", 10);
      if (Number.isFinite(b)) setBest(b);
      const n = localStorage.getItem(NAME_KEY);
      if (n) setName(n);
    } catch {
      /* ignore */
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startRun = useCallback(() => {
    const seed =
      mode === "challenge" && challenge
        ? challenge.seed >>> 0
        : Math.floor(Math.random() * 0x100000000) >>> 0;
    seedRef.current = seed;
    const round = createRound(seed, poolByCat, allowedCategories);
    roundRef.current = round;
    const first = round.next();
    setScore(0);
    setPicked(null);
    setShareId(null);
    setCopied(false);
    setPair(first);
    setPhase(first ? "playing" : "gameover");
  }, [mode, challenge, poolByCat, allowedCategories]);

  const finishRun = useCallback((finalScore: number) => {
    setBest((prev) => {
      if (finalScore > prev) {
        try {
          localStorage.setItem(BEST_KEY, String(finalScore));
        } catch {
          /* ignore */
        }
        return finalScore;
      }
      return prev;
    });
    setPhase("gameover");
  }, []);

  const onPick = useCallback(
    (side: Side) => {
      if (picked !== null || !pair) return;
      setPicked(side);

      const winnerSide: Side =
        pair.left.value > pair.right.value ? "left" : "right";
      const correct = side === winnerSide;

      timerRef.current = setTimeout(() => {
        if (!correct) {
          finishRun(score);
          return;
        }
        const nextScore = score + 1;
        setScore(nextScore);
        const next = roundRef.current?.next() ?? null;
        if (!next) {
          finishRun(nextScore);
          return;
        }
        setPair(next);
        setPicked(null);
      }, REVEAL_MS);
    },
    [picked, pair, score, finishRun],
  );

  const createChallenge = useCallback(async () => {
    if (creating) return;
    const trimmed = name.trim() || "Anonymous";
    setCreating(true);
    try {
      localStorage.setItem(NAME_KEY, trimmed);
    } catch {
      /* ignore */
    }
    try {
      const res = await fetch("/api/outrank/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          score,
          seed: seedRef.current,
          categorySet,
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setShareId(data.id);
        const link = `${window.location.origin}/arcade/outrank/d/${data.id}`;
        const text = `I got a ${score}-streak on Outrank! 🏆 Can you beat me? ${link}`;
        const ok = await shareOrCopy(text);
        if (ok) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setCreating(false);
    }
  }, [creating, name, score, categorySet]);

  const shareLink = shareId
    ? `${typeof window !== "undefined" ? window.location.origin : "https://gamesite.app"}/arcade/outrank/d/${shareId}`
    : "";
  const shareText = `I got a ${score}-streak on Outrank! 🏆 Can you beat me? ${shareLink}`;

  // ── Render ────────────────────────────────────────────────────────────────

  if (!hasContent) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-zinc-500">
        <h1 className="text-2xl font-bold mb-2">Outrank</h1>
        <p>This game isn&apos;t set up yet — no comparison data is available.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Header score={score} best={best} phase={phase} />

      {phase === "intro" && (
        <Intro mode={mode} challenge={challenge} best={best} onStart={startRun} />
      )}

      {phase === "playing" && pair && (
        <Board pair={pair} picked={picked} onPick={onPick} />
      )}

      {phase === "gameover" && (
        <GameOver
          mode={mode}
          challenge={challenge}
          score={score}
          best={best}
          name={name}
          setName={setName}
          creating={creating}
          shareId={shareId}
          shareLink={shareLink}
          copied={copied}
          onCreateChallenge={createChallenge}
          onShareX={() => shareToX(shareText)}
          onCopy={async () => {
            const ok = await shareOrCopy(shareText);
            if (ok) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }
          }}
          onPlayAgain={startRun}
        />
      )}
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────

function Header({
  score,
  best,
  phase,
}: {
  score: number;
  best: number;
  phase: Phase;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1
        className="text-3xl font-extrabold tracking-tight"
        style={{ color: BRAND }}
      >
        Outrank
      </h1>
      <div className="flex gap-4 text-sm font-semibold">
        {phase === "playing" && (
          <span className="text-zinc-700 dark:text-zinc-200">
            Streak: <span style={{ color: BRAND }}>{score}</span>
          </span>
        )}
        <span className="text-zinc-400">Best: {best}</span>
      </div>
    </div>
  );
}

function Intro({
  mode,
  challenge,
  best,
  onStart,
}: {
  mode: "solo" | "challenge";
  challenge?: OutrankChallenge | null;
  best: number;
  onStart: () => void;
}) {
  const isChallenge = mode === "challenge" && challenge;
  return (
    <div className="text-center py-12">
      {isChallenge ? (
        <>
          <p className="text-lg text-zinc-500 mb-1">
            {challenge!.challengerName} got a streak of
          </p>
          <p className="text-7xl font-extrabold mb-2" style={{ color: BRAND }}>
            {challenge!.challengerScore}
          </p>
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-8">
            Can you beat it?
          </p>
        </>
      ) : (
        <>
          <p className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
            Two things. One question: which is more?
          </p>
          <p className="text-zinc-500 mb-8">
            Keep picking the bigger one to build your streak.
            {best > 0 && ` Your best is ${best}.`}
          </p>
        </>
      )}
      <button
        onClick={onStart}
        className="px-10 py-4 rounded-full text-white text-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ background: BRAND }}
      >
        {isChallenge ? "Accept challenge" : "Start playing"}
      </button>
    </div>
  );
}

function Board({
  pair,
  picked,
  onPick,
}: {
  pair: OutrankPair;
  picked: Side | null;
  onPick: (side: Side) => void;
}) {
  const cat = OUTRANK_CATEGORIES[pair.category];
  const revealed = picked !== null;
  const winnerSide: Side = pair.left.value > pair.right.value ? "left" : "right";

  return (
    <div>
      <p className="text-center text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-5">
        {cat?.prompt ?? "Which is more?"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
        <Tile
          item={pair.left}
          side="left"
          revealed={revealed}
          isWinner={winnerSide === "left"}
          isPicked={picked === "left"}
          metricLabel={cat?.metricLabel ?? ""}
          format={cat?.format}
          onPick={onPick}
        />
        <Tile
          item={pair.right}
          side="right"
          revealed={revealed}
          isWinner={winnerSide === "right"}
          isPicked={picked === "right"}
          metricLabel={cat?.metricLabel ?? ""}
          format={cat?.format}
          onPick={onPick}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-zinc-800 shadow-md font-extrabold text-zinc-400 z-10"
        >
          VS
        </div>
      </div>
    </div>
  );
}

function Tile({
  item,
  side,
  revealed,
  isWinner,
  isPicked,
  metricLabel,
  format,
  onPick,
}: {
  item: OutrankItem;
  side: Side;
  revealed: boolean;
  isWinner: boolean;
  isPicked: boolean;
  metricLabel: string;
  format?: (v: number) => string;
  onPick: (side: Side) => void;
}) {
  const borderColor = revealed
    ? isWinner
      ? "#22C55E"
      : "#EF4444"
    : "transparent";

  return (
    <button
      onClick={() => onPick(side)}
      disabled={revealed}
      className="relative rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center text-center bg-white dark:bg-zinc-800 shadow-md transition-all disabled:cursor-default enabled:hover:scale-[1.02] enabled:hover:shadow-lg"
      style={{ border: `3px solid ${borderColor}` }}
    >
      {isPicked && (
        <span className="absolute top-3 right-3 text-xs font-bold text-zinc-400">
          YOUR PICK
        </span>
      )}
      <span className="text-6xl mb-3">{item.emoji ?? "❓"}</span>
      <span className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
        {item.label}
      </span>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-3"
          >
            <span className="block text-2xl font-extrabold" style={{ color: BRAND }}>
              {format ? format(item.value) : item.value}
            </span>
            <span className="block text-xs uppercase tracking-wide text-zinc-400">
              {metricLabel}
            </span>
            {item.blurb && (
              <span className="block text-sm text-zinc-500 mt-1 max-w-[18rem]">
                {item.blurb}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

function GameOver({
  mode,
  challenge,
  score,
  best,
  name,
  setName,
  creating,
  shareId,
  shareLink,
  copied,
  onCreateChallenge,
  onShareX,
  onCopy,
  onPlayAgain,
}: {
  mode: "solo" | "challenge";
  challenge?: OutrankChallenge | null;
  score: number;
  best: number;
  name: string;
  setName: (v: string) => void;
  creating: boolean;
  shareId: string | null;
  shareLink: string;
  copied: boolean;
  onCreateChallenge: () => void;
  onShareX: () => void;
  onCopy: () => void;
  onPlayAgain: () => void;
}) {
  const isChallenge = mode === "challenge" && challenge;
  const beat = isChallenge ? score > challenge!.challengerScore : false;
  const tie = isChallenge ? score === challenge!.challengerScore : false;

  return (
    <div className="text-center py-10 max-w-md mx-auto">
      {isChallenge ? (
        <div className="mb-8">
          <p className="text-5xl font-extrabold mb-3">
            {beat ? "🏆" : tie ? "🤝" : "😬"}
          </p>
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            {beat ? "You win!" : tie ? "Dead tie!" : "So close!"}
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-lg">
            <div>
              <div className="text-3xl font-extrabold" style={{ color: BRAND }}>
                {score}
              </div>
              <div className="text-xs text-zinc-400 uppercase">You</div>
            </div>
            <span className="text-zinc-300 font-bold">vs</span>
            <div>
              <div className="text-3xl font-extrabold text-zinc-500">
                {challenge!.challengerScore}
              </div>
              <div className="text-xs text-zinc-400 uppercase">
                {challenge!.challengerName}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <p className="text-lg text-zinc-500 mb-1">Your streak</p>
          <p className="text-7xl font-extrabold mb-1" style={{ color: BRAND }}>
            {score}
          </p>
          <p className="text-sm text-zinc-400">
            {score >= best && score > 0 ? "New personal best!" : `Best: ${best}`}
          </p>
        </div>
      )}

      {/* Challenge a friend */}
      {!shareId ? (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 mb-4">
          <p className="font-bold text-zinc-700 dark:text-zinc-200 mb-3">
            Challenge a friend to beat your {score}
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-center mb-3 focus:outline-none focus:ring-2"
            style={{ outlineColor: BRAND }}
          />
          <button
            onClick={onCreateChallenge}
            disabled={creating}
            className="w-full px-6 py-3 rounded-full text-white font-bold shadow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {creating ? "Creating link…" : "Create challenge link"}
          </button>
        </div>
      ) : (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 mb-4">
          <p className="font-bold text-zinc-700 dark:text-zinc-200 mb-2">
            {copied ? "Link copied! 🎉" : "Your challenge is ready"}
          </p>
          <div className="text-xs text-zinc-500 break-all bg-white dark:bg-zinc-900 rounded-lg px-3 py-2 mb-3">
            {shareLink}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCopy}
              className="flex-1 px-4 py-2.5 rounded-full font-semibold border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              onClick={onShareX}
              className="flex-1 px-4 py-2.5 rounded-full font-semibold text-white transition hover:opacity-90"
              style={{ background: "#000" }}
            >
              Share on X
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onPlayAgain}
        className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold underline underline-offset-4"
      >
        Play again
      </button>
    </div>
  );
}
