"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { SAT_ACT_VOCAB, type VocabEntry } from "@/data/sat-act-vocab";

const MASTERY_KEY = "gamesite-sat-act-vocab-mastery";
const ONBOARDED_KEY = "gamesite-sat-act-vocab-onboarded";
const STREAK_KEY = "gamesite-sat-act-vocab-streak";
const REVIEW_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const FLAGGED_PICK_PROBABILITY = 0.25;

// ── Question types ──────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  "wordToDef",
  "synonym",
  "antonym",
  "wordInContext",
  "sentenceCompletion",
] as const;
type QuestionType = (typeof QUESTION_TYPES)[number];

const QUESTION_LABELS: Record<QuestionType, string> = {
  wordToDef: "Word → Definition",
  synonym: "Synonym",
  antonym: "Antonym",
  wordInContext: "Word in Context",
  sentenceCompletion: "Sentence Completion",
};

// ── Mastery types ───────────────────────────────────────────────────────────

interface WordMastery {
  /** Per-question-type mastery with timestamp for spaced-repetition decay. */
  types: Partial<Record<QuestionType, { masteredAt: string }>>;
  attempts: number;
  lastSeen: string;
  flagged?: boolean;
}

type MasteryData = Record<string, WordMastery>;

type MasteryLevel = "mastered" | "familiar" | "learning" | "new" | "unseen";

function isFresh(masteredAt: string): boolean {
  const ms = Date.now() - new Date(masteredAt).getTime();
  return Number.isFinite(ms) && ms < REVIEW_INTERVAL_MS;
}

function freshTypeCount(m: WordMastery): number {
  return Object.values(m.types).filter(
    (v): v is { masteredAt: string } => !!v && isFresh(v.masteredAt),
  ).length;
}

function getMasteryLevel(m: WordMastery | undefined, available: number): MasteryLevel {
  if (!m) return "unseen";
  const fresh = freshTypeCount(m);
  if (fresh >= available) return "mastered";
  if (fresh >= 3) return "familiar";
  if (fresh >= 1) return "learning";
  return "new";
}

const masteryColors: Record<MasteryLevel, string> = {
  mastered: "bg-green text-white",
  familiar: "bg-teal text-white",
  learning: "bg-amber text-white",
  new: "bg-coral text-white",
  unseen: "bg-gray-200 text-text-dim",
};

const masteryLabels: Record<MasteryLevel, string> = {
  mastered: "Mastered",
  familiar: "Familiar",
  learning: "Learning",
  new: "New",
  unseen: "Unseen",
};

// ── Persistence + migration ─────────────────────────────────────────────────

interface LegacyWordMastery {
  masteredTypes?: string[];
  attempts?: number;
  lastSeen?: string;
}

function migrateMastery(raw: unknown): MasteryData {
  if (!raw || typeof raw !== "object") return {};
  const result: MasteryData = {};
  const now = new Date().toISOString();
  for (const [word, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const v = value as LegacyWordMastery & WordMastery;
    if (Array.isArray(v.masteredTypes)) {
      // Old format — convert array to per-type timestamp map.
      const types: WordMastery["types"] = {};
      for (const t of v.masteredTypes) {
        if ((QUESTION_TYPES as readonly string[]).includes(t)) {
          types[t as QuestionType] = { masteredAt: now };
        }
      }
      result[word] = {
        types,
        attempts: v.attempts ?? 0,
        lastSeen: v.lastSeen ?? now,
      };
    } else if (v.types && typeof v.types === "object") {
      result[word] = {
        types: v.types,
        attempts: v.attempts ?? 0,
        lastSeen: v.lastSeen ?? now,
        flagged: v.flagged,
      };
    }
  }
  return result;
}

function loadMastery(): MasteryData {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MASTERY_KEY);
    if (raw) return migrateMastery(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return {};
}

function saveMastery(data: MasteryData) {
  try {
    localStorage.setItem(MASTERY_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function availableTypes(entry: VocabEntry): QuestionType[] {
  return QUESTION_TYPES.filter((t) => {
    if (t === "synonym") return entry.synonyms.length >= 1;
    if (t === "antonym") return entry.antonyms.length >= 1;
    return true;
  });
}

function pickNextWord(mastery: MasteryData, prevWord: string | null): VocabEntry {
  const candidates = SAT_ACT_VOCAB.filter((e) => e.word !== prevWord);

  const flagged = candidates.filter((e) => mastery[e.word]?.flagged);
  if (flagged.length > 0 && Math.random() < FLAGGED_PICK_PROBABILITY) {
    return flagged[Math.floor(Math.random() * flagged.length)];
  }

  const unseen = candidates.filter((e) => !mastery[e.word]);
  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }

  // Words with at least one needs-review type.
  const needsReview = candidates.filter((e) => {
    const m = mastery[e.word];
    if (!m) return true;
    return availableTypes(e).some(
      (t) => !m.types[t] || !isFresh(m.types[t]!.masteredAt),
    );
  });
  if (needsReview.length > 0) {
    return needsReview[Math.floor(Math.random() * needsReview.length)];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function pickQuestionType(mastery: MasteryData, entry: VocabEntry): QuestionType {
  const avail = availableTypes(entry);
  const m = mastery[entry.word];
  const needsReview = avail.filter((t) => {
    const ts = m?.types[t]?.masteredAt;
    return !ts || !isFresh(ts);
  });
  const pool = needsReview.length > 0 ? needsReview : avail;
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(answer: string, pool: VocabEntry[], pos: string, count = 3): VocabEntry[] {
  const samePos = pool.filter(
    (e) => e.pos === pos && e.word.toLowerCase() !== answer.toLowerCase(),
  );
  return shuffle(samePos).slice(0, count);
}

/**
 * Smarter synonym/antonym distractor pool.
 * Includes one "tempting wrong" answer (an antonym for a synonym question, or vice versa)
 * plus same-POS random distractors that are *not* on the correct list.
 */
function pickSynAntDistractors(entry: VocabEntry, type: "synonym" | "antonym"): string[] {
  const correctList = type === "synonym" ? entry.synonyms : entry.antonyms;
  const oppositeList = type === "synonym" ? entry.antonyms : entry.synonyms;
  const out: string[] = [];
  const used = new Set<string>([
    entry.word.toLowerCase(),
    ...correctList.map((s) => s.toLowerCase()),
  ]);

  // 1 tempting wrong answer from the opposite list, if available.
  for (const o of oppositeList) {
    if (!used.has(o.toLowerCase())) {
      out.push(o);
      used.add(o.toLowerCase());
      break;
    }
  }

  // Fill remainder with same-POS random words (not in correct/opposite/used).
  const samePosPool = SAT_ACT_VOCAB.filter(
    (e) => e.pos === entry.pos && e.word.toLowerCase() !== entry.word.toLowerCase(),
  );
  for (const candidate of shuffle(samePosPool)) {
    if (out.length >= 3) break;
    const w = candidate.word.toLowerCase();
    if (used.has(w)) continue;
    out.push(candidate.word);
    used.add(w);
  }
  return out;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitExample(example: string, word: string): { text: string; bold: boolean }[] {
  const re = new RegExp(`\\b${escapeRegExp(word)}(?:s|es|ed|ing|ly|d)?\\b`, "gi");
  const parts: { text: string; bold: boolean }[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(example)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ text: example.slice(lastIndex, m.index), bold: false });
    }
    parts.push({ text: m[0], bold: true });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < example.length) {
    parts.push({ text: example.slice(lastIndex), bold: false });
  }
  return parts.length > 0 ? parts : [{ text: example, bold: false }];
}

function maskExample(example: string, word: string): string {
  const re = new RegExp(`\\b${escapeRegExp(word)}(?:s|es|ed|ing|ly|d)?\\b`, "gi");
  return example.replace(re, "_____");
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function countMasteredToday(mastery: MasteryData): number {
  const key = todayKey();
  let count = 0;
  for (const wm of Object.values(mastery)) {
    for (const t of Object.values(wm.types)) {
      if (t && t.masteredAt.slice(0, 10) === key) count++;
    }
  }
  return count;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function SATACTVocabGame() {
  const [mastery, setMastery] = useState<MasteryData>({});
  const [entry, setEntry] = useState<VocabEntry | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>("wordToDef");
  const [choices, setChoices] = useState<VocabEntry[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [showMastery, setShowMastery] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<MasteryLevel | "flagged" | "all">("all");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Initial setup.
  useEffect(() => {
    const m = loadMastery();
    setMastery(m);
    const next = pickNextWord(m, null);
    const type = pickQuestionType(m, next);
    setEntry(next);
    setQuestionType(type);
    setChoices(buildChoices(next, type));
    // Streak from localStorage.
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.value === "number") setStreak(parsed.value);
      }
    } catch {
      /* ignore */
    }
    // Onboarding on first visit.
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) {
        setShowOnboarding(true);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildChoices(e: VocabEntry, type: QuestionType): VocabEntry[] {
    if (type === "wordToDef" || type === "wordInContext" || type === "sentenceCompletion") {
      const distractors = pickDistractors(e.word, SAT_ACT_VOCAB, e.pos, 3);
      return shuffle([e, ...distractors]);
    }
    if (type === "synonym" || type === "antonym") {
      const correctList = type === "synonym" ? e.synonyms : e.antonyms;
      if (correctList.length === 0) return [];
      const correctTerm = correctList[0];
      const distractors = pickSynAntDistractors(e, type);
      const allTerms = shuffle([correctTerm, ...distractors]);
      return allTerms.map((t) => ({
        word: t,
        pos: e.pos,
        definition: "",
        example: "",
        synonyms: [],
        antonyms: [],
      }));
    }
    return [];
  }

  const isCorrect = useCallback((): boolean => {
    if (!entry) return false;
    if (
      questionType === "wordToDef" ||
      questionType === "wordInContext" ||
      questionType === "sentenceCompletion"
    ) {
      return choices[selectedIdx ?? -1]?.word === entry.word;
    }
    if (questionType === "synonym") {
      return entry.synonyms
        .map((s) => s.toLowerCase())
        .includes(choices[selectedIdx ?? -1]?.word.toLowerCase() ?? "");
    }
    if (questionType === "antonym") {
      return entry.antonyms
        .map((a) => a.toLowerCase())
        .includes(choices[selectedIdx ?? -1]?.word.toLowerCase() ?? "");
    }
    return false;
  }, [entry, questionType, choices, selectedIdx]);

  const persistStreak = useCallback((next: number) => {
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify({ value: next, updatedAt: new Date().toISOString() }));
    } catch {
      /* ignore */
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!entry || hasChecked) return;
    const correct = isCorrect();
    setFeedback(correct ? "correct" : "incorrect");
    setHasChecked(true);

    // Update streak.
    const nextStreak = correct ? streak + 1 : 0;
    setStreak(nextStreak);
    persistStreak(nextStreak);

    // Update mastery. A correct answer (re)masters this question type and
    // refreshes its spaced-repetition timer, so a word that decayed after a
    // week can be re-mastered. (Previously masteredAt was only ever set the
    // first time, which permanently stranded decayed types in "needs review".)
    // A wrong answer demotes a previously-mastered type back to needs-review.
    const now = new Date().toISOString();
    const updated = { ...mastery };
    const prev = updated[entry.word] ?? {
      types: {},
      attempts: 0,
      lastSeen: "",
    };
    const types = { ...prev.types };
    if (correct) {
      types[questionType] = { masteredAt: now };
    } else if (types[questionType]) {
      // Demote to "needs review" (stale) rather than wiping it entirely.
      types[questionType] = { masteredAt: new Date(0).toISOString() };
    }
    updated[entry.word] = {
      ...prev,
      types,
      attempts: prev.attempts + 1,
      lastSeen: now,
    };
    setMastery(updated);
    saveMastery(updated);
  }, [entry, questionType, isCorrect, mastery, hasChecked, streak, persistStreak]);

  const advance = useCallback(
    (m: MasteryData, prevWord: string | null) => {
      const next = pickNextWord(m, prevWord);
      const type = pickQuestionType(m, next);
      setEntry(next);
      setQuestionType(type);
      setChoices(buildChoices(next, type));
      setSelectedIdx(null);
      setFeedback(null);
      setHasChecked(false);
    },
    [],
  );

  const handleNext = useCallback(() => {
    if (!entry) return;
    advance(mastery, entry.word);
  }, [entry, mastery, advance]);

  const handleSkip = useCallback(() => {
    if (!entry || hasChecked) return;
    advance(mastery, entry.word);
  }, [entry, mastery, advance, hasChecked]);

  const handleFlag = useCallback(() => {
    if (!entry) return;
    const updated = { ...mastery };
    const prev = updated[entry.word] ?? {
      types: {},
      attempts: 0,
      lastSeen: new Date().toISOString(),
    };
    updated[entry.word] = { ...prev, flagged: !prev.flagged };
    setMastery(updated);
    saveMastery(updated);
  }, [entry, mastery]);

  const handlePracticeWord = useCallback(
    (word: string, forcedType?: QuestionType) => {
      const e = SAT_ACT_VOCAB.find((v) => v.word === word);
      if (!e) return;
      const avail = availableTypes(e);
      const type =
        forcedType && avail.includes(forcedType)
          ? forcedType
          : pickQuestionType(mastery, e);
      setEntry(e);
      setQuestionType(type);
      setChoices(buildChoices(e, type));
      setSelectedIdx(null);
      setFeedback(null);
      setHasChecked(false);
      setSelectedWord(null);
      setShowMastery(false);
    },
    [mastery],
  );

  const dismissOnboarding = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowOnboarding(false);
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showOnboarding || showMastery) return;
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (e.key === "Enter") {
        // Enter: submit or advance. Don't override input default, let onKeyDown handle.
        if (!isTyping) {
          if (!hasChecked) {
            if (selectedIdx !== null) {
              e.preventDefault();
              handleSubmit();
            }
          } else {
            e.preventDefault();
            handleNext();
          }
        }
        return;
      }

      if (isTyping) return; // skip number/letter shortcuts while typing

      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < choices.length && choices.length > 0) {
          e.preventDefault();
          if (!hasChecked) {
            setSelectedIdx(idx);
          }
        }
        return;
      }
      if (e.key === "s" || e.key === "S") {
        if (!hasChecked) {
          e.preventDefault();
          handleSkip();
        }
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleFlag();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    showOnboarding,
    showMastery,
    hasChecked,
    selectedIdx,
    choices,
    handleSubmit,
    handleNext,
    handleSkip,
    handleFlag,
  ]);

  // Aggregate stats.
  const stats = useMemo(() => {
    let mastered = 0;
    let familiar = 0;
    let learning = 0;
    let attempted = 0;
    let flagged = 0;
    for (const e of SAT_ACT_VOCAB) {
      const m = mastery[e.word];
      if (!m) continue;
      attempted++;
      if (m.flagged) flagged++;
      const lvl = getMasteryLevel(m, availableTypes(e).length);
      if (lvl === "mastered") mastered++;
      else if (lvl === "familiar") familiar++;
      else if (lvl === "learning") learning++;
    }
    return { mastered, familiar, learning, attempted, flagged, total: SAT_ACT_VOCAB.length };
  }, [mastery]);

  const todayCount = useMemo(() => countMasteredToday(mastery), [mastery]);

  const handleResetProgress = () => {
    if (!confirm("Reset all SAT/ACT vocab progress? This cannot be undone.")) return;
    setMastery({});
    saveMastery({});
    setStreak(0);
    persistStreak(0);
    setShowMastery(false);
    advance({}, null);
  };

  if (!entry) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-text-dim">
        Loading…
      </div>
    );
  }

  // ── Onboarding modal ─────────────────────────────────────────────────────
  if (showOnboarding) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl border border-border-light shadow-xl max-w-md w-full p-6">
          <h2 className="text-2xl font-bold text-text-primary mb-3">SAT/ACT Vocab</h2>
          <p className="text-text-muted text-sm mb-3">
            Master {SAT_ACT_VOCAB.length} high-frequency SAT and ACT words.
          </p>
          <ul className="text-sm text-text-primary space-y-1.5 mb-4">
            <li>
              <span className="font-bold text-purple">5 question types per word</span> —
              definition matching, synonyms, antonyms, word in context, sentence completion.
            </li>
            <li>
              A word becomes <span className="font-bold text-green">Mastered</span> only after you
              nail every question type for it.
            </li>
            <li>
              Mastered types <span className="font-semibold">resurface for review</span> after a
              week so you don't forget them.
            </li>
            <li>
              Progress saves locally in your browser — no account needed.
            </li>
          </ul>
          <div className="bg-purple/5 rounded-lg px-3 py-2.5 text-xs text-text-muted mb-4 space-y-1">
            <p className="font-semibold uppercase text-text-dim text-[10px]">Keyboard shortcuts</p>
            <p>
              <kbd className="px-1.5 py-0.5 bg-white border border-border-light rounded text-[11px] font-mono">1</kbd>
              –
              <kbd className="px-1.5 py-0.5 bg-white border border-border-light rounded text-[11px] font-mono">4</kbd>
              {" "}pick a choice ·{" "}
              <kbd className="px-1.5 py-0.5 bg-white border border-border-light rounded text-[11px] font-mono">↵</kbd>
              {" "}check / next ·{" "}
              <kbd className="px-1.5 py-0.5 bg-white border border-border-light rounded text-[11px] font-mono">S</kbd>
              {" "}skip ·{" "}
              <kbd className="px-1.5 py-0.5 bg-white border border-border-light rounded text-[11px] font-mono">F</kbd>
              {" "}flag for later
            </p>
          </div>
          <button
            onClick={dismissOnboarding}
            className="w-full bg-purple text-white font-bold rounded-full py-3 text-sm hover:opacity-90"
          >
            Let's go
          </button>
        </div>
      </div>
    );
  }

  // ── Progress panel ───────────────────────────────────────────────────────
  if (showMastery) {
    const levelLabels: { value: typeof filterLevel; label: string }[] = [
      { value: "all", label: "All" },
      { value: "mastered", label: "Mastered" },
      { value: "familiar", label: "Familiar" },
      { value: "learning", label: "Learning" },
      { value: "new", label: "New" },
      { value: "unseen", label: "Unseen" },
      { value: "flagged", label: "Flagged" },
    ];

    const detail = selectedWord
      ? SAT_ACT_VOCAB.find((v) => v.word === selectedWord)
      : null;

    const q = searchQuery.trim().toLowerCase();
    const filtered = SAT_ACT_VOCAB
      .filter((e) => (q ? e.word.toLowerCase().includes(q) : true))
      .filter((e) => {
        if (filterLevel === "all") return true;
        if (filterLevel === "flagged") return mastery[e.word]?.flagged === true;
        const lvl = getMasteryLevel(mastery[e.word], availableTypes(e).length);
        return lvl === filterLevel;
      })
      .sort((a, b) => a.word.localeCompare(b.word));

    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-text-primary">Your Vocab Progress</h1>
          <button
            onClick={() => setShowMastery(false)}
            className="rounded-full bg-purple text-white font-bold px-5 py-2 text-sm hover:opacity-90"
          >
            Back to game
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
          <div className="bg-white border border-border-light rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green tabular-nums">{stats.mastered}</div>
            <div className="text-xs text-text-dim font-medium uppercase">Mastered</div>
          </div>
          <div className="bg-white border border-border-light rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-teal tabular-nums">{stats.familiar}</div>
            <div className="text-xs text-text-dim font-medium uppercase">Familiar</div>
          </div>
          <div className="bg-white border border-border-light rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-amber tabular-nums">{stats.learning}</div>
            <div className="text-xs text-text-dim font-medium uppercase">Learning</div>
          </div>
          <div className="bg-white border border-border-light rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-text-primary tabular-nums">{stats.attempted}</div>
            <div className="text-xs text-text-dim font-medium uppercase">Attempted</div>
          </div>
          <div className="bg-white border border-border-light rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-text-primary tabular-nums">{stats.total}</div>
            <div className="text-xs text-text-dim font-medium uppercase">Total</div>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words…"
            className="flex-1 rounded-xl border-2 border-border-light bg-white px-4 py-2 text-sm text-text-primary placeholder-text-dim focus:border-purple focus:outline-none transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {levelLabels.map((l) => (
            <button
              key={l.value}
              onClick={() => setFilterLevel(l.value)}
              className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                filterLevel === l.value
                  ? "bg-purple text-white border-purple"
                  : "bg-white text-text-primary border-border-light hover:border-purple/50"
              }`}
            >
              {l.label}
              {l.value === "flagged" && stats.flagged > 0 ? ` (${stats.flagged})` : ""}
            </button>
          ))}
        </div>

        <div className="bg-white border border-border-light rounded-2xl divide-y divide-border-light max-h-[55vh] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-text-dim text-sm">No words match.</div>
          )}
          {filtered.map((e) => {
            const m = mastery[e.word];
            const max = availableTypes(e).length;
            const level = getMasteryLevel(m, max);
            const count = m ? freshTypeCount(m) : 0;
            return (
              <button
                key={e.word}
                onClick={() => setSelectedWord(e.word)}
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-purple/5 transition-colors"
              >
                <span className="flex-1 text-sm text-text-primary font-medium">{e.word}</span>
                {m?.flagged && (
                  <span className="text-amber text-xs font-bold">⚑</span>
                )}
                <span className="text-xs text-text-dim italic w-20">{e.pos}</span>
                <span className="text-xs text-text-dim tabular-nums">
                  {count}/{max}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${masteryColors[level]}`}
                >
                  {masteryLabels[level]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleResetProgress}
            className="text-xs text-coral hover:underline"
          >
            Reset all progress
          </button>
        </div>

        {/* Word detail modal */}
        {detail && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setSelectedWord(null)}
          >
            <div
              className="bg-white rounded-2xl border border-border-light shadow-xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">{detail.word}</h2>
                  <p className="text-text-dim text-sm italic">{detail.pos}</p>
                </div>
                <button
                  onClick={() => setSelectedWord(null)}
                  className="text-text-dim hover:text-text-primary text-xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <p className="text-text-primary text-sm mb-3">{detail.definition}</p>
              <p className="text-text-muted text-sm italic mb-4">&ldquo;{detail.example}&rdquo;</p>

              {detail.synonyms.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold uppercase text-text-dim mb-1">Synonyms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.synonyms.map((s) => (
                      <span key={s} className="text-xs bg-purple/10 text-purple rounded-full px-2.5 py-0.5 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detail.antonyms.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase text-text-dim mb-1">Antonyms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.antonyms.map((a) => (
                      <span key={a} className="text-xs bg-coral/10 text-coral rounded-full px-2.5 py-0.5 font-medium">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mastery breakdown */}
              <div className="border-t border-border-light pt-4 mb-4">
                <p className="text-[10px] font-bold uppercase text-text-dim mb-2">Mastery</p>
                <div className="space-y-1.5">
                  {availableTypes(detail).map((t) => {
                    const ts = mastery[detail.word]?.types[t]?.masteredAt;
                    const fresh = ts ? isFresh(ts) : false;
                    const stale = ts && !fresh;
                    return (
                      <button
                        key={t}
                        onClick={() => handlePracticeWord(detail.word, t)}
                        className="w-full flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 hover:bg-purple/5 transition-colors text-left"
                        title="Practice this question type"
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            fresh
                              ? "bg-green text-white"
                              : stale
                                ? "bg-amber text-white"
                                : "bg-gray-200 text-text-dim"
                          }`}
                        >
                          {fresh ? "✓" : stale ? "↻" : "·"}
                        </span>
                        <span className="flex-1 text-text-primary">{QUESTION_LABELS[t]}</span>
                        <span className="text-text-dim">
                          {fresh ? "Mastered" : stale ? "Needs review" : "Not yet"}
                        </span>
                        <span className="text-text-dim text-[10px]">→</span>
                      </button>
                    );
                  })}
                </div>
                {(() => {
                  const m = mastery[detail.word];
                  if (!m) return null;
                  return (
                    <p className="text-[11px] text-text-dim mt-3">
                      {m.attempts} attempt{m.attempts === 1 ? "" : "s"}
                      {m.flagged ? " · ⚑ flagged" : ""}
                    </p>
                  );
                })()}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const updated = { ...mastery };
                    const prev = updated[detail.word] ?? {
                      types: {},
                      attempts: 0,
                      lastSeen: new Date().toISOString(),
                    };
                    updated[detail.word] = { ...prev, flagged: !prev.flagged };
                    setMastery(updated);
                    saveMastery(updated);
                  }}
                  className={`flex-1 font-bold rounded-full py-2.5 text-sm transition-colors ${
                    mastery[detail.word]?.flagged
                      ? "bg-amber text-white hover:opacity-90"
                      : "bg-amber/10 text-amber hover:bg-amber/20"
                  }`}
                >
                  ⚑ {mastery[detail.word]?.flagged ? "Flagged" : "Flag"}
                </button>
                <button
                  onClick={() => handlePracticeWord(detail.word)}
                  className="flex-1 bg-purple text-white font-bold rounded-full py-2.5 text-sm hover:opacity-90"
                >
                  Practice now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Main game ─────────────────────────────────────────────────────────────
  const totalAvailable = availableTypes(entry).length;
  const wordMastery = mastery[entry.word];
  const wordMasteryCount = wordMastery ? freshTypeCount(wordMastery) : 0;
  const isFlagged = wordMastery?.flagged === true;

  return (
    <div className="flex min-h-[80vh] flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">SAT/ACT Vocab</h1>
            <p className="text-text-dim text-xs">
              {stats.mastered} mastered · {todayCount} today
              {streak > 1 ? <> · <span className="text-amber font-semibold">🔥 {streak} streak</span></> : null}
            </p>
          </div>
          <button
            onClick={() => setShowMastery(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-purple/10 text-purple hover:bg-purple/20 transition-colors"
            aria-label="View progress"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-border-light p-6 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple">
                {QUESTION_LABELS[questionType]}
              </span>
              <span
                className="flex items-center gap-1"
                aria-label={`${wordMasteryCount} of ${totalAvailable} question types mastered for this word`}
              >
                {availableTypes(entry).map((t) => {
                  const ts = wordMastery?.types[t]?.masteredAt;
                  const done = ts ? isFresh(ts) : false;
                  return (
                    <span
                      key={t}
                      className={`h-1.5 w-1.5 rounded-full ${done ? "bg-green" : "bg-gray-300"}`}
                    />
                  );
                })}
              </span>
            </div>
            <button
              onClick={handleFlag}
              className={`text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                isFlagged
                  ? "bg-amber text-white"
                  : "bg-amber/10 text-amber hover:bg-amber/20"
              }`}
              aria-label="Flag word for later"
              title="Flag for later (F)"
            >
              ⚑ {isFlagged ? "Flagged" : "Flag"}
            </button>
          </div>

          {questionType === "wordToDef" && (
            <>
              <p className="text-2xl font-bold text-text-primary mb-1">{entry.word}</p>
              <p className="text-text-dim text-sm italic mb-4">{entry.pos}</p>
              <p className="text-text-muted text-sm mb-3">Pick the best definition:</p>
              <div className="space-y-2">
                {choices.map((c, i) => (
                  <ChoiceButton
                    key={`${c.word}-${i}`}
                    index={i}
                    label={c.definition || c.word}
                    selected={selectedIdx === i}
                    isCorrectChoice={c.word === entry.word}
                    hasChecked={hasChecked}
                    onClick={() => !hasChecked && setSelectedIdx(i)}
                  />
                ))}
              </div>
            </>
          )}

          {(questionType === "synonym" || questionType === "antonym") && (
            <>
              <p className="text-2xl font-bold text-text-primary mb-1">{entry.word}</p>
              <p className="text-text-dim text-sm italic mb-1">{entry.pos}</p>
              <p className="text-text-muted text-sm mb-4">{entry.definition}</p>
              <p className="text-text-muted text-sm mb-3">
                Which word is the closest{" "}
                <span className="font-semibold text-purple">
                  {questionType === "synonym" ? "synonym" : "antonym"}
                </span>
                ?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {choices.map((c, i) => {
                  const list = questionType === "synonym" ? entry.synonyms : entry.antonyms;
                  const isCorrectChoice = list
                    .map((s) => s.toLowerCase())
                    .includes(c.word.toLowerCase());
                  return (
                    <ChoiceButton
                      key={`${c.word}-${i}`}
                      index={i}
                      label={c.word}
                      compact
                      selected={selectedIdx === i}
                      isCorrectChoice={isCorrectChoice}
                      hasChecked={hasChecked}
                      onClick={() => !hasChecked && setSelectedIdx(i)}
                    />
                  );
                })}
              </div>
            </>
          )}

          {questionType === "wordInContext" && (
            <>
              <p className="text-text-dim text-sm mb-1 italic">{entry.pos}</p>
              <p className="text-lg text-text-primary leading-snug mb-4">
                &ldquo;
                {splitExample(entry.example, entry.word).map((seg, i) =>
                  seg.bold ? (
                    <span key={i} className="font-bold text-purple">
                      {seg.text}
                    </span>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  ),
                )}
                &rdquo;
              </p>
              <p className="text-text-muted text-sm mb-3">
                Based on the sentence, what does the highlighted word mean?
              </p>
              <div className="space-y-2">
                {choices.map((c, i) => (
                  <ChoiceButton
                    key={`${c.word}-${i}`}
                    index={i}
                    label={c.definition || c.word}
                    selected={selectedIdx === i}
                    isCorrectChoice={c.word === entry.word}
                    hasChecked={hasChecked}
                    onClick={() => !hasChecked && setSelectedIdx(i)}
                  />
                ))}
              </div>
            </>
          )}

          {questionType === "sentenceCompletion" && (
            <>
              <p className="text-text-dim text-sm mb-1 italic">{entry.pos}</p>
              <p className="text-lg text-text-primary leading-snug mb-4">
                &ldquo;{maskExample(entry.example, entry.word)}&rdquo;
              </p>
              <p className="text-text-muted text-sm mb-3">Which word best fills the blank?</p>
              <div className="grid grid-cols-2 gap-2">
                {choices.map((c, i) => (
                  <ChoiceButton
                    key={`${c.word}-${i}`}
                    index={i}
                    label={c.word}
                    compact
                    selected={selectedIdx === i}
                    isCorrectChoice={c.word === entry.word}
                    hasChecked={hasChecked}
                    onClick={() => !hasChecked && setSelectedIdx(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Feedback */}
        {hasChecked && (
          <div
            className={`bg-white rounded-2xl border-2 ${
              feedback === "correct" ? "border-green" : "border-coral"
            } p-5 mb-4 shadow-sm`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xl ${feedback === "correct" ? "text-green" : "text-coral"}`}>
                {feedback === "correct" ? "✓" : "✗"}
              </span>
              <span className="font-bold text-text-primary">
                {feedback === "correct" ? "Correct!" : `Answer: ${entry.word}`}
              </span>
            </div>
            <p className="text-sm text-text-primary mb-1">
              <span className="text-text-dim italic">{entry.pos}</span>{" "}
              <span className="text-text-muted">— {entry.definition}</span>
            </p>
            <p className="text-sm text-text-muted italic mb-2">&ldquo;{entry.example}&rdquo;</p>
            {entry.synonyms.length > 0 && (
              <p className="text-xs text-text-dim mb-1">
                <span className="font-semibold uppercase">Synonyms:</span>{" "}
                {entry.synonyms.join(", ")}
              </p>
            )}
            {entry.antonyms.length > 0 && (
              <p className="text-xs text-text-dim">
                <span className="font-semibold uppercase">Antonyms:</span>{" "}
                {entry.antonyms.join(", ")}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-text-dim">
                Mastery: {wordMasteryCount}/{totalAvailable}
              </span>
              <button
                onClick={handleNext}
                className="bg-purple text-white font-bold rounded-full px-5 py-2 text-sm hover:opacity-90"
              >
                Next word →
              </button>
            </div>
          </div>
        )}

        {/* Action row (when not yet checked) */}
        {!hasChecked && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="bg-white border-2 border-border-light text-text-secondary font-bold rounded-full px-5 py-3 text-sm hover:bg-surface transition-colors"
              title="Skip (S)"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedIdx === null}
              className="flex-1 bg-purple text-white font-bold rounded-full py-3 text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              Check answer
            </button>
          </div>
        )}

        {/* Hint */}
        <p className="text-text-dim text-[11px] text-center mt-3">
          <kbd className="px-1 py-0.5 bg-white border border-border-light rounded text-[10px] font-mono">1</kbd>
          –
          <kbd className="px-1 py-0.5 bg-white border border-border-light rounded text-[10px] font-mono">4</kbd>
          {" "}pick ·{" "}
          <kbd className="px-1 py-0.5 bg-white border border-border-light rounded text-[10px] font-mono">↵</kbd>
          {" "}check / next ·{" "}
          <kbd className="px-1 py-0.5 bg-white border border-border-light rounded text-[10px] font-mono">S</kbd>
          {" "}skip ·{" "}
          <kbd className="px-1 py-0.5 bg-white border border-border-light rounded text-[10px] font-mono">F</kbd>
          {" "}flag
        </p>
      </div>
    </div>
  );
}

// ── Choice button (with keyboard hint) ──────────────────────────────────────

function ChoiceButton({
  index,
  label,
  compact = false,
  selected,
  isCorrectChoice,
  hasChecked,
  onClick,
}: {
  index: number;
  label: string;
  compact?: boolean;
  selected: boolean;
  isCorrectChoice: boolean;
  hasChecked: boolean;
  onClick: () => void;
}) {
  const base = "rounded-xl border-2 px-4 py-3 transition-colors flex items-start gap-2";
  const tone = hasChecked && isCorrectChoice
    ? "border-green bg-green/10 text-text-primary"
    : hasChecked && selected
      ? "border-coral bg-coral/10 text-text-primary"
      : selected
        ? "border-purple bg-purple/10 text-text-primary"
        : "border-border-light bg-white text-text-primary hover:border-purple/50";
  const shape = compact ? "text-sm font-medium text-center justify-center" : "text-sm text-left w-full";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={hasChecked}
      aria-pressed={selected}
      className={`${base} ${tone} ${shape}`}
    >
      <span className="text-text-dim font-mono text-xs mt-0.5 shrink-0">{index + 1}.</span>
      <span className="flex-1">{label}</span>
    </button>
  );
}
