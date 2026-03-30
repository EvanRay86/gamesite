"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DuelPuzzleData, DuelPuzzleType, Faction } from "@/types/rift";
import { calculateDuelScore, getPuzzleTypeName } from "@/lib/rift-puzzles";
import { FACTION_COLORS, FACTION_NAMES } from "@/types/rift";

interface RiftDuelProps {
  puzzleData: DuelPuzzleData;
  playerFaction: Faction;
  opponentFaction: Faction;
  opponentProgress: number;
  onComplete: (score: number) => void;
  onProgress: (progress: number) => void;
}

export default function RiftDuel({
  puzzleData,
  playerFaction,
  opponentFaction,
  opponentProgress,
  onComplete,
  onProgress,
}: RiftDuelProps) {
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Timer
  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => {
      setTimeElapsed(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, completed]);

  const handleDuelComplete = useCallback(
    (accuracy: number) => {
      if (completed) return;
      setCompleted(true);
      const score = calculateDuelScore(accuracy, Date.now() - startTime);
      onComplete(score);
    },
    [completed, startTime, onComplete],
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: FACTION_COLORS[playerFaction] }}
          />
          <span className="text-sm font-bold" style={{ color: FACTION_COLORS[playerFaction] }}>
            {FACTION_NAMES[playerFaction]}
          </span>
        </div>

        <div className="text-center">
          <div className="text-xs text-text-muted">{getPuzzleTypeName(puzzleData.type)}</div>
          <div className="text-lg font-bold font-grotesk tabular-nums">
            {(timeElapsed / 1000).toFixed(1)}s
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: FACTION_COLORS[opponentFaction] }}>
            {FACTION_NAMES[opponentFaction]}
          </span>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: FACTION_COLORS[opponentFaction] }}
          />
        </div>
      </div>

      {/* Opponent progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Your progress</span>
          <span>Opponent</span>
        </div>
        <div className="relative h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{
              backgroundColor: FACTION_COLORS[opponentFaction],
              width: `${opponentProgress}%`,
              opacity: 0.4,
            }}
          />
        </div>
      </div>

      {/* Puzzle content */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        {puzzleData.type === "word_blitz" && (
          <WordBlitzPuzzle
            payload={puzzleData.payload as { words: { word: string; scrambled: string; hint: string }[] }}
            onComplete={handleDuelComplete}
            onProgress={onProgress}
          />
        )}
        {puzzleData.type === "number_crunch" && (
          <NumberCrunchPuzzle
            payload={puzzleData.payload as { equation: string; target: number }}
            onComplete={handleDuelComplete}
            onProgress={onProgress}
          />
        )}
        {puzzleData.type === "quick_fire" && (
          <QuickFirePuzzle
            payload={puzzleData.payload as { questions: { question: string; options: string[]; correctIndex: number }[] }}
            onComplete={handleDuelComplete}
            onProgress={onProgress}
          />
        )}
        {puzzleData.type === "chain_link" && (
          <ChainLinkPuzzle
            payload={puzzleData.payload as { chain: string[] }}
            onComplete={handleDuelComplete}
            onProgress={onProgress}
          />
        )}
        {puzzleData.type === "letter_lock" && (
          <LetterLockPuzzle
            payload={puzzleData.payload as { word: string; maxGuesses: number }}
            onComplete={handleDuelComplete}
            onProgress={onProgress}
          />
        )}
        {puzzleData.type === "rank_it" && (
          <RankItPuzzle
            payload={puzzleData.payload as { prompt: string; items: { label: string; value: number }[] }}
            onComplete={handleDuelComplete}
            onProgress={onProgress}
          />
        )}
      </div>
    </div>
  );
}

// ── Word Blitz ───────────────────────────────────────────────────────────────

function WordBlitzPuzzle({
  payload,
  onComplete,
  onProgress,
}: {
  payload: { words: { word: string; scrambled: string; hint: string }[] };
  onComplete: (accuracy: number) => void;
  onProgress: (progress: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [solved, setSolved] = useState<boolean[]>(new Array(payload.words.length).fill(false));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const word = payload.words[currentIndex];
    if (input.toUpperCase() === word.word) {
      const newSolved = [...solved];
      newSolved[currentIndex] = true;
      setSolved(newSolved);

      const solvedCount = newSolved.filter(Boolean).length;
      onProgress((solvedCount / payload.words.length) * 100);

      if (solvedCount === payload.words.length) {
        onComplete(1);
        return;
      }

      // Move to next unsolved
      let next = (currentIndex + 1) % payload.words.length;
      while (newSolved[next] && next !== currentIndex) {
        next = (next + 1) % payload.words.length;
      }
      setCurrentIndex(next);
      setInput("");
    } else {
      setInput("");
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-1">Unscramble the words!</h3>
      <p className="text-sm text-text-muted mb-4">
        {solved.filter(Boolean).length} / {payload.words.length} solved
      </p>

      <div className="flex gap-2 mb-4">
        {payload.words.map((w, i) => (
          <button
            key={i}
            onClick={() => { if (!solved[i]) { setCurrentIndex(i); setInput(""); } }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
              ${solved[i]
                ? "bg-green/20 text-green"
                : i === currentIndex
                  ? "bg-coral/20 text-coral ring-2 ring-coral/30"
                  : "bg-surface text-text-muted"
              }`}
          >
            {solved[i] ? w.word : (i + 1)}
          </button>
        ))}
      </div>

      {!solved.every(Boolean) && (
        <div className="text-center">
          <div className="text-2xl font-bold tracking-[0.3em] mb-2 font-grotesk">
            {payload.words[currentIndex].scrambled}
          </div>
          <div className="text-xs text-text-muted mb-3">
            Hint: {payload.words[currentIndex].hint}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              className="flex-1 rounded-xl border border-border px-4 py-2 text-center
                         font-bold tracking-wider uppercase focus:outline-none focus:ring-2
                         focus:ring-coral/30"
              placeholder="Type answer..."
              autoComplete="off"
            />
            <button
              type="submit"
              className="rounded-xl bg-coral px-6 py-2 text-white font-bold
                         hover:bg-coral-dark transition-colors"
            >
              Go
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Number Crunch ────────────────────────────────────────────────────────────

function NumberCrunchPuzzle({
  payload,
  onComplete,
  onProgress,
}: {
  payload: { equation: string; target: number };
  onComplete: (accuracy: number) => void;
  onProgress: (progress: number) => void;
}) {
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const maxAttempts = 6;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = input.replace(/\s/g, "");
    if (cleaned.length !== 6) {
      setFeedback("Equation must be 6 characters");
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    onProgress((newAttempts / maxAttempts) * 100);

    if (cleaned === payload.equation) {
      onComplete(1);
    } else if (newAttempts >= maxAttempts) {
      onComplete(0);
    } else {
      setFeedback(`Not quite! ${maxAttempts - newAttempts} attempts left`);
      setInput("");
    }
  };

  return (
    <div className="text-center">
      <h3 className="text-lg font-bold mb-1">Find the equation!</h3>
      <p className="text-sm text-text-muted mb-2">
        Find a 6-character equation that equals:
      </p>
      <div className="text-4xl font-bold text-coral mb-4 font-grotesk">{payload.target}</div>
      <p className="text-xs text-text-muted mb-4">
        Use digits and operators (+, -, *, /) · Attempt {attempts + 1}/{maxAttempts}
      </p>
      {feedback && (
        <div className="text-sm text-amber mb-3">{feedback}</div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={6}
          className="flex-1 rounded-xl border border-border px-4 py-2 text-center
                     font-bold tracking-wider font-grotesk text-lg focus:outline-none
                     focus:ring-2 focus:ring-coral/30"
          placeholder="e.g. 10+5+3"
          autoComplete="off"
        />
        <button
          type="submit"
          className="rounded-xl bg-coral px-6 py-2 text-white font-bold
                     hover:bg-coral-dark transition-colors"
        >
          Go
        </button>
      </form>
    </div>
  );
}

// ── Quick Fire ───────────────────────────────────────────────────────────────

function QuickFirePuzzle({
  payload,
  onComplete,
  onProgress,
}: {
  payload: { questions: { question: string; options: string[]; correctIndex: number }[] };
  onComplete: (accuracy: number) => void;
  onProgress: (progress: number) => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const question = payload.questions[currentQ];

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setAnswered(true);
    setSelectedIdx(idx);
    const isCorrect = idx === question.correctIndex;
    const newCorrect = correct + (isCorrect ? 1 : 0);
    if (isCorrect) setCorrect(newCorrect);
    onProgress(((currentQ + 1) / payload.questions.length) * 100);

    setTimeout(() => {
      if (currentQ + 1 >= payload.questions.length) {
        onComplete(newCorrect / payload.questions.length);
      } else {
        setCurrentQ(currentQ + 1);
        setAnswered(false);
        setSelectedIdx(null);
      }
    }, 800);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Quick Fire!</h3>
        <span className="text-sm text-text-muted">
          {currentQ + 1}/{payload.questions.length} · {correct} correct
        </span>
      </div>
      <p className="text-base font-medium mb-4">{question.question}</p>
      <div className="grid grid-cols-2 gap-2">
        {question.options.map((opt, i) => {
          let btnClass = "bg-surface hover:bg-surface-hover text-text-primary";
          if (answered) {
            if (i === question.correctIndex) btnClass = "bg-green/20 text-green ring-2 ring-green/30";
            else if (i === selectedIdx) btnClass = "bg-coral/20 text-coral ring-2 ring-coral/30";
            else btnClass = "bg-surface text-text-dim";
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={answered}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${btnClass}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Chain Link ───────────────────────────────────────────────────────────────

function ChainLinkPuzzle({
  payload,
  onComplete,
  onProgress,
}: {
  payload: { chain: string[] };
  onComplete: (accuracy: number) => void;
  onProgress: (progress: number) => void;
}) {
  const { chain } = payload;
  // Player must fill in the middle words (indices 1, 2, 3)
  const [guesses, setGuesses] = useState<string[]>(["", "", ""]);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [activeIdx]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const answer = chain[activeIdx + 1].toLowerCase();
    if (guesses[activeIdx].toLowerCase() === answer) {
      const newRevealed = [...revealed];
      newRevealed[activeIdx] = true;
      setRevealed(newRevealed);

      const solvedCount = newRevealed.filter(Boolean).length;
      onProgress((solvedCount / 3) * 100);

      if (solvedCount === 3) {
        onComplete(1);
        return;
      }

      // Next unsolved
      let next = (activeIdx + 1) % 3;
      while (newRevealed[next] && next !== activeIdx) {
        next = (next + 1) % 3;
      }
      setActiveIdx(next);
      const newGuesses = [...guesses];
      newGuesses[next] = "";
      setGuesses(newGuesses);
    } else {
      const newGuesses = [...guesses];
      newGuesses[activeIdx] = "";
      setGuesses(newGuesses);
    }
  };

  return (
    <div className="text-center">
      <h3 className="text-lg font-bold mb-1">Complete the Chain!</h3>
      <p className="text-sm text-text-muted mb-4">Each pair forms a compound word</p>

      <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
        {chain.map((word, i) => {
          if (i === 0 || i === 4) {
            return (
              <span key={i} className="bg-teal/20 text-teal px-3 py-2 rounded-lg font-bold text-sm uppercase">
                {word}
              </span>
            );
          }
          const guessIdx = i - 1;
          if (revealed[guessIdx]) {
            return (
              <span key={i} className="bg-green/20 text-green px-3 py-2 rounded-lg font-bold text-sm uppercase">
                {word}
              </span>
            );
          }
          return (
            <button
              key={i}
              onClick={() => setActiveIdx(guessIdx)}
              className={`px-3 py-2 rounded-lg text-sm font-bold border-2 border-dashed transition-all
                ${guessIdx === activeIdx ? "border-coral text-coral" : "border-border text-text-dim"}`}
            >
              ?
            </button>
          );
        })}
      </div>

      {!revealed.every(Boolean) && (
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={guesses[activeIdx]}
            onChange={(e) => {
              const newGuesses = [...guesses];
              newGuesses[activeIdx] = e.target.value;
              setGuesses(newGuesses);
            }}
            className="flex-1 rounded-xl border border-border px-4 py-2 text-center
                       font-bold uppercase focus:outline-none focus:ring-2 focus:ring-coral/30"
            placeholder="Type word..."
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-xl bg-coral px-6 py-2 text-white font-bold
                       hover:bg-coral-dark transition-colors"
          >
            Go
          </button>
        </form>
      )}
    </div>
  );
}

// ── Letter Lock ──────────────────────────────────────────────────────────────

function LetterLockPuzzle({
  payload,
  onComplete,
  onProgress,
}: {
  payload: { word: string; maxGuesses: number };
  onComplete: (accuracy: number) => void;
  onProgress: (progress: number) => void;
}) {
  const { word, maxGuesses } = payload;
  const [guesses, setGuesses] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [guesses.length]);

  const evaluateGuess = (guess: string): ("correct" | "present" | "absent")[] => {
    const result: ("correct" | "present" | "absent")[] = [];
    const remaining = word.split("");

    // First pass: correct
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === word[i]) {
        result[i] = "correct";
        remaining[i] = "";
      }
    }

    // Second pass: present/absent
    for (let i = 0; i < guess.length; i++) {
      if (result[i]) continue;
      const idx = remaining.indexOf(guess[i]);
      if (idx !== -1) {
        result[i] = "present";
        remaining[idx] = "";
      } else {
        result[i] = "absent";
      }
    }

    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.length !== word.length) return;

    const upperInput = input.toUpperCase();
    const newGuesses = [...guesses, upperInput];
    setGuesses(newGuesses);
    setInput("");
    onProgress((newGuesses.length / maxGuesses) * 100);

    if (upperInput === word) {
      onComplete(1 - (newGuesses.length - 1) * 0.15);
    } else if (newGuesses.length >= maxGuesses) {
      onComplete(0);
    }
  };

  const colorMap = { correct: "bg-green text-white", present: "bg-amber text-white", absent: "bg-gray-300 text-gray-600" };

  return (
    <div className="text-center">
      <h3 className="text-lg font-bold mb-1">Guess the Word!</h3>
      <p className="text-sm text-text-muted mb-4">
        {word.length} letters · {maxGuesses - guesses.length} guesses left
      </p>

      <div className="space-y-2 mb-4">
        {guesses.map((guess, gi) => {
          const eval_ = evaluateGuess(guess);
          return (
            <div key={gi} className="flex justify-center gap-1">
              {guess.split("").map((letter, li) => (
                <div
                  key={li}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold
                    text-sm ${colorMap[eval_[li]]}`}
                >
                  {letter}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {guesses.length < maxGuesses && guesses[guesses.length - 1] !== word && (
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            maxLength={word.length}
            className="flex-1 rounded-xl border border-border px-4 py-2 text-center
                       font-bold tracking-wider uppercase focus:outline-none focus:ring-2
                       focus:ring-coral/30"
            placeholder={`${word.length} letters...`}
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-xl bg-coral px-6 py-2 text-white font-bold
                       hover:bg-coral-dark transition-colors"
          >
            Go
          </button>
        </form>
      )}
    </div>
  );
}

// ── Rank It ──────────────────────────────────────────────────────────────────

function RankItPuzzle({
  payload,
  onComplete,
  onProgress,
}: {
  payload: { prompt: string; items: { label: string; value: number }[] };
  onComplete: (accuracy: number) => void;
  onProgress: (progress: number) => void;
}) {
  const [items, setItems] = useState(payload.items);
  const [submitted, setSubmitted] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const moveItem = (from: number, to: number) => {
    if (submitted) return;
    const newItems = [...items];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    setItems(newItems);
    onProgress(50); // partial progress on interaction
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // Check how many items are in the correct position
    const sorted = [...payload.items].sort((a, b) => a.value - b.value);
    let correct = 0;
    for (let i = 0; i < items.length; i++) {
      if (items[i].label === sorted[i].label) correct++;
    }
    onProgress(100);
    onComplete(correct / items.length);
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-1">Rank It!</h3>
      <p className="text-sm text-text-muted mb-4">{payload.prompt}</p>

      <div className="space-y-2 mb-4">
        {items.map((item, i) => (
          <div
            key={item.label}
            draggable={!submitted}
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIdx !== null && dragIdx !== i) moveItem(dragIdx, i);
              setDragIdx(null);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-grab
              active:cursor-grabbing transition-all
              ${submitted ? "cursor-default" : "hover:bg-surface-hover"}
              ${dragIdx === i ? "opacity-50" : ""}
              bg-surface border border-border`}
          >
            <span className="text-sm font-bold text-text-muted w-6">{i + 1}.</span>
            <span className="text-sm font-medium flex-1">{item.label}</span>
            {!submitted && (
              <div className="flex flex-col gap-0.5">
                {i > 0 && (
                  <button
                    onClick={() => moveItem(i, i - 1)}
                    className="text-xs text-text-muted hover:text-text-primary"
                  >
                    ▲
                  </button>
                )}
                {i < items.length - 1 && (
                  <button
                    onClick={() => moveItem(i, i + 1)}
                    className="text-xs text-text-muted hover:text-text-primary"
                  >
                    ▼
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full rounded-xl bg-coral py-3 text-white font-bold
                     hover:bg-coral-dark transition-colors"
        >
          Lock In
        </button>
      )}
    </div>
  );
}
