"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  LetterTile,
  LetterScoreDetail,
  PowerUp,
  PowerUpId,
  RoundResult,
  GamePhase,
  WordsmithStats,
  WordsmithSavedGame,
  ScoreBonus,
} from "@/types/wordsmith";
import {
  dateToSeed,
  seededRandom,
  generatePlayableLetters,
  generatePowerUpOfferings,
  calculateScore,
  isWordFormableFromTiles,
  resolveWildcard,
  applyReroll,
  buildShareText,
  getDayNumber,
  getLetterValue,
  getPowerUpById,
  ALL_POWER_UPS,
} from "@/lib/wordsmith-engine";
import { isValidEnglishWord } from "@/lib/dictionary";
import { shareOrCopy } from "@/lib/share";
import XShareButton from "@/components/XShareButton";
import Link from "next/link";

const TOTAL_ROUNDS = 5;
const SAVE_KEY_PREFIX = "wordsmith-";
const STATS_KEY = "wordsmith-stats";

interface Props {
  dateStr: string;
  mode?: "daily" | "quickplay";
}

export default function WordsmithGame({ dateStr, mode = "daily" }: Props) {
  const isQuickplay = mode === "quickplay";
  const [quickplaySeed, setQuickplaySeed] = useState("");
  // ── Core game state ──────────────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>("splash");
  const [currentRound, setCurrentRound] = useState(0);
  const [tiles, setTiles] = useState<LetterTile[]>([]);
  const [selectedTileIds, setSelectedTileIds] = useState<number[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<PowerUpId[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [powerUpOfferings, setPowerUpOfferings] = useState<PowerUp[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [previousWord, setPreviousWord] = useState<string | null>(null);

  // Pre-generated data for all rounds (for save/restore)
  const [allTiles, setAllTiles] = useState<LetterTile[][]>([]);
  const [allOfferings, setAllOfferings] = useState<PowerUp[][]>([]);

  // Reroll state
  const [rerollAvailable, setRerollAvailable] = useState(false);
  const [rerollUsed, setRerollUsed] = useState(false);
  const [rerollSelected, setRerollSelected] = useState<number[]>([]);

  // Echo state
  const [echoUsed, setEchoUsed] = useState(false);

  // UI state
  const [toast, setToast] = useState("");
  const [shake, setShake] = useState(false);
  const [copied, setCopied] = useState(false);
  const [choosingFade, setChoosingFade] = useState(-1); // index of fading cards
  const [chosenCardIdx, setChosenCardIdx] = useState(-1);

  // Score breakdown state
  const [breakdownData, setBreakdownData] = useState<{
    letterDetails: LetterScoreDetail[];
    letterSum: number;
    lengthMultiplier: number;
    multipliedScore: number;
    bonuses: ScoreBonus[];
    totalScore: number;
    word: string;
  } | null>(null);
  const [breakdownStep, setBreakdownStep] = useState(0); // animation step counter
  const breakdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [breakdownDone, setBreakdownDone] = useState(false);

  // Ref to hold data needed after breakdown animation
  const pendingRoundRef = useRef<{
    newResults: RoundResult[];
    newTotal: number;
    word: string;
  } | null>(null);
  const [stats, setStats] = useState<WordsmithStats>({
    streak: 0,
    bestScore: 0,
    averageScore: 0,
    gamesPlayed: 0,
    lastDate: "",
  });

  const rngRef = useRef<() => number>(() => 0);
  const gameRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // ── Initialization ─────────────────────────────────────────────────────

  const initGame = useCallback(() => {
    const seed = isQuickplay ? dateToSeed(quickplaySeed) : dateToSeed(dateStr);
    const rng = seededRandom(seed);
    rngRef.current = rng;

    // Pre-generate all round tiles (deterministic for everyone)
    const roundTiles: LetterTile[][] = [];
    const roundOfferings: PowerUp[][] = []; // Generated on-the-fly per round

    for (let r = 0; r < TOTAL_ROUNDS; r++) {
      roundTiles.push(generatePlayableLetters(rng, r));
      roundOfferings.push([]); // Placeholder — generated when round ends
    }

    setAllTiles(roundTiles);
    setAllOfferings(roundOfferings);
    setTiles(roundTiles[0]);
    setCurrentRound(0);
    setSelectedTileIds([]);
    setActivePowerUps([]);
    setRoundResults([]);
    setTotalScore(0);
    setPreviousWord(null);
    setRerollAvailable(false);
    setRerollUsed(false);
    setEchoUsed(false);

    return { roundTiles, roundOfferings };
  }, [dateStr, isQuickplay, quickplaySeed]);

  // Load saved game or stats on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Load stats
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) setStats(JSON.parse(raw));
    } catch { /* ignore */ }

    // Quickplay: generate a fresh seed client-side and init
    if (isQuickplay) {
      if (!quickplaySeed) {
        // First mount — generate seed, which will re-trigger this effect
        setQuickplaySeed(Date.now().toString() + Math.random().toString(36).slice(2));
        initialized.current = false;
        return;
      }
      initGame();
      return;
    }

    // Check for saved game
    try {
      const raw = localStorage.getItem(SAVE_KEY_PREFIX + dateStr);
      if (raw) {
        const saved: WordsmithSavedGame = JSON.parse(raw);
        if (saved.date === dateStr) {
          // Restore state
          const { roundTiles, roundOfferings } = initGame();
          setAllTiles(saved.allTiles.length ? saved.allTiles : roundTiles);
          setAllOfferings(saved.allOfferings.length ? saved.allOfferings : roundOfferings);
          setRoundResults(saved.rounds);
          setActivePowerUps(saved.activePowerUps);
          setCurrentRound(saved.currentRound);
          setTotalScore(saved.totalScore);
          setPreviousWord(saved.previousWord);
          setRerollUsed(saved.rerollUsed);
          setEchoUsed(saved.echoUsed);

          if (saved.phase === "results") {
            setPhase("results");
          } else {
            // Resume playing
            const t = saved.allTiles.length ? saved.allTiles[saved.currentRound] : roundTiles[saved.currentRound];
            setTiles(t);
            setPhase("playing");
            if (saved.activePowerUps.includes("reroll") && !saved.rerollUsed) {
              setRerollAvailable(true);
              setPhase("rerolling");
            }
          }
          return;
        }
      }
    } catch { /* ignore */ }

    // No saved game — start fresh
    initGame();
  }, [dateStr, initGame, quickplaySeed]);

  // ── Save game state ────────────────────────────────────────────────────

  const saveGame = useCallback(
    (overrides?: Partial<WordsmithSavedGame>) => {
      if (isQuickplay) return; // Don't persist quickplay games
      const data: WordsmithSavedGame = {
        date: dateStr,
        rounds: roundResults,
        activePowerUps,
        currentRound,
        phase,
        totalScore,
        allTiles,
        allOfferings,
        previousWord,
        rerollUsed,
        echoUsed,
        ...overrides,
      };
      try {
        localStorage.setItem(SAVE_KEY_PREFIX + dateStr, JSON.stringify(data));
      } catch { /* ignore */ }
    },
    [dateStr, roundResults, activePowerUps, currentRound, phase, totalScore, allTiles, allOfferings, previousWord, rerollUsed, echoUsed],
  );

  // ── Stats ──────────────────────────────────────────────────────────────

  const saveStats = useCallback(
    (finalScore: number) => {
      if (isQuickplay) return; // Quickplay doesn't affect daily stats
      try {
        const raw = localStorage.getItem(STATS_KEY);
        const prev: WordsmithStats = raw
          ? JSON.parse(raw)
          : { streak: 0, bestScore: 0, averageScore: 0, gamesPlayed: 0, lastDate: "" };

        // Streak logic
        const yesterday = new Date(dateStr);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        const newStreak = prev.lastDate === yStr ? prev.streak + 1 : 1;

        const newPlayed = prev.gamesPlayed + 1;
        const newAvg = Math.round(
          (prev.averageScore * prev.gamesPlayed + finalScore) / newPlayed,
        );

        const newStats: WordsmithStats = {
          streak: newStreak,
          bestScore: Math.max(prev.bestScore, finalScore),
          averageScore: newAvg,
          gamesPlayed: newPlayed,
          lastDate: dateStr,
        };

        localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
        setStats(newStats);
      } catch { /* ignore */ }
    },
    [dateStr],
  );

  // ── Toast helper ───────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  // ── Tile selection ─────────────────────────────────────────────────────

  const toggleTile = (tileId: number) => {
    if (phase === "rerolling") {
      // In reroll mode, toggle tiles for swap
      setRerollSelected((prev) =>
        prev.includes(tileId)
          ? prev.filter((id) => id !== tileId)
          : prev.length < 2
            ? [...prev, tileId]
            : prev,
      );
      return;
    }

    if (phase !== "playing") return;

    if (selectedTileIds.includes(tileId)) {
      setSelectedTileIds((prev) => prev.filter((id) => id !== tileId));
    } else {
      setSelectedTileIds((prev) => [...prev, tileId]);
    }
  };

  // ── Keyboard handler ───────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "playing" && phase !== "rerolling") return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();

      if (key === "ENTER") {
        if (phase === "rerolling") {
          confirmReroll();
        } else {
          handleSubmit();
        }
      } else if (key === "BACKSPACE") {
        e.preventDefault();
        setSelectedTileIds((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && phase === "playing") {
        // Select first unselected tile matching this letter
        const tile = tiles.find(
          (t) =>
            t.letter.toUpperCase() === key &&
            !selectedTileIds.includes(t.id),
        );
        if (tile) {
          setSelectedTileIds((prev) => [...prev, tile.id]);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // ── Submit word ────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (selectedTileIds.length < 3) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      showToast("Need at least 3 letters");
      return;
    }

    const selectedTiles = selectedTileIds.map(
      (id) => tiles.find((t) => t.id === id)!,
    );

    // Check for wildcard
    const hasWildcard = selectedTiles.some((t) => t.isWildcard);
    const tidalRounds = activePowerUps.includes("tidal")
      ? roundResults.filter((_, i) => {
          // Count rounds since tidal was picked
          const tidalPickRound = roundResults.findIndex(
            (r) => r.powerUpChosen?.id === "tidal",
          );
          return tidalPickRound >= 0 && i >= tidalPickRound;
        }).length + 1
      : 0;

    if (hasWildcard) {
      const result = resolveWildcard(
        selectedTiles,
        tiles,
        activePowerUps,
        currentRound,
        previousWord,
        tidalRounds,
      );
      if (!result) {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        showToast("No valid word found");
        return;
      }
      completeRound(result.word, selectedTiles, result.score);
    } else {
      const word = selectedTiles.map((t) => t.letter).join("");
      if (!isValidEnglishWord(word.toLowerCase())) {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        showToast("Not a valid word");
        return;
      }

      const scoreResult = calculateScore(
        word,
        selectedTiles,
        activePowerUps,
        currentRound,
        previousWord,
        tidalRounds,
      );
      completeRound(word.toUpperCase(), selectedTiles, scoreResult.totalScore, scoreResult.bonuses);
    }
  };

  const completeRound = (
    word: string,
    selectedTiles: LetterTile[],
    roundScore: number,
    bonuses: ScoreBonus[] = [],
  ) => {
    const tidalRounds = activePowerUps.includes("tidal")
      ? roundResults.filter((_, i) => {
          const tidalPickRound = roundResults.findIndex(
            (r) => r.powerUpChosen?.id === "tidal",
          );
          return tidalPickRound >= 0 && i >= tidalPickRound;
        }).length + 1
      : 0;

    const scoreResult = calculateScore(
      word,
      selectedTiles,
      activePowerUps,
      currentRound,
      previousWord,
      tidalRounds,
    );

    const result: RoundResult = {
      roundNumber: currentRound + 1,
      word: word.toUpperCase(),
      tiles: selectedTiles,
      baseScore: scoreResult.baseScore,
      lengthMultiplier: scoreResult.lengthMultiplier,
      bonuses: scoreResult.bonuses,
      totalScore: scoreResult.totalScore,
      powerUpChosen: null,
    };

    const newResults = [...roundResults, result];
    const newTotal = totalScore + scoreResult.totalScore;

    setRoundResults(newResults);
    setTotalScore(newTotal);
    setPreviousWord(word.toUpperCase());
    setSelectedTileIds([]);

    // Set up score breakdown animation
    setBreakdownData({
      letterDetails: scoreResult.letterDetails,
      letterSum: scoreResult.baseScore,
      lengthMultiplier: scoreResult.lengthMultiplier,
      multipliedScore: Math.round(scoreResult.baseScore * scoreResult.lengthMultiplier),
      bonuses: scoreResult.bonuses,
      totalScore: scoreResult.totalScore,
      word: word.toUpperCase(),
    });
    setBreakdownStep(0);
    setBreakdownDone(false);
    setPhase("score-breakdown");

    // Store pending data for after breakdown
    pendingRoundRef.current = { newResults, newTotal, word: word.toUpperCase() };
  };

  // Advance from score-breakdown to the next phase
  const advanceFromBreakdown = useCallback(() => {
    if (breakdownTimerRef.current) {
      clearTimeout(breakdownTimerRef.current);
      breakdownTimerRef.current = null;
    }
    const pending = pendingRoundRef.current;
    if (!pending) return;
    pendingRoundRef.current = null;

    if (currentRound >= TOTAL_ROUNDS - 1) {
      // Keep breakdown visible — results screen will appear above it
      setPhase("results");
      saveStats(pending.newTotal);
      saveGame({
        rounds: pending.newResults,
        totalScore: pending.newTotal,
        phase: "results",
        previousWord: pending.word,
      });
    } else {
      const offeringSeedStr = isQuickplay ? quickplaySeed + "-pu-" + currentRound : dateStr + "-pu-" + currentRound;
      const offeringRng = seededRandom(dateToSeed(offeringSeedStr));
      const offerings = generatePowerUpOfferings(offeringRng, activePowerUps);
      setPowerUpOfferings(offerings);

      const newOfferings = [...allOfferings];
      newOfferings[currentRound] = offerings;
      setAllOfferings(newOfferings);

      setPhase("choosing-powerup");
      setChoosingFade(-1);
      setChosenCardIdx(-1);
    }
  }, [currentRound, isQuickplay, quickplaySeed, dateStr, activePowerUps, allOfferings, saveStats, saveGame]);

  // Animate breakdown steps
  useEffect(() => {
    if (phase !== "score-breakdown" || !breakdownData || breakdownDone) return;

    // Total steps: letters + 1 (multiplier) + bonuses.length + 1 (final)
    const totalSteps = breakdownData.letterDetails.length + 1 + breakdownData.bonuses.length + 1;

    if (breakdownStep >= totalSteps) {
      setBreakdownDone(true);
      // Advance immediately — power-ups appear above the breakdown card
      advanceFromBreakdown();
      return;
    }

    const delay = breakdownStep < breakdownData.letterDetails.length ? 300 : 400;
    breakdownTimerRef.current = setTimeout(() => {
      setBreakdownStep((s) => s + 1);
    }, delay);

    return () => {
      if (breakdownTimerRef.current) clearTimeout(breakdownTimerRef.current);
    };
  }, [phase, breakdownData, breakdownStep, breakdownDone, advanceFromBreakdown]);

  // Skip breakdown animation on tap
  const handleBreakdownTap = () => {
    if (!breakdownData || breakdownDone) return;
    // Fast-forward: show everything and advance immediately
    if (breakdownTimerRef.current) clearTimeout(breakdownTimerRef.current);
    const totalSteps = breakdownData.letterDetails.length + 1 + breakdownData.bonuses.length + 1;
    setBreakdownStep(totalSteps);
    setBreakdownDone(true);
    advanceFromBreakdown();
  };

  // ── Power-up selection ─────────────────────────────────────────────────

  const choosePowerUp = (powerUp: PowerUp, cardIdx: number) => {
    setChosenCardIdx(cardIdx);
    setChoosingFade(cardIdx);

    setTimeout(() => {
      setBreakdownData(null);
      let newPowerUps = [...activePowerUps, powerUp.id];
      setActivePowerUps(newPowerUps);

      // Update the last round result with the chosen power-up
      const updatedResults = [...roundResults];
      if (updatedResults.length > 0) {
        updatedResults[updatedResults.length - 1] = {
          ...updatedResults[updatedResults.length - 1],
          powerUpChosen: powerUp,
        };
      }
      setRoundResults(updatedResults);

      // Handle Echo: double last round's score, then remove from active list
      let newTotal = totalScore;
      if (powerUp.id === "echo" && updatedResults.length > 0) {
        const lastResult = updatedResults[updatedResults.length - 1];
        const echoBonus = lastResult.totalScore;
        updatedResults[updatedResults.length - 1] = {
          ...lastResult,
          totalScore: lastResult.totalScore * 2,
          bonuses: [...lastResult.bonuses, { label: "Echo 2x", value: echoBonus }],
        };
        newTotal = updatedResults.reduce((sum, r) => sum + r.totalScore, 0);
        setTotalScore(newTotal);
        setEchoUsed(true);
        // Remove echo from active list — it's a one-time effect
        newPowerUps = newPowerUps.filter((id) => id !== "echo");
        setActivePowerUps(newPowerUps);
      }

      // Move to next round
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);

      // Apply Vortex: mark one tile as wildcard
      let nextTiles = allTiles[nextRound];
      if (newPowerUps.includes("vortex")) {
        // Pick a consonant tile to make wildcard (more interesting than a vowel)
        const consonantIdx = nextTiles.findIndex(
          (t) => !"AEIOU".includes(t.letter.toUpperCase()) && !t.isWildcard,
        );
        const idx = consonantIdx >= 0 ? consonantIdx : 0;
        nextTiles = nextTiles.map((t, i) =>
          i === idx ? { ...t, isWildcard: true, letter: "\u2605" } : t,
        );
        // Update allTiles for persistence
        const newAllTiles = [...allTiles];
        newAllTiles[nextRound] = nextTiles;
        setAllTiles(newAllTiles);
      }

      setTiles(nextTiles);
      setSelectedTileIds([]);

      // Handle Reroll
      if (powerUp.id === "reroll") {
        setRerollAvailable(true);
        setPhase("rerolling");
        setRerollSelected([]);
      } else {
        setPhase("playing");
      }

      saveGame({
        rounds: updatedResults,
        activePowerUps: newPowerUps,
        currentRound: nextRound,
        phase: powerUp.id === "reroll" ? "rerolling" : "playing",
        totalScore: newTotal,
        previousWord: previousWord,
        rerollUsed: powerUp.id === "reroll" ? false : rerollUsed,
      });
    }, 500);
  };

  // ── Reroll ─────────────────────────────────────────────────────────────

  const confirmReroll = () => {
    if (rerollSelected.length === 0) {
      // Skip reroll
      setRerollAvailable(false);
      setRerollUsed(true);
      setPhase("playing");
      saveGame({ phase: "playing", rerollUsed: true });
      return;
    }

    const indices = rerollSelected.map((id) =>
      tiles.findIndex((t) => t.id === id),
    );
    const rerollSeedStr = isQuickplay ? quickplaySeed + "-reroll-" + currentRound : dateStr + "-reroll-" + currentRound;
    const rng = seededRandom(dateToSeed(rerollSeedStr));
    const newTiles = applyReroll(tiles, indices, rng);
    setTiles(newTiles);
    setRerollAvailable(false);
    setRerollUsed(true);
    setRerollSelected([]);
    setPhase("playing");

    // Update allTiles
    const newAllTiles = [...allTiles];
    newAllTiles[currentRound] = newTiles;
    setAllTiles(newAllTiles);
    saveGame({ phase: "playing", rerollUsed: true, allTiles: newAllTiles });
  };

  // ── Share ──────────────────────────────────────────────────────────────

  const getShareText = useCallback(
    () =>
      isQuickplay
        ? buildShareText(roundResults, totalScore, dateStr).replace(
            /WORDSMITH .*? #\d+/,
            "WORDSMITH \u2692\uFE0F Quickplay",
          )
        : buildShareText(roundResults, totalScore, dateStr),
    [roundResults, totalScore, dateStr, isQuickplay],
  );

  const handleShare = async () => {
    await shareOrCopy(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startNewQuickplay = () => {
    initialized.current = false;
    setQuickplaySeed(Date.now().toString() + Math.random().toString(36).slice(2));
    setPhase("splash");
  };

  // ── Helpers ────────────────────────────────────────────────────────────

  const selectedWord = selectedTileIds
    .map((id) => tiles.find((t) => t.id === id)!)
    .map((t) => (t.isWildcard ? "\u2605" : t.letter))
    .join("");

  const dayNumber = getDayNumber(dateStr);

  // ── Render ─────────────────────────────────────────────────────────────

  // Splash screen
  if (phase === "splash") {
    return (
      <div
        ref={gameRef}
        className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4"
      >
        <div className="clay-card mx-auto w-full max-w-md animate-[fade-up_0.5s_ease_forwards] p-8 text-center">
          <div className="mb-2 text-5xl">{"\u2692\uFE0F"}</div>
          <h1 className="font-display mb-2 text-3xl font-bold text-amber">
            WORDSMITH
          </h1>
          <p className="text-text-secondary mb-1 text-sm">
            {isQuickplay ? "Quickplay" : `Day #${dayNumber}`}
          </p>
          <p className="text-text-secondary mb-6 text-sm leading-relaxed">
            Form the best word from 7 letters across 5 rounds.
            <br />
            Collect power-ups that stack and synergize.
            <br />
            {isQuickplay ? "A fresh puzzle every time." : "Chase the high score."}
          </p>

          {stats.streak > 0 && (
            <p className="mb-4 text-sm font-medium text-amber">
              {"\u{1F525}"} {stats.streak} day streak
            </p>
          )}

          <button
            onClick={() => {
              setPhase("playing");
              saveGame({ phase: "playing" });
            }}
            className="rounded-xl bg-amber px-8 py-3 font-semibold text-white transition-transform hover:scale-105 active:scale-95"
          >
            Play
          </button>
        </div>
      </div>
    );
  }

  // ── Main game view (playing / rerolling / choosing-powerup / results) ───

  return (
    <div
      ref={gameRef}
      className="mx-auto flex min-h-[calc(100vh-64px)] max-w-lg flex-col items-center px-4 pt-4 pb-8"
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 z-50 rounded-lg bg-[#1a1a2e] px-4 py-2 text-sm font-medium text-white shadow-lg animate-[fade-up_0.2s_ease]">
          {toast}
        </div>
      )}

      {/* Round indicator */}
      {phase !== "results" && (
        <>
          {/* Round indicator */}
          <div className="mb-3 flex items-center gap-3">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full transition-all ${
                  i < currentRound
                    ? "bg-amber"
                    : i === currentRound
                      ? "bg-amber scale-125"
                      : "bg-gray-300"
                }`}
                style={
                  i === currentRound
                    ? { animation: "ws-round-pulse 1.5s ease infinite" }
                    : undefined
                }
              />
            ))}
          </div>

          {/* Score display */}
          <div className="mb-4 text-center">
            <span className="text-text-secondary text-xs">Score</span>
            <p className="font-display text-3xl font-bold text-amber">
              {totalScore}
            </p>
          </div>
        </>
      )}

      {/* Active power-ups */}
      {activePowerUps.length > 0 && phase !== "results" && (
        <div className="mb-3 flex flex-wrap justify-center gap-1.5">
          {activePowerUps.map((id, idx) => {
            const pu = getPowerUpById(id);
            return (
              <span
                key={`${id}-${idx}`}
                className="rounded-full border border-amber/30 bg-white/80 px-3 py-1.5 text-sm font-semibold text-amber-700 shadow-sm backdrop-blur-sm dark:bg-gray-800/80 dark:text-amber-400"
              >
                {pu.emoji} {pu.name}{" "}
                <span className="font-normal text-amber-600/80 dark:text-amber-400/80">— {pu.description}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Reroll banner */}
      {phase === "rerolling" && (
        <div className="mb-3 w-full rounded-lg bg-amber/10 p-3 text-center">
          <p className="text-sm font-medium text-amber">
            {"\u{1F3B2}"} Tap up to 2 tiles to swap, then confirm
          </p>
          <div className="mt-2 flex justify-center gap-2">
            <button
              onClick={confirmReroll}
              className="rounded-lg bg-amber px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-dark"
            >
              {rerollSelected.length > 0
                ? `Swap ${rerollSelected.length} tile${rerollSelected.length > 1 ? "s" : ""}`
                : "Skip"}
            </button>
          </div>
        </div>
      )}

      {/* Letter tiles */}
      {phase !== "results" && (
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {tiles.map((tile) => {
            const isSelected = selectedTileIds.includes(tile.id);
            const isRerollTarget = rerollSelected.includes(tile.id);
            return (
              <button
                key={tile.id}
                onClick={() => toggleTile(tile.id)}
                disabled={phase === "choosing-powerup" || phase === "score-breakdown"}
                className={`
                  relative flex h-14 w-14 flex-col items-center justify-center rounded-xl
                  border-2 font-bold text-lg transition-all select-none
                  ${
                    isSelected
                      ? "border-amber bg-amber/20 text-amber scale-90 opacity-50"
                      : isRerollTarget
                        ? "border-red-400 bg-red-50 text-red-600 scale-105"
                        : tile.isWildcard
                          ? "border-purple bg-purple/10 text-purple"
                          : "border-gray-200 bg-white text-text-primary hover:border-amber/50 hover:bg-amber/5"
                  }
                  ${shake && !isSelected ? "animate-[shake_0.4s_ease]" : ""}
                `}
                style={
                  !isSelected && !isRerollTarget
                    ? { animation: "ws-tile-return 0.15s ease" }
                    : undefined
                }
              >
                <span className="font-grotesk text-xl leading-none">
                  {tile.isWildcard ? "\u2605" : tile.letter}
                </span>
                <span className="absolute bottom-0.5 right-1 text-[9px] opacity-50">
                  {tile.isWildcard ? "?" : tile.value}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Word building area */}
      {phase === "playing" && (
        <>
          <div className="mb-3 flex min-h-[56px] items-center justify-center gap-1.5">
            {selectedTileIds.length > 0 ? (
              selectedTileIds.map((id, i) => {
                const tile = tiles.find((t) => t.id === id)!;
                return (
                  <div
                    key={id}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-amber bg-amber/10 font-bold text-amber animate-[ws-tile-pop_0.2s_ease]"
                  >
                    <span className="font-grotesk text-lg">
                      {tile.isWildcard ? "\u2605" : tile.letter}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-text-secondary text-sm italic">
                Tap tiles to build a word
              </p>
            )}
          </div>



          {/* Submit + Clear */}
          <div className="flex gap-2">
            {selectedTileIds.length > 0 && (
              <button
                onClick={() => setSelectedTileIds([])}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-gray-50"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={selectedTileIds.length < 3}
              className={`rounded-xl px-8 py-2.5 font-semibold text-white transition-all ${
                selectedTileIds.length >= 3
                  ? "bg-amber hover:scale-105 active:scale-95"
                  : "cursor-not-allowed bg-gray-300"
              }`}
            >
              Submit
            </button>
          </div>
        </>
      )}

      {/* Results card — above last round's breakdown */}
      {phase === "results" && (
        <div className="mt-4 w-full animate-[fade-up_0.3s_ease]">
          <div className="clay-card mx-auto w-full max-w-md p-6 text-center">
            <div className="mb-1 text-4xl">{"\u2692\uFE0F"}</div>
            <h2 className="font-display mb-1 text-2xl font-bold text-amber">
              {isQuickplay ? "WORDSMITH Quickplay" : `WORDSMITH #${dayNumber}`}
            </h2>

            {/* Round breakdown */}
            <div className="my-4 space-y-2">
              {roundResults.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 opacity-0"
                  style={{
                    animation: `ws-stagger-in 0.3s ease ${i * 0.15}s forwards`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-xs font-medium">
                      R{r.roundNumber}
                    </span>
                    <span className="font-grotesk text-sm font-bold tracking-wider">
                      {r.word}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.powerUpChosen && (
                      <span className="text-sm" title={r.powerUpChosen.name}>
                        {r.powerUpChosen.emoji}
                      </span>
                    )}
                    <span className="font-grotesk text-sm font-bold text-amber">
                      {r.totalScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div
              className="mb-4 opacity-0"
              style={{
                animation: `ws-stagger-in 0.3s ease ${roundResults.length * 0.15}s forwards`,
              }}
            >
              <span className="text-text-secondary text-sm">Total</span>
              <p className="font-display text-4xl font-bold text-amber">
                {totalScore}
              </p>
            </div>

            {/* Rating row */}
            <div className="mb-4 flex justify-center gap-1 text-xl">
              {roundResults.map((r, i) => (
                <span key={i}>
                  {r.totalScore >= 200
                    ? "\u{1F7E9}"
                    : r.totalScore >= 80
                      ? "\u{1F7E8}"
                      : "\u{1F7E7}"}
                </span>
              ))}
            </div>

            {/* Personal best */}
            {totalScore >= stats.bestScore && stats.gamesPlayed > 0 && (
              <p className="mb-3 text-sm font-medium text-amber animate-[ws-score-pop_0.4s_ease]">
                {"\u{1F31F}"} New personal best!
              </p>
            )}

            {/* Stats row */}
            <div className="mb-5 flex justify-center gap-6 text-center text-xs text-text-secondary">
              <div>
                <p className="text-lg font-bold text-text-primary">
                  {stats.streak}
                </p>
                <p>Streak</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">
                  {stats.bestScore}
                </p>
                <p>Best</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">
                  {stats.averageScore}
                </p>
                <p>Average</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">
                  {stats.gamesPlayed}
                </p>
                <p>Played</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleShare}
                className="rounded-xl bg-amber px-8 py-3 font-semibold text-white transition-transform hover:scale-105 active:scale-95"
              >
                {copied ? "Copied!" : "Share Results"}
              </button>
              <XShareButton getText={getShareText} />
              {isQuickplay && (
                <button
                  onClick={startNewQuickplay}
                  className="rounded-xl border-2 border-amber px-6 py-2.5 font-semibold text-amber transition-transform hover:scale-105 active:scale-95"
                >
                  New Game
                </button>
              )}
            </div>

            {/* Quickplay link on daily results */}
            {!isQuickplay && (
              <Link
                href="/daily/wordsmith/quickplay"
                className="mt-4 inline-block rounded-xl border-2 border-amber px-6 py-2.5 text-sm font-semibold text-amber transition-transform hover:scale-105 active:scale-95 no-underline"
              >
                Want more? Try Quickplay &rarr;
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Power-up selection overlay — above breakdown so score stays visible */}
      {phase === "choosing-powerup" && (
        <div className="mt-4 w-full animate-[fade-up_0.3s_ease]">
          <p className="mb-3 text-center text-sm font-semibold text-text-secondary">
            Choose a power-up
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {powerUpOfferings.map((pu, idx) => (
              <button
                key={pu.id}
                onClick={() => choosePowerUp(pu, idx)}
                disabled={chosenCardIdx >= 0}
                className={`
                  group relative flex flex-1 flex-col items-center rounded-2xl border-2 p-4
                  transition-all
                  ${
                    chosenCardIdx === idx
                      ? "border-amber bg-amber/10"
                      : chosenCardIdx >= 0
                        ? "opacity-0 scale-95"
                        : "border-gray-200 bg-white hover:border-amber hover:scale-[1.02]"
                  }
                `}
                style={
                  chosenCardIdx === idx
                    ? { animation: "ws-card-flip 0.5s ease" }
                    : chosenCardIdx >= 0 && chosenCardIdx !== idx
                      ? { animation: "ws-card-fade-out 0.3s ease forwards" }
                      : { animation: "ws-card-glow 2s ease infinite" }
                }
              >
                <span className="mb-1 text-3xl">{pu.emoji}</span>
                <span className="mb-0.5 text-sm font-bold text-text-primary">
                  {pu.name}
                </span>
                <span className="text-text-secondary text-center text-xs leading-tight">
                  {pu.description}
                </span>
                <span className="mt-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                  {pu.type === "persistent"
                    ? "Permanent"
                    : pu.type === "one-time"
                      ? "This round"
                      : "Next round"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Score breakdown overlay */}
      {(phase === "score-breakdown" || phase === "choosing-powerup" || phase === "results") && breakdownData && (
        <div
          className="mt-4 w-full animate-[fade-up_0.3s_ease]"
          onClick={phase === "score-breakdown" ? handleBreakdownTap : undefined}
          style={phase === "score-breakdown" ? { cursor: "pointer" } : undefined}
        >
          <div className="clay-card mx-auto w-full max-w-sm p-5">
            {/* Word display */}
            <p className="font-display mb-4 text-center text-xl font-bold tracking-widest text-amber">
              {breakdownData.word}
            </p>

            {/* Letter-by-letter breakdown */}
            <div className="mb-3 flex flex-wrap justify-center gap-2">
              {breakdownData.letterDetails.map((ld, i) => {
                const visible = breakdownStep > i;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 font-bold text-lg ${
                        ld.modifiers.length > 0
                          ? "border-amber bg-amber/15 text-amber"
                          : "border-gray-200 bg-white text-text-primary"
                      }`}
                      style={visible ? { animation: "ws-letter-reveal 0.3s ease" } : undefined}
                    >
                      <span className="font-grotesk">{ld.letter}</span>
                    </div>
                    <span
                      className={`mt-1 text-sm font-bold ${
                        ld.modifiers.length > 0 ? "text-amber" : "text-text-secondary"
                      }`}
                    >
                      {ld.modifiedValue}
                    </span>
                    {ld.modifiers.length > 0 && (
                      <span className="mt-0.5 text-[9px] font-medium text-amber/70">
                        {ld.modifiers[0]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Running letter sum */}
            {breakdownStep > 0 && breakdownStep <= breakdownData.letterDetails.length && (
              <p className="mb-2 text-center text-sm text-text-secondary">
                Letter total:{" "}
                <span className="font-bold text-text-primary">
                  {breakdownData.letterDetails
                    .slice(0, breakdownStep)
                    .reduce((sum, ld) => sum + ld.modifiedValue, 0)}
                </span>
              </p>
            )}

            {/* Length multiplier */}
            {breakdownStep > breakdownData.letterDetails.length && (
              <div
                className="mb-2 text-center"
                style={{ animation: "ws-multiplier-pop 0.4s ease" }}
              >
                <span className="text-sm text-text-secondary">
                  {breakdownData.letterSum} {"\u00D7"}{" "}
                </span>
                <span className="text-lg font-bold text-amber">
                  {breakdownData.lengthMultiplier}x
                </span>
                <span className="text-sm text-text-secondary">
                  {" "}({breakdownData.word.length} letters)
                </span>
                <span className="text-sm text-text-secondary"> = </span>
                <span className="text-lg font-bold text-text-primary">
                  {breakdownData.multipliedScore}
                </span>
              </div>
            )}

            {/* Bonuses */}
            {breakdownData.bonuses.length > 0 && breakdownStep > breakdownData.letterDetails.length && (
              <div className="mb-2 space-y-1.5">
                {breakdownData.bonuses.map((b, i) => {
                  const bonusIdx = breakdownData.letterDetails.length + 1 + i;
                  const visible = breakdownStep > bonusIdx;
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-center gap-2 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                    >
                      <span className="rounded-full border border-amber/30 bg-white/80 px-3 py-1.5 text-sm font-bold text-amber-700 shadow-sm dark:bg-gray-800/80 dark:text-amber-400">
                        {b.label}
                      </span>
                      {b.value > 0 && (
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                          {b.label.includes("2x") ? `\u2192 ${breakdownData.totalScore}` : `+${b.value}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Final score */}
            {breakdownDone && (
              <div
                className="mt-3 text-center"
                style={{ animation: "ws-score-pop 0.4s ease" }}
              >
                <span className="text-text-secondary text-xs">Round Score</span>
                <p className="font-display text-3xl font-bold text-amber">
                  +{breakdownData.totalScore}
                </p>
              </div>
            )}

            {/* Tap hint */}
            {!breakdownDone && (
              <p className="mt-3 text-center text-[10px] text-text-secondary/50">
                Tap to skip
              </p>
            )}
          </div>
        </div>
      )}

      {/* Round history (compact) */}
      {roundResults.length > 0 && phase !== "choosing-powerup" && phase !== "score-breakdown" && (
        <div className="mt-6 w-full max-w-sm">
          <div className="space-y-1.5">
            {roundResults.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md bg-white/50 px-3 py-1.5 text-xs"
              >
                <span className="text-text-secondary">R{r.roundNumber}</span>
                <span className="font-grotesk font-bold tracking-wider">
                  {r.word}
                </span>
                <div className="flex items-center gap-1.5">
                  {r.powerUpChosen && (
                    <span title={r.powerUpChosen.name}>
                      {r.powerUpChosen.emoji}
                    </span>
                  )}
                  <span className="font-bold text-amber">{r.totalScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
