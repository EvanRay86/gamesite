"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface TriviaPuzzle {
  id: string;
  puzzle_date: string;
  questions: { question: string; options: string[]; correctIndex: number; category: string }[];
  created_at: string;
}

interface CrosswordPuzzle {
  id: string;
  puzzle_date: string;
  title: string;
  entries: { answer: string; clue: string }[];
  created_at: string;
}

interface ClusterPuzzle {
  id: string;
  puzzle_date: string;
  groups: { category: string; color: string; words: string[]; difficulty: number }[];
  created_at: string;
}

interface FramedPuzzle {
  id: string;
  puzzle_date: string;
  title: string;
  year: number;
  variant: string;
  movie_slug: string;
  frames: string[];
  created_at: string;
}

interface HeardlePuzzle {
  id: string;
  puzzle_date: string;
  title: string;
  artist: string;
  year: number;
  variant: string;
  song_slug: string;
  created_at: string;
}

interface AnagramPuzzle {
  id: string;
  puzzle_date: string;
  words: { word: string; scrambled: string; hint: string }[];
  created_at: string;
}

interface WordLadderPuzzle {
  id: string;
  puzzle_date: string;
  start_word: string;
  end_word: string;
  solution: string[];
  created_at: string;
}

interface EmojiWordPuzzle {
  id: string;
  puzzle_date: string;
  rounds: { emojis: string; answer: string; hint?: string; difficulty: number }[];
  created_at: string;
}

interface Top5Puzzle {
  id: string;
  puzzle_date: string;
  category: string;
  items: { name: string; value: string | number }[];
  unit?: string;
  created_at: string;
}

interface QuotablePuzzle {
  id: string;
  puzzle_date: string;
  quote: string;
  attribution: string;
  hint?: string;
  options: string[];
  created_at: string;
}

interface TimelinePuzzle {
  id: string;
  puzzle_date: string;
  events: { description: string; year: number }[];
  created_at: string;
}

interface HexlePuzzle {
  id: string;
  puzzle_date: string;
  word: string;
  created_at: string;
}

interface ChainReactionPuzzle {
  id: string;
  puzzle_date: string;
  chain: string[];
  created_at: string;
}

interface PuzzleData {
  trivia: TriviaPuzzle[];
  crosswords: CrosswordPuzzle[];
  clusters: ClusterPuzzle[];
  framed: FramedPuzzle[];
  heardle: HeardlePuzzle[];
  anagram: AnagramPuzzle[];
  wordLadder: WordLadderPuzzle[];
  emojiWord: EmojiWordPuzzle[];
  top5: Top5Puzzle[];
  quotable: QuotablePuzzle[];
  timeline: TimelinePuzzle[];
  hexle: HexlePuzzle[];
  chainReaction: ChainReactionPuzzle[];
  fetchedAt: string;
}

type Tab = "overview" | "trivia" | "crossword" | "clusters" | "framed" | "heardle" | "anagram" | "word-ladder" | "emoji-word" | "top-5" | "quotable" | "timeline" | "hexle" | "chain-reaction" | "prompt";

/* ── Helpers ───────────────────────────────────────────────────────────── */

function getTodayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function daysFromNow(dateStr: string) {
  const diff = Math.ceil(
    (new Date(dateStr + "T00:00:00").getTime() - new Date(getTodayISO() + "T00:00:00").getTime()) /
      86_400_000
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `in ${diff}d`;
}

function statusColor(daysLeft: number) {
  if (daysLeft < 0) return "bg-gray-100 text-gray-500";
  if (daysLeft <= 1) return "bg-red-100 text-red-700";
  if (daysLeft <= 3) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

function daysLeftNum(dateStr: string) {
  return Math.ceil(
    (new Date(dateStr + "T00:00:00").getTime() - new Date(getTodayISO() + "T00:00:00").getTime()) /
      86_400_000
  );
}

function isPast(dateStr: string) {
  return daysLeftNum(dateStr) < 0;
}

/* ── Prompt Template ───────────────────────────────────────────────────── */

function buildPrompt(startDate: string, days: number) {
  const dates: string[] = [];
  const d = new Date(startDate + "T00:00:00");
  for (let i = 0; i < days; i++) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }

  return `Generate daily puzzles for my game site for these dates: ${dates.join(", ")}

For EACH date, generate:

## 1. TRIVIA (8 questions per date)
- 4 questions about current/recent news events (politics, sports, tech, entertainment, science)
- 4 general knowledge questions (science, history, geography, pop culture, etc.)
- Each question has exactly 4 options with one correct answer
- Mix current events and general knowledge randomly
- Use web search to find the latest news for each date

Format per date:
\`\`\`json
{
  "puzzle_date": "YYYY-MM-DD",
  "questions": [
    {
      "question": "What is...?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "category": "Current Events"
    }
  ]
}
\`\`\`

Categories: "Current Events" for news, or "Science", "History", "Geography", "Art", "Music", "Literature", "Nature", "Technology", "Culture", "Sports" for general knowledge.

## 2. CROSSWORD (12 entries per date)
- 6-8 entries from current news headlines (use web search for AP News, Reuters)
- 4-6 entries from pop culture (movies, TV, music, viral trends)
- Each answer: single word, 3-10 letters, ALL UPPERCASE, letters only
- Each clue: concise crossword-style, under 80 characters
- Prefer proper nouns and newsworthy terms
- Include words with common letters (S, T, E, A, R, N) for grid intersections

Format per date:
\`\`\`json
{
  "puzzle_date": "YYYY-MM-DD",
  "title": "Crossword #N",
  "entries": [
    { "answer": "EXAMPLE", "clue": "A sample clue" }
  ]
}
\`\`\`

## 3. ANAGRAM SCRAMBLE (5 words per date)
- 5 words per puzzle with specific lengths: words 1-3 are 5 letters, word 4 is 6 letters, word 5 is 7 letters
- Mix of categories: animals, science, geography, food, music, sports, etc.
- Each word has a scrambled version (shuffle the letters so it's not trivially obvious)
- Each word has a one-word category hint
- Difficulty ramps up: easy 5-letter words first, harder 6 and 7-letter words last

Format per date:
\`\`\`json
{
  "puzzle_date": "YYYY-MM-DD",
  "words": [
    { "word": "PLANET", "scrambled": "LENTAP", "hint": "Space" }
  ]
}
\`\`\`

## 4. EMOJI DECODER (5 rounds per date, progressive difficulty)
- 5 rounds per puzzle, one for each difficulty level (1-5)
- Round 1 (Easy): Simple, obvious emoji-to-word (e.g. 🌞🌻 = SUNFLOWER)
- Round 2 (Medium): Slightly less obvious, include a hint (e.g. 🐸👑💋 = FROG PRINCE)
- Round 3 (Tricky): Requires thinking, cultural reference (e.g. 👑🦁 = LION KING)
- Round 4 (Hard): Abstract connections needed (e.g. 🧊🏔️💀 = TITANIC)
- Round 5 (Expert): Very abstract, movies/books/phrases (e.g. 🌀😵🐰⏰ = ALICE IN WONDERLAND)
- Answers are UPPERCASE, can be single words or phrases
- Include a hint for rounds 2-5 (short, under 50 characters, not too obvious)
- Use diverse, creative emoji combinations
- No duplicate answers across dates

Format per date:
\`\`\`json
{
  "puzzle_date": "YYYY-MM-DD",
  "rounds": [
    { "emojis": "🌞🌻", "answer": "SUNFLOWER", "difficulty": 1 },
    { "emojis": "🐸👑💋", "answer": "FROG PRINCE", "hint": "A fairy tale transformation", "difficulty": 2 }
  ]
}
\`\`\`

## 5. TOP 5 (5 items per date)
- Each puzzle has a category (e.g., "Most populated US states") and exactly 5 items ranked in correct order (#1 highest to #5 lowest)
- Each item has a name and a display value (with units)
- Categories should be diverse: geography, science, sports, pop culture, history, nature, etc.
- Items should be well-known enough that players have a chance, but not trivially obvious ordering
- Avoid categories where the ordering is common knowledge to everyone

Format per date:
\`\`\`json
{
  "puzzle_date": "YYYY-MM-DD",
  "category": "Most populated U.S. states",
  "items": [
    { "name": "California", "value": "39.0M" },
    { "name": "Texas", "value": "30.5M" },
    { "name": "Florida", "value": "22.6M" },
    { "name": "New York", "value": "19.6M" },
    { "name": "Pennsylvania", "value": "12.9M" }
  ]
}
\`\`\`

## 6. QUOTABLE (1 quote per date)
- A famous, well-known quote with its attribution (person who said it)
- Include a one-word hint about the speaker's profession/role
- Include 10 plausible autocomplete options (people in the same field), with the correct answer included
- Quotes should be recognizable but not too easy — avoid the most overused quotes
- Mix categories: scientists, leaders, authors, entertainers, athletes, etc.

Format per date:
\`\`\`json
{
  "puzzle_date": "YYYY-MM-DD",
  "quote": "The only way to do great work is to love what you do.",
  "attribution": "Steve Jobs",
  "hint": "Tech visionary",
  "options": ["Steve Jobs", "Bill Gates", "Elon Musk", "Jeff Bezos", "Mark Zuckerberg", "Larry Page", "Tim Cook", "Satya Nadella", "Jack Dorsey", "Steve Wozniak"]
}
\`\`\`

## 7. TIMELINE (5 events per date)
- 5 historical/cultural events that players must put in chronological order
- Events should be from a cohesive theme (space, music, movies, inventions, sports, etc.)
- Each event has a short description and the year it occurred
- Events must be listed in correct chronological order (earliest to latest)
- Years should be spread apart enough to be distinguishable but close enough to be challenging
- Use well-known events that most people would recognize

Format per date:
\`\`\`json
{
  "puzzle_date": "YYYY-MM-DD",
  "events": [
    { "description": "Sputnik, the first satellite, is launched", "year": 1957 },
    { "description": "First humans walk on the Moon", "year": 1969 },
    { "description": "First Space Shuttle mission launches", "year": 1981 },
    { "description": "International Space Station receives first crew", "year": 2000 },
    { "description": "SpaceX sends first crew to the ISS", "year": 2020 }
  ]
}
\`\`\`

---

After generating, provide the SQL INSERT statements to run in Supabase SQL editor:

\`\`\`sql
-- Trivia
INSERT INTO trivia_puzzles (puzzle_date, questions) VALUES
('YYYY-MM-DD', '[...]'::jsonb);

-- Crosswords
INSERT INTO crossword_puzzles (puzzle_date, title, entries) VALUES
('YYYY-MM-DD', 'Crossword #N', '[...]'::jsonb);

-- Anagram
INSERT INTO anagram_puzzles (puzzle_date, words) VALUES
('YYYY-MM-DD', '[...]'::jsonb);

-- Emoji Decoder
INSERT INTO emoji_word_puzzles (puzzle_date, rounds) VALUES
('YYYY-MM-DD', '[...]'::jsonb);

-- Top 5
INSERT INTO top5_puzzles (puzzle_date, category, items) VALUES
('YYYY-MM-DD', 'Category Name', '[{"name":"...","value":"..."},...]'::jsonb);

-- Quotable
INSERT INTO quotable_puzzles (puzzle_date, quote, attribution, hint, options) VALUES
('YYYY-MM-DD', 'The quote text...', 'Speaker Name', 'Hint', '["Option1","Option2",...]'::jsonb);

-- Timeline
INSERT INTO timeline_puzzles (puzzle_date, events) VALUES
('YYYY-MM-DD', '[{"description":"...","year":1957},...]'::jsonb);
\`\`\`

IMPORTANT:
- Each trivia puzzle MUST have exactly 8 questions
- Each crossword MUST have exactly 12 entries
- correctIndex must be 0-3 and match the correct option
- Crossword answers MUST be A-Z only, no spaces/hyphens
- Each anagram MUST have exactly 5 words: first 3 words are 5 letters, 4th word is 6 letters, 5th word is 7 letters
- Scrambled letters must be a valid permutation of the answer (same letters, different order)
- Double-check that news references are factually accurate
- Make questions interesting and varied in difficulty
- Each emoji decoder puzzle MUST have exactly 5 rounds (difficulty 1-5)
- Emoji decoder answers should be fun, recognizable words/phrases
- Include hints for emoji decoder rounds 2-5
- Each Top 5 puzzle MUST have exactly 5 items in correct ranked order with display values
- Top 5 items array is stored in the correct order (#1 first, #5 last) — the game shuffles them
- Quotable options MUST include the correct attribution as one of the 10 options
- Timeline events MUST be listed in chronological order (earliest year first)
- Each timeline puzzle MUST have exactly 5 events with accurate years`;
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function AdminPage() {
  const [data, setData] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  // Prompt config
  const [promptStartDate, setPromptStartDate] = useState("");
  const [promptDays, setPromptDays] = useState(7);
  const [copied, setCopied] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPuzzles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/puzzles");
      if (!res.ok) throw new Error("Failed to fetch puzzles");
      const json: PuzzleData = await res.json();
      setData(json);

      // Auto-set prompt start date to day after last puzzle
      const allDates = [
        ...json.trivia.map((p) => p.puzzle_date),
        ...json.crosswords.map((p) => p.puzzle_date),
        ...json.anagram.map((p) => p.puzzle_date),
        ...json.top5.map((p) => p.puzzle_date),
        ...json.quotable.map((p) => p.puzzle_date),
        ...json.timeline.map((p) => p.puzzle_date),
        ...json.hexle.map((p) => p.puzzle_date),
      ];
      if (allDates.length > 0) {
        const latest = allDates.sort().pop()!;
        const next = new Date(latest + "T00:00:00");
        next.setDate(next.getDate() + 1);
        setPromptStartDate(next.toISOString().slice(0, 10));
      } else {
        setPromptStartDate(getTodayISO());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPuzzles();
  }, [fetchPuzzles]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(buildPrompt(promptStartDate, promptDays));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Edit / Delete handlers ───────────────────────────────────────────
  const handleUpdateDate = useCallback(async (type: string, id: string, newDate: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/puzzles/${type}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, puzzle_date: newDate }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }
      setEditingId(null);
      await fetchPuzzles();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setActionLoading(false);
    }
  }, [fetchPuzzles]);

  const handleDelete = useCallback(async (type: string, id: string, label: string) => {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/puzzles/${type}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      await fetchPuzzles();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setActionLoading(false);
    }
  }, [fetchPuzzles]);

  // ── Stats ───────────────────────────────────────────────────────────────
  const today = getTodayISO();
  const upcomingTrivia = data?.trivia.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingCrosswords = data?.crosswords.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingClusters = data?.clusters.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingFramed = data?.framed.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingHeardle = data?.heardle.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingAnagram = data?.anagram.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingWordLadder = data?.wordLadder.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingEmojiWord = data?.emojiWord.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingTop5 = data?.top5.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingQuotable = data?.quotable.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingTimeline = data?.timeline.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingHexle = data?.hexle.filter((p) => p.puzzle_date >= today) ?? [];
  const upcomingChainReaction = data?.chainReaction.filter((p) => p.puzzle_date >= today) ?? [];

  const latestTrivia = upcomingTrivia[upcomingTrivia.length - 1]?.puzzle_date;
  const latestCrossword = upcomingCrosswords[upcomingCrosswords.length - 1]?.puzzle_date;
  const latestClusters = upcomingClusters[upcomingClusters.length - 1]?.puzzle_date;
  const latestFramed = upcomingFramed[upcomingFramed.length - 1]?.puzzle_date;
  const latestHeardle = upcomingHeardle[upcomingHeardle.length - 1]?.puzzle_date;
  const latestAnagram = upcomingAnagram[upcomingAnagram.length - 1]?.puzzle_date;
  const latestWordLadder = upcomingWordLadder[upcomingWordLadder.length - 1]?.puzzle_date;
  const latestEmojiWord = upcomingEmojiWord[upcomingEmojiWord.length - 1]?.puzzle_date;
  const latestTop5 = upcomingTop5[upcomingTop5.length - 1]?.puzzle_date;
  const latestQuotable = upcomingQuotable[upcomingQuotable.length - 1]?.puzzle_date;
  const latestTimeline = upcomingTimeline[upcomingTimeline.length - 1]?.puzzle_date;
  const latestHexle = upcomingHexle[upcomingHexle.length - 1]?.puzzle_date;
  const latestChainReaction = upcomingChainReaction[upcomingChainReaction.length - 1]?.puzzle_date;

  const triviaBuffer = latestTrivia ? daysLeftNum(latestTrivia) : 0;
  const crosswordBuffer = latestCrossword ? daysLeftNum(latestCrossword) : 0;
  const framedBuffer = latestFramed ? daysLeftNum(latestFramed) : 0;
  const heardleBuffer = latestHeardle ? daysLeftNum(latestHeardle) : 0;
  const anagramBuffer = latestAnagram ? daysLeftNum(latestAnagram) : 0;
  const wordLadderBuffer = latestWordLadder ? daysLeftNum(latestWordLadder) : 0;
  const emojiWordBuffer = latestEmojiWord ? daysLeftNum(latestEmojiWord) : 0;
  const top5Buffer = latestTop5 ? daysLeftNum(latestTop5) : 0;
  const quotableBuffer = latestQuotable ? daysLeftNum(latestQuotable) : 0;
  const timelineBuffer = latestTimeline ? daysLeftNum(latestTimeline) : 0;
  const hexleBuffer = latestHexle ? daysLeftNum(latestHexle) : 0;
  const chainReactionBuffer = latestChainReaction ? daysLeftNum(latestChainReaction) : 0;

  const needsAttention = triviaBuffer <= 2 || crosswordBuffer <= 2 || framedBuffer <= 2 || heardleBuffer <= 2 || anagramBuffer <= 2 || wordLadderBuffer <= 2 || emojiWordBuffer <= 2 || top5Buffer <= 2 || quotableBuffer <= 2 || timelineBuffer <= 2 || hexleBuffer <= 2 || chainReactionBuffer <= 2;

  // ── Date edit controls ────────────────────────────────────────────────
  function DateControl({ id, date, type }: { id: string; date: string; type: string }) {
    const isEditing = editingId === id;
    if (isEditing) {
      return (
        <span className="inline-flex items-center gap-1">
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="rounded border border-border-light px-2 py-0.5 text-sm"
          />
          <button
            onClick={() => handleUpdateDate(type, id, editDate)}
            disabled={actionLoading}
            className="text-xs px-2 py-0.5 rounded bg-green text-white hover:bg-green/80 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
          >
            Cancel
          </button>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1">
        <span className="font-semibold text-text-primary">{date}</span>
        <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${statusColor(daysLeftNum(date))}`}>
          {daysFromNow(date)}
        </span>
        <button
          onClick={() => { setEditingId(id); setEditDate(date); }}
          className="ml-1 text-xs text-text-dim hover:text-text-secondary"
          title="Change date"
        >
          &#9998;
        </button>
      </span>
    );
  }

  function DeleteButton({ id, type, label }: { id: string; type: string; label: string }) {
    return (
      <button
        onClick={() => handleDelete(type, id, label)}
        disabled={actionLoading}
        className="text-xs px-2 py-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition-colors"
        title="Delete puzzle"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-border-light">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl text-text-primary">Admin Panel</h1>
              <p className="mt-1 text-sm text-text-muted">
                Manage daily puzzles and generate new content
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/framed"
                className="rounded-lg bg-green/10 px-3 py-2 text-sm font-medium text-green hover:bg-green/20 transition-colors"
              >
                Framed Builder
              </Link>
              <Link
                href="/admin/heardle"
                className="rounded-lg bg-purple/10 px-3 py-2 text-sm font-medium text-purple hover:bg-purple/20 transition-colors"
              >
                Heardle Builder
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex gap-1">
            {(["overview", "trivia", "crossword", "clusters", "framed", "heardle", "anagram", "word-ladder", "emoji-word", "top-5", "quotable", "timeline", "hexle", "chain-reaction", "prompt"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                  tab === t
                    ? "border-coral text-coral"
                    : "border-transparent text-text-muted hover:text-text-secondary"
                }`}
              >
                {t === "prompt" ? "Generate Puzzles" : t === "word-ladder" ? "Word Ladder" : t === "emoji-word" ? "Emoji Decoder" : t === "top-5" ? "Top 5" : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-muted">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-coral border-t-transparent mr-3" />
            Loading puzzles...
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-6 text-red-700">
            <p className="font-semibold">Error</p>
            <p className="mt-1 text-sm">{error}</p>
            <button onClick={fetchPuzzles} className="mt-3 text-sm underline">
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* ── Overview Tab ──────────────────────────────────────── */}
            {tab === "overview" && (
              <div className="space-y-6">
                {/* Alert banner */}
                {needsAttention && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                    <span className="text-xl">&#9888;</span>
                    <div>
                      <p className="font-semibold text-amber-800">Puzzles running low!</p>
                      <p className="text-sm text-amber-700 mt-1">
                        {triviaBuffer <= 2 && `Trivia: ${triviaBuffer} days remaining. `}
                        {crosswordBuffer <= 2 && `Crossword: ${crosswordBuffer} days remaining. `}
                        {framedBuffer <= 2 && `Framed: ${framedBuffer} days remaining. `}
                        {heardleBuffer <= 2 && `Heardle: ${heardleBuffer} days remaining. `}
                        {anagramBuffer <= 2 && `Anagram: ${anagramBuffer} days remaining. `}
                        {wordLadderBuffer <= 2 && `Word Ladder: ${wordLadderBuffer} days remaining. `}
                        {emojiWordBuffer <= 2 && `Emoji Decoder: ${emojiWordBuffer} days remaining. `}
                        {top5Buffer <= 2 && `Top 5: ${top5Buffer} days remaining. `}
                        {quotableBuffer <= 2 && `Quotable: ${quotableBuffer} days remaining. `}
                        {timelineBuffer <= 2 && `Timeline: ${timelineBuffer} days remaining. `}
                        {hexleBuffer <= 2 && `Hexle: ${hexleBuffer} days remaining. `}
                        {chainReactionBuffer <= 2 && `Chain Reaction: ${chainReactionBuffer} days remaining. `}
                        Switch to the &quot;Generate Puzzles&quot; tab to create more.
                      </p>
                    </div>
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard
                    label="Trivia"
                    count={data!.trivia.length}
                    upcoming={upcomingTrivia.length}
                    lastDate={latestTrivia}
                    color="sky"
                    buffer={triviaBuffer}
                  />
                  <StatCard
                    label="Crossword"
                    count={data!.crosswords.length}
                    upcoming={upcomingCrosswords.length}
                    lastDate={latestCrossword}
                    color="amber"
                    buffer={crosswordBuffer}
                  />
                  <StatCard
                    label="Clusters"
                    count={data!.clusters.length}
                    upcoming={upcomingClusters.length}
                    lastDate={latestClusters}
                    color="coral"
                    buffer={latestClusters ? daysLeftNum(latestClusters) : 0}
                  />
                  <StatCard
                    label="Framed"
                    count={data!.framed.length}
                    upcoming={upcomingFramed.length}
                    lastDate={latestFramed}
                    color="green"
                    buffer={framedBuffer}
                  />
                  <StatCard
                    label="Heardle"
                    count={data!.heardle.length}
                    upcoming={upcomingHeardle.length}
                    lastDate={latestHeardle}
                    color="purple"
                    buffer={heardleBuffer}
                  />
                  <StatCard
                    label="Anagram"
                    count={data!.anagram.length}
                    upcoming={upcomingAnagram.length}
                    lastDate={latestAnagram}
                    color="teal"
                    buffer={anagramBuffer}
                  />
                  <StatCard
                    label="Word Ladder"
                    count={data!.wordLadder.length}
                    upcoming={upcomingWordLadder.length}
                    lastDate={latestWordLadder}
                    color="teal"
                    buffer={wordLadderBuffer}
                  />
                  <StatCard
                    label="Emoji Decoder"
                    count={data!.emojiWord.length}
                    upcoming={upcomingEmojiWord.length}
                    lastDate={latestEmojiWord}
                    color="amber"
                    buffer={emojiWordBuffer}
                  />
                  <StatCard
                    label="Top 5"
                    count={data!.top5.length}
                    upcoming={upcomingTop5.length}
                    lastDate={latestTop5}
                    color="amber"
                    buffer={top5Buffer}
                  />
                  <StatCard
                    label="Quotable"
                    count={data!.quotable.length}
                    upcoming={upcomingQuotable.length}
                    lastDate={latestQuotable}
                    color="purple"
                    buffer={quotableBuffer}
                  />
                  <StatCard
                    label="Timeline"
                    count={data!.timeline.length}
                    upcoming={upcomingTimeline.length}
                    lastDate={latestTimeline}
                    color="teal"
                    buffer={timelineBuffer}
                  />
                  <StatCard
                    label="Hexle"
                    count={data!.hexle.length}
                    upcoming={upcomingHexle.length}
                    lastDate={latestHexle}
                    color="amber"
                    buffer={hexleBuffer}
                  />
                  <StatCard
                    label="Chain Reaction"
                    count={data!.chainReaction.length}
                    upcoming={upcomingChainReaction.length}
                    lastDate={latestChainReaction}
                    color="coral"
                    buffer={chainReactionBuffer}
                  />
                </div>

                {/* Timeline */}
                <div>
                  <h2 className="font-display text-xl text-text-primary mb-4">Timeline</h2>
                  <div className="rounded-xl border border-border-light overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface text-left text-text-muted">
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Trivia</th>
                          <th className="px-4 py-3 font-medium">Crossword</th>
                          <th className="px-4 py-3 font-medium">Clusters</th>
                          <th className="px-4 py-3 font-medium">Framed</th>
                          <th className="px-4 py-3 font-medium">Heardle</th>
                          <th className="px-4 py-3 font-medium">Anagram</th>
                          <th className="px-4 py-3 font-medium">Word Ladder</th>
                          <th className="px-4 py-3 font-medium">Emoji Decoder</th>
                          <th className="px-4 py-3 font-medium">Top 5</th>
                          <th className="px-4 py-3 font-medium">Quotable</th>
                          <th className="px-4 py-3 font-medium">Timeline</th>
                          <th className="px-4 py-3 font-medium">Hexle</th>
                          <th className="px-4 py-3 font-medium">Chain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buildTimeline(data!).map((row) => (
                          <tr
                            key={row.date}
                            className={`border-t border-border ${
                              row.date === today ? "bg-amber-50/50" : isPast(row.date) ? "opacity-50" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium text-text-primary">{row.date}</span>
                              <span className="ml-2 text-text-dim text-xs">
                                {daysFromNow(row.date)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasTrivia} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasCrossword} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasClusters} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasFramed} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasHeardle} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasAnagram} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasWordLadder} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasEmojiWord} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasTop5} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasQuotable} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasTimeline} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasHexle} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot ok={row.hasChainReaction} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Trivia Tab ────────────────────────────────────────── */}
            {tab === "trivia" && (
              <PuzzleList
                title="Trivia Puzzles"
                items={data!.trivia}
                renderItem={(p: TriviaPuzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <DateControl id={p.id} date={p.puzzle_date} type="trivia" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-dim">{p.questions.length} questions</span>
                        <DeleteButton id={p.id} type="trivia" label={`Trivia ${p.puzzle_date}`} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {p.questions.map((q, i) => (
                        <div key={i} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-text-dim font-mono text-xs mt-0.5">{i + 1}.</span>
                            <div className="flex-1">
                              <p className="text-text-secondary">{q.question}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {q.options.map((opt, oi) => (
                                  <span
                                    key={oi}
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      oi === q.correctIndex
                                        ? "bg-green/10 text-green font-medium"
                                        : "bg-surface text-text-muted"
                                    }`}
                                  >
                                    {opt}
                                  </span>
                                ))}
                              </div>
                              <span className="text-xs text-text-dim">{q.category}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              />
            )}

            {/* ── Crossword Tab ─────────────────────────────────────── */}
            {tab === "crossword" && (
              <PuzzleList
                title="Crossword Puzzles"
                items={data!.crosswords}
                renderItem={(p: CrosswordPuzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <DateControl id={p.id} date={p.puzzle_date} type="crossword" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-dim">{p.title}</span>
                        <DeleteButton id={p.id} type="crossword" label={`${p.title} (${p.puzzle_date})`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {p.entries.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-xs text-text-dim">{i + 1}.</span>
                          <span className="font-semibold text-sky tracking-wide">{e.answer}</span>
                          <span className="text-text-muted">{e.clue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              />
            )}

            {/* ── Clusters Tab ────────────────────────────────────── */}
            {tab === "clusters" && (
              <PuzzleList
                title="Cluster Puzzles"
                items={data!.clusters}
                renderItem={(p: ClusterPuzzle) => {
                  const wrongFormat = p.groups.length !== 5 || p.groups.some((g) => g.words.length !== 3);
                  return (
                  <div key={p.id} className={`rounded-xl border ${wrongFormat ? "border-red-300 bg-red-50/30" : "border-border-light"} p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DateControl id={p.id} date={p.puzzle_date} type="connections" />
                        {wrongFormat && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                            ⚠ Wrong format ({p.groups.length} groups × {p.groups[0]?.words.length ?? 0} words)
                          </span>
                        )}
                      </div>
                      <DeleteButton id={p.id} type="connections" label={`Clusters ${p.puzzle_date}`} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {p.groups.map((g, i) => (
                        <div
                          key={i}
                          className="rounded-lg p-2 text-sm"
                          style={{ backgroundColor: g.color + "22" }}
                        >
                          <p className="font-medium" style={{ color: g.color }}>
                            {g.category}
                          </p>
                          <p className="text-text-muted text-xs">{g.words.join(", ")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                }}
              />
            )}

            {/* ── Framed Tab ──────────────────────────────────────── */}
            {tab === "framed" && (
              <PuzzleList
                title="Framed Puzzles"
                items={data!.framed}
                renderItem={(p: FramedPuzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DateControl id={p.id} date={p.puzzle_date} type="framed" />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green/10 text-green">
                          {p.variant}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary font-medium">
                          {p.title} ({p.year})
                        </span>
                        <DeleteButton id={p.id} type="framed" label={`${p.title} (${p.puzzle_date})`} />
                      </div>
                    </div>
                    {p.frames && p.frames.length > 0 && (
                      <div className="grid grid-cols-6 gap-2">
                        {p.frames.map((frame, i) => (
                          <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-surface">
                            <img
                              src={frame}
                              alt={`Frame ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1 rounded">
                              {i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              />
            )}

            {/* ── Heardle Tab ──────────────────────────────────────── */}
            {tab === "heardle" && (
              <PuzzleList
                title="Heardle Puzzles"
                items={data!.heardle}
                renderItem={(p: HeardlePuzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DateControl id={p.id} date={p.puzzle_date} type="heardle" />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple/10 text-purple">
                          {p.variant}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary font-medium">
                          &ldquo;{p.title}&rdquo; by {p.artist} ({p.year})
                        </span>
                        <DeleteButton id={p.id} type="heardle" label={`${p.title} (${p.puzzle_date})`} />
                      </div>
                    </div>
                  </div>
                )}
              />
            )}

            {/* ── Anagram Tab ──────────────────────────────────────── */}
            {tab === "anagram" && (
              <PuzzleList
                title="Anagram Puzzles"
                items={data!.anagram}
                renderItem={(p: AnagramPuzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <DateControl id={p.id} date={p.puzzle_date} type="anagram" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-dim">{p.words.length} words</span>
                        <DeleteButton id={p.id} type="anagram" label={`Anagram ${p.puzzle_date}`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {p.words.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-xs text-text-dim">{i + 1}.</span>
                          <span className="font-semibold text-teal tracking-wide">{w.scrambled}</span>
                          <span className="text-text-muted">&rarr;</span>
                          <span className="font-semibold text-text-primary">{w.word}</span>
                          <span className="text-xs text-text-dim">({w.hint})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              />
            )}

            {/* ── Emoji Decoder Tab ─────────────────────────────────── */}
            {tab === "emoji-word" && (
              <PuzzleList
                title="Emoji Decoder Puzzles"
                items={data!.emojiWord}
                renderItem={(p: EmojiWordPuzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <DateControl id={p.id} date={p.puzzle_date} type="emoji-word" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-dim">{p.rounds.length} rounds</span>
                        <DeleteButton id={p.id} type="emoji-word" label={`Emoji Decoder ${p.puzzle_date}`} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {p.rounds.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                            style={{
                              backgroundColor: ["", "#22C55E", "#4ECDC4", "#F7B731", "#FF6B6B", "#A855F7"][r.difficulty],
                            }}
                          >
                            {["", "Easy", "Medium", "Tricky", "Hard", "Expert"][r.difficulty]}
                          </span>
                          <span className="text-lg">{r.emojis}</span>
                          <span className="font-semibold text-text-primary">{r.answer}</span>
                          {r.hint && <span className="text-xs text-text-dim">({r.hint})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              />
            )}

            {/* ── Word Ladder Tab ────────────────────────────────────── */}
            {tab === "word-ladder" && (
              <PuzzleList
                title="Word Ladder Puzzles"
                items={data!.wordLadder}
                renderItem={(p: WordLadderPuzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <DateControl id={p.id} date={p.puzzle_date} type="word-ladder" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-semibold text-teal">
                          {p.start_word?.toUpperCase()} &rarr; {p.end_word?.toUpperCase()}
                        </span>
                        <span className="text-xs text-text-dim">
                          {p.solution ? `${p.solution.length - 2} steps` : ""}
                        </span>
                        <DeleteButton id={p.id} type="word-ladder" label={`Word Ladder ${p.puzzle_date}`} />
                      </div>
                    </div>
                    {p.solution && (
                      <div className="text-xs text-text-muted font-mono">
                        {p.solution.map((w: string) => w.toUpperCase()).join(" → ")}
                      </div>
                    )}
                  </div>
                )}
              />
            )}

            {/* ── Top 5 Tab ────────────────────────────────────────── */}
            {tab === "top-5" && (
              <PuzzleList
                title="Top 5 Puzzles"
                items={data!.top5}
                renderItem={(p: Top5Puzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <DateControl id={p.id} date={p.puzzle_date} type="top-5" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-dim">{p.category}</span>
                        <DeleteButton id={p.id} type="top-5" label={`Top 5 ${p.puzzle_date}`} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {p.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-xs font-bold text-amber w-5">{i + 1}.</span>
                          <span className="font-semibold text-text-primary">{item.name}</span>
                          <span className="text-text-dim text-xs">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              />
            )}

            {/* ── Quotable Tab ──────────────────────────────────────── */}
            {tab === "quotable" && (
              <PuzzleList
                title="Quotable Puzzles"
                items={data!.quotable}
                renderItem={(p: QuotablePuzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <DateControl id={p.id} date={p.puzzle_date} type="quotable" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-purple">{p.attribution}</span>
                        <DeleteButton id={p.id} type="quotable" label={`Quotable ${p.puzzle_date}`} />
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary italic mb-2">
                      &ldquo;{p.quote.length > 120 ? p.quote.slice(0, 120) + "..." : p.quote}&rdquo;
                    </p>
                    {p.hint && <span className="text-xs text-text-dim">Hint: {p.hint}</span>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.options.map((opt, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2 py-0.5 rounded ${
                            opt === p.attribution
                              ? "bg-green/10 text-green font-medium"
                              : "bg-surface text-text-muted"
                          }`}
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              />
            )}

            {/* ── Timeline Tab ──────────────────────────────────────── */}
            {tab === "timeline" && (
              <PuzzleList
                title="Timeline Puzzles"
                items={data!.timeline}
                renderItem={(p: TimelinePuzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <DateControl id={p.id} date={p.puzzle_date} type="timeline" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-dim">{p.events.length} events</span>
                        <DeleteButton id={p.id} type="timeline" label={`Timeline ${p.puzzle_date}`} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {p.events.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-teal text-xs w-12">{e.year}</span>
                          <span className="text-text-secondary">{e.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              />
            )}

            {/* ── Hexle Tab ────────────────────────────────────────── */}
            {tab === "hexle" && (
              <PuzzleList
                title="Hexle Puzzles"
                items={data!.hexle}
                renderItem={(p: HexlePuzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between">
                      <DateControl id={p.id} date={p.puzzle_date} type="hexle" />
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-amber tracking-widest">{p.word}</span>
                        <DeleteButton id={p.id} type="hexle" label={`Hexle ${p.puzzle_date}`} />
                      </div>
                    </div>
                  </div>
                )}
              />
            )}

            {/* ── Chain Reaction Tab ──────────────────────────────── */}
            {tab === "chain-reaction" && (
              <PuzzleList
                title="Chain Reaction Puzzles"
                items={data!.chainReaction}
                renderItem={(p: ChainReactionPuzzle) => (
                  <div key={p.id} className={`rounded-xl border border-border-light p-4 ${isPast(p.puzzle_date) ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between">
                      <DateControl id={p.id} date={p.puzzle_date} type="chain-reaction" />
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-coral">{p.chain.join(" → ")}</span>
                        <DeleteButton id={p.id} type="chain-reaction" label={`Chain Reaction ${p.puzzle_date}`} />
                      </div>
                    </div>
                  </div>
                )}
              />
            )}

            {/* ── Prompt Generator Tab ──────────────────────────────── */}
            {tab === "prompt" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl text-text-primary mb-2">
                    Puzzle Generation Prompt
                  </h2>
                  <p className="text-sm text-text-muted">
                    Configure and copy this prompt to use with Claude for bulk puzzle generation.
                    Paste the output SQL into the Supabase SQL editor.
                  </p>
                </div>

                {/* Config */}
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Start date
                    </label>
                    <input
                      type="date"
                      value={promptStartDate}
                      onChange={(e) => setPromptStartDate(e.target.value)}
                      className="rounded-lg border border-border-light px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Number of days
                    </label>
                    <select
                      value={promptDays}
                      onChange={(e) => setPromptDays(Number(e.target.value))}
                      className="rounded-lg border border-border-light px-3 py-2 text-sm"
                    >
                      {[3, 5, 7, 9, 14].map((n) => (
                        <option key={n} value={n}>
                          {n} days
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={copyPrompt}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      copied
                        ? "bg-green text-white"
                        : "bg-coral text-white hover:bg-coral-dark"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy Prompt"}
                  </button>
                </div>

                {/* Preview */}
                <div className="rounded-xl border border-border-light bg-surface overflow-hidden">
                  <div className="px-4 py-2 border-b border-border bg-white flex items-center justify-between">
                    <span className="text-xs font-medium text-text-muted">Prompt Preview</span>
                    <span className="text-xs text-text-dim">
                      {promptDays} days starting {promptStartDate}
                    </span>
                  </div>
                  <pre className="p-4 text-xs text-text-secondary whitespace-pre-wrap font-body leading-relaxed max-h-[500px] overflow-y-auto">
                    {buildPrompt(promptStartDate, promptDays)}
                  </pre>
                </div>

                {/* Workflow reminder */}
                <div className="rounded-xl bg-sky/5 border border-sky/20 p-4">
                  <h3 className="font-semibold text-sky text-sm mb-2">Generation Workflow</h3>
                  <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
                    <li>Copy the prompt above</li>
                    <li>Paste it into a Claude conversation (with web search enabled)</li>
                    <li>Review the generated puzzles for accuracy</li>
                    <li>Copy the SQL INSERT statements from the response</li>
                    <li>Paste into the Supabase SQL editor and run</li>
                    <li>Come back here and refresh to verify</li>
                  </ol>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────── */

function StatCard({
  label,
  count,
  upcoming,
  lastDate,
  color,
  buffer,
}: {
  label: string;
  count: number;
  upcoming: number;
  lastDate?: string;
  color: string;
  buffer: number;
}) {
  return (
    <div className="rounded-xl border border-border-light p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">{label}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${statusColor(buffer)}`}
        >
          {buffer} days left
        </span>
      </div>
      <p className={`text-2xl font-bold mt-1 text-${color}`}>{count}</p>
      <p className="text-xs text-text-dim mt-1">
        {lastDate ? `${upcoming} upcoming \u00B7 through ${lastDate}` : "No puzzles loaded"}
      </p>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${
        ok ? "bg-green" : "bg-red-300"
      }`}
      title={ok ? "Ready" : "Missing"}
    />
  );
}

function PuzzleList<T extends { id: string }>({
  title,
  items,
  renderItem,
}: {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-text-primary">{title}</h2>
        <span className="text-sm text-text-muted">{items.length} total</span>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p>No puzzles found.</p>
          <p className="text-sm mt-1">Generate some using the &quot;Generate Puzzles&quot; tab.</p>
        </div>
      ) : (
        <div className="space-y-4">{items.map(renderItem)}</div>
      )}
    </div>
  );
}

/* ── Timeline builder ──────────────────────────────────────────────────── */

function buildTimeline(data: PuzzleData) {
  const triviaDates = new Set(data.trivia.map((p) => p.puzzle_date));
  const crosswordDates = new Set(data.crosswords.map((p) => p.puzzle_date));
  const clustersDates = new Set(data.clusters.map((p) => p.puzzle_date));
  const framedDates = new Set(data.framed.map((p) => p.puzzle_date));
  const heardleDates = new Set(data.heardle.map((p) => p.puzzle_date));
  const anagramDates = new Set(data.anagram.map((p) => p.puzzle_date));
  const wordLadderDates = new Set(data.wordLadder.map((p) => p.puzzle_date));
  const emojiWordDates = new Set(data.emojiWord.map((p) => p.puzzle_date));
  const top5Dates = new Set(data.top5.map((p) => p.puzzle_date));
  const quotableDates = new Set(data.quotable.map((p) => p.puzzle_date));
  const timelineDates = new Set(data.timeline.map((p) => p.puzzle_date));
  const hexleDates = new Set(data.hexle.map((p) => p.puzzle_date));
  const chainReactionDates = new Set(data.chainReaction.map((p) => p.puzzle_date));

  const allDates = new Set([...triviaDates, ...crosswordDates, ...clustersDates, ...framedDates, ...heardleDates, ...anagramDates, ...wordLadderDates, ...emojiWordDates, ...top5Dates, ...quotableDates, ...timelineDates, ...hexleDates, ...chainReactionDates]);

  // Show from earliest puzzle to latest
  const sorted = [...allDates].sort();
  const today = getTodayISO();
  const minDate = sorted[0] && sorted[0] < today ? sorted[0] : today;
  const maxDate = sorted[sorted.length - 1] ?? new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

  const result: { date: string; hasTrivia: boolean; hasCrossword: boolean; hasClusters: boolean; hasFramed: boolean; hasHeardle: boolean; hasAnagram: boolean; hasWordLadder: boolean; hasEmojiWord: boolean; hasTop5: boolean; hasQuotable: boolean; hasTimeline: boolean; hasHexle: boolean; hasChainReaction: boolean }[] = [];
  const d = new Date(minDate + "T00:00:00");
  const end = new Date(maxDate + "T00:00:00");

  while (d <= end) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    result.push({
      date: ds,
      hasTrivia: triviaDates.has(ds),
      hasCrossword: crosswordDates.has(ds),
      hasClusters: clustersDates.has(ds),
      hasFramed: framedDates.has(ds),
      hasHeardle: heardleDates.has(ds),
      hasAnagram: anagramDates.has(ds),
      hasWordLadder: wordLadderDates.has(ds),
      hasEmojiWord: emojiWordDates.has(ds),
      hasTop5: top5Dates.has(ds),
      hasQuotable: quotableDates.has(ds),
      hasTimeline: timelineDates.has(ds),
      hasHexle: hexleDates.has(ds),
      hasChainReaction: chainReactionDates.has(ds),
    });
    d.setDate(d.getDate() + 1);
  }

  return result;
}
