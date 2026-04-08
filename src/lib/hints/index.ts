import type { HintSet, FAQ } from "@/types/hints";
import { getGameBySlug } from "@/lib/game-registry";

import { getPuzzleByDate, getFallbackPuzzle } from "@/lib/puzzles";
import {
  getCrosswordPuzzle,
} from "@/lib/crossword-puzzles";
import {
  getTriviaPuzzleByDate,
  getFallbackTriviaPuzzle,
} from "@/lib/trivia-puzzles";
import {
  getHexlePuzzle,
  getFallbackHexleWord,
} from "@/lib/hexle-words";
import { getWordLadderPuzzle } from "@/lib/word-ladder-puzzles";
import {
  getAnagramPuzzleByDate,
  getFallbackAnagramPuzzle,
} from "@/lib/anagram-puzzles";
import { getChainReactionPuzzle } from "@/lib/chain-reaction-puzzles";
import {
  getEmojiWordPuzzleByDate,
  getFallbackEmojiWordPuzzle,
} from "@/lib/emoji-word-puzzles";
import {
  getWordBloomPuzzleByDate,
  getFallbackWordBloomPuzzle,
} from "@/lib/word-bloom-puzzles";
import { getHeardlePuzzleAsync } from "@/lib/heardle-puzzles";
import { getFramedPuzzleAsync } from "@/lib/framed-puzzles";
import {
  getTop5PuzzleByDate,
  getFallbackTop5Puzzle,
} from "@/lib/top5-puzzles";
import { getMathlerPuzzle } from "@/lib/mathler-puzzles";
import {
  getTimelinePuzzleByDate,
  getFallbackTimelinePuzzle,
} from "@/lib/timeline-puzzles";
import {
  getQuotablePuzzleByDate,
  getFallbackQuotablePuzzle,
} from "@/lib/quotable-puzzles";

import { generateClusterHints } from "./cluster-hints";
import { generateCrosswordHints } from "./crossword-hints";
import { generateTriviaHints } from "./trivia-hints";
import { generateHexleHints } from "./hexle-hints";
import { generateWordLadderHints } from "./word-ladder-hints";
import { generateAnagramHints } from "./anagram-hints";
import { generateChainReactionHints } from "./chain-reaction-hints";
import { generateEmojiDecoderHints } from "./emoji-decoder-hints";
import { generateWordBloomHints } from "./word-bloom-hints";
import { generateHeardleHints } from "./heardle-hints";
import { generateFramedHints } from "./framed-hints";
import { generateTop5Hints } from "./top5-hints";
import { generateMathlerHints } from "./mathler-hints";
import { generateTimelineHints } from "./timeline-hints";
import { generateQuotableHints } from "./quotable-hints";

/** All game slugs that support hint pages. */
export const HINTABLE_GAMES = [
  "cluster",
  "crossword",
  "daily-trivia",
  "hexle",
  "word-ladder",
  "anagram",
  "chain-reaction",
  "emoji-word",
  "word-bloom",
  "heardle",
  "framed",
  "top-5",
  "mathler",
  "timeline",
  "quotable",
] as const;

export type HintableSlug = (typeof HINTABLE_GAMES)[number];

function isHintable(slug: string): slug is HintableSlug {
  return (HINTABLE_GAMES as readonly string[]).includes(slug);
}

function buildFAQs(gameName: string, gameSlug: string, date: string): FAQ[] {
  const d = new Date(date + "T00:00:00");
  const formatted = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return [
    {
      question: `How do I play ${gameName}?`,
      answer: `${gameName} is a free daily puzzle game on Gamesite. Visit gamesite.app/daily/${gameSlug} to play today's puzzle.`,
    },
    {
      question: `What are today's ${gameName} hints for ${formatted}?`,
      answer: `We provide three levels of hints — mild, medium, and strong — so you can choose how much help you need without spoiling the answer.`,
    },
    {
      question: `Where can I find ${gameName} answers?`,
      answer: `We provide progressive hints rather than direct answers, so you can still enjoy solving the puzzle yourself. Play at gamesite.app/daily/${gameSlug}.`,
    },
    {
      question: `Is ${gameName} free to play?`,
      answer: `Yes! ${gameName} is completely free to play every day on Gamesite. No account or download required.`,
    },
  ];
}

/**
 * Fetch puzzle data for the given game + date and generate hints.
 * Returns null if the game slug is unknown or the puzzle can't be loaded.
 */
export async function getHintsForGame(
  slug: string,
  date: string,
): Promise<HintSet | null> {
  if (!isHintable(slug)) return null;

  const game = getGameBySlug(slug);
  if (!game) return null;

  try {
    const hints = await generateHintsForSlug(slug, date);
    if (!hints) return null;

    return {
      gameName: game.name,
      gameSlug: slug,
      date,
      hints,
      faqs: buildFAQs(game.name, slug, date),
    };
  } catch {
    return null;
  }
}

async function generateHintsForSlug(slug: HintableSlug, date: string) {
  switch (slug) {
    case "cluster": {
      let puzzle = await getPuzzleByDate(date);
      if (!puzzle) puzzle = getFallbackPuzzle(date);
      return generateClusterHints(puzzle);
    }
    case "crossword": {
      const puzzle = await getCrosswordPuzzle(date);
      return generateCrosswordHints(puzzle);
    }
    case "daily-trivia": {
      let puzzle = await getTriviaPuzzleByDate(date);
      if (!puzzle) puzzle = getFallbackTriviaPuzzle(date);
      return generateTriviaHints(puzzle);
    }
    case "hexle": {
      let word = await getHexlePuzzle(date);
      if (!word) word = getFallbackHexleWord(date);
      return generateHexleHints(word);
    }
    case "word-ladder": {
      const puzzle = getWordLadderPuzzle(date);
      return generateWordLadderHints(puzzle);
    }
    case "anagram": {
      let puzzle = await getAnagramPuzzleByDate(date);
      if (!puzzle) puzzle = getFallbackAnagramPuzzle(date);
      return generateAnagramHints(puzzle);
    }
    case "chain-reaction": {
      const puzzle = getChainReactionPuzzle(date);
      return generateChainReactionHints(puzzle);
    }
    case "emoji-word": {
      let puzzle = await getEmojiWordPuzzleByDate(date);
      if (!puzzle) puzzle = getFallbackEmojiWordPuzzle(date);
      return generateEmojiDecoderHints(puzzle);
    }
    case "word-bloom": {
      let puzzle = await getWordBloomPuzzleByDate(date);
      if (!puzzle) puzzle = getFallbackWordBloomPuzzle(date);
      return generateWordBloomHints(puzzle);
    }
    case "heardle": {
      const puzzle = await getHeardlePuzzleAsync(date);
      return generateHeardleHints(puzzle);
    }
    case "framed": {
      const puzzle = await getFramedPuzzleAsync(date);
      return generateFramedHints(puzzle);
    }
    case "top-5": {
      let puzzle = await getTop5PuzzleByDate(date);
      if (!puzzle) puzzle = getFallbackTop5Puzzle(date);
      return generateTop5Hints(puzzle);
    }
    case "mathler": {
      const puzzle = getMathlerPuzzle(date);
      return generateMathlerHints(puzzle);
    }
    case "timeline": {
      let puzzle = await getTimelinePuzzleByDate(date);
      if (!puzzle) puzzle = getFallbackTimelinePuzzle(date);
      return generateTimelineHints(puzzle);
    }
    case "quotable": {
      let puzzle = await getQuotablePuzzleByDate(date);
      if (!puzzle) puzzle = getFallbackQuotablePuzzle(date);
      return generateQuotableHints(puzzle);
    }
  }
}
