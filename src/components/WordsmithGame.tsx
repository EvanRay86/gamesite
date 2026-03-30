"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  LetterTile,
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

const TOTAL_ROUNDS = 5;
const SAVE_KEY_PREFIX = "wordsmith-";
const STATS_KEY = "wordsmith-stats";

interface Props {
  dateStr: string;
}

export default function WordsmithGame({ dateStr }: Props) {
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
  const [scoreAnim, setScoreAnim] = useState(false);
  const [showBonuses, setShowBonuses] = useState<ScoreBonus[]>([]);
  const [choosingFade, setChoosingFade] = useState(-1); // index of fading cards
  const [chosenCardIdx, setChosenCardIdx] = useState(-1);
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
    const rng = seededRandom(dateToSeed(dateStr));
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
  }, [dateStr]);

  // Load saved game or stats on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Load stats
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) setStats(JSON.parse(raw));
    } catch { /* ignore */ }

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
  }, [dateStr, initGame]);

  // ── Save game state ────────────────────────────────────────────────────

  const saveGame = useCallback(
    (overrides?: Partial<WordsmithSavedGame>) => {
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
    // Show score animation
    setScoreAnim(true);
    setShowBonuses(bonuses);
    setTimeout(() => {
      setScoreAnim(false);
      setShowBonuses([]);
    }, 1500);

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
      powerUpChosen: null, // Will be set when power-up is chosen
    };

    const newResults = [...roundResults, result];
    const newTotal = totalScore + scoreResult.totalScore;

    setRoundResults(newResults);
    setTotalScore(newTotal);
    setPreviousWord(word.toUpperCase());
    setSelectedTileIds([]);

    if (currentRound >= TOTAL_ROUNDS - 1) {
      // Game over
      setPhase("results");
      saveStats(newTotal);
      saveGame({
        rounds: newResults,
        totalScore: newTotal,
        phase: "results",
        previousWord: word.toUpperCase(),
      });
    } else {
      // Generate power-up offerings on-the-fly, filtering already-chosen
      const offeringRng = seededRandom(dateToSeed(dateStr + "-pu-" + currentRound));
      const offerings = generatePowerUpOfferings(offeringRng, activePowerUps);
      setPowerUpOfferings(offerings);

      // Store for persistence
      const newOfferings = [...allOfferings];
      newOfferings[currentRound] = offerings;
      setAllOfferings(newOfferings);

      setPhase("choosing-powerup");
      setChoosingFade(-1);
      setChosenCardIdx(-1);
    }
  };

  // ── Power-up selection ─────────────────────────────────────────────────

  const choosePowerUp = (powerUp: PowerUp, cardIdx: number) => {
    setChosenCardIdx(cardIdx);
    setChoosingFade(cardIdx);

    setTimeout(() => {
      const newPowerUps = [...activePowerUps, powerUp.id];
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

      // Handle Echo: double last round's score
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
    const rng = seededRandom(dateToSeed(dateStr + "-reroll-" + currentRound));
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

  const handleShare = async () => {
    const text = buildShareText(roundResults, totalScore, dateStr);
    await shareOrCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            Day #{dayNumber}
          </p>
          <p className="text-text-secondary mb-6 text-sm leading-relaxed">
            Form the best word from 7 letters across 5 rounds.
            <br />
            Collect power-ups that stack and synergize.
            <br />
            Chase the high score.
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

  // Results screen
  if (phase === "results") {
    return (
      <div
        ref={gameRef}
        className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4"
      >
        <div className="clay-card mx-auto w-full max-w-md p-6 text-center">
          <div className="mb-1 text-4xl">{"\u2692\uFE0F"}</div>
          <h2 className="font-display mb-1 text-2xl font-bold text-amber">
            WORDSMITH #{dayNumber}
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

          {/* Share button */}
          <button
            onClick={handleShare}
            className="rounded-xl bg-amber px-8 py-3 font-semibold text-white transition-transform hover:scale-105 active:scale-95"
          >
            {copied ? "Copied!" : "Share Results"}
          </button>
        </div>
      </div>
    );
  }

  // ── Main game view (playing / rerolling / choosing-powerup) ────────────

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
        <p
          className={`font-display text-3xl font-bold text-amber ${
            scoreAnim ? "animate-[ws-count-up_0.3s_ease]" : ""
          }`}
        >
          {totalScore}
        </p>
      </div>

      {/* Active power-ups */}
      {activePowerUps.length > 0 && (
        <div className="mb-3 flex flex-wrap justify-center gap-1.5">
          {activePowerUps.map((id, idx) => {
            const pu = getPowerUpById(id);
            return (
              <span
                key={`${id}-${idx}`}
                className="rounded-full bg-amber/10 px-2 py-0.5 text-xs font-medium text-amber"
                title={`${pu.name}: ${pu.description}`}
              >
                {pu.emoji} {pu.name}
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
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {tiles.map((tile) => {
          const isSelected = selectedTileIds.includes(tile.id);
          const isRerollTarget = rerollSelected.includes(tile.id);
          return (
            <button
              key={tile.id}
              onClick={() => toggleTile(tile.id)}
              disabled={phase === "choosing-powerup"}
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

          {/* Bonus annotations */}
          {showBonuses.length > 0 && (
            <div className="mb-2 flex flex-wrap justify-center gap-1">
              {showBonuses.map((b, i) => (
                <span
                  key={i}
                  className="text-xs font-bold text-amber opacity-0"
                  style={{
                    animation: `ws-bonus-fly 0.3s ease ${i * 0.15}s forwards`,
                  }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

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

      {/* Power-up selection overlay */}
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

      {/* Round history (compact) */}
      {roundResults.length > 0 && phase !== "choosing-powerup" && (
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
