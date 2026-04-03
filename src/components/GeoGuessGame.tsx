"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { countries, countryNames, type GeoCountry } from "@/lib/geo-puzzles";
import { shareOrCopy } from "@/lib/share";
import XShareButton from "@/components/XShareButton";

const MAX_GUESSES = 5;
const MASTERY_KEY = "gamesite-country-mastery";

// ── Hint definitions ─────────────────────────────────────────────────────────

/** The 5 hint types in default order */
const HINT_TYPES = ["outline", "population", "flag", "capital", "funfact"] as const;
type HintType = (typeof HINT_TYPES)[number];

const HINT_LABELS: Record<HintType, string> = {
  outline: "Country Outline",
  population: "Population",
  flag: "Flag",
  capital: "Capital City",
  funfact: "Fun Fact & Neighbors",
};

// ── Mastery types ────────────────────────────────────────────────────────────

interface CountryMastery {
  /** Which hints this player has aced (got right as the first/only hint) */
  masteredHints: HintType[];
  attempts: number;
  lastPlayed: string;
}

type MasteryData = Record<string, CountryMastery>;

type MasteryLevel = "mastered" | "familiar" | "learning" | "new" | "unseen";

function getMasteryLevel(m: CountryMastery | undefined): MasteryLevel {
  if (!m) return "unseen";
  const count = m.masteredHints.length;
  if (count >= 5) return "mastered";
  if (count >= 3) return "familiar";
  if (count >= 1) return "learning";
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

// ── Mastery persistence ──────────────────────────────────────────────────────

function loadMastery(): MasteryData {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MASTERY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveMastery(data: MasteryData) {
  try {
    localStorage.setItem(MASTERY_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// ── Hint order rotation ──────────────────────────────────────────────────────

/**
 * Pick which hint to show first for this country.
 * Rotates through un-mastered hints so the player trains all 5 dimensions.
 */
function getHintOrder(mastery: MasteryData, code: string): HintType[] {
  const m = mastery[code];
  const mastered = new Set(m?.masteredHints ?? []);

  // Find the first un-mastered hint to lead with
  const unmastered = HINT_TYPES.filter((h) => !mastered.has(h));

  if (unmastered.length === 0) {
    // All mastered — cycle based on attempt count
    const offset = (m?.attempts ?? 0) % HINT_TYPES.length;
    return [...HINT_TYPES.slice(offset), ...HINT_TYPES.slice(0, offset)];
  }

  // Lead with the next un-mastered hint, then the rest in order
  const lead = unmastered[0];
  const rest = HINT_TYPES.filter((h) => h !== lead);
  return [lead, ...rest];
}

// ── Country picker ───────────────────────────────────────────────────────────

function pickNextCountry(mastery: MasteryData): GeoCountry {
  // Prioritize unseen countries
  const unseen = countries.filter((c) => !mastery[c.code]);
  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }
  // All seen — prioritize least mastered hints, then random
  const sorted = [...countries].sort((a, b) => {
    const am = mastery[a.code]?.masteredHints.length ?? 0;
    const bm = mastery[b.code]?.masteredHints.length ?? 0;
    if (am !== bm) return am - bm; // least mastered first
    return Math.random() - 0.5;
  });
  return sorted[0];
}

// ── Hint renderer ────────────────────────────────────────────────────────────

function HintCard({
  hintType,
  hintIndex,
  revealed,
  country,
}: {
  hintType: HintType;
  hintIndex: number;
  revealed: boolean;
  country: GeoCountry;
}) {
  const isFirst = hintIndex === 0;
  const label = `Hint ${hintIndex + 1} — ${HINT_LABELS[hintType]}`;

  const content = (() => {
    switch (hintType) {
      case "outline":
        return (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/countries/${country.code}.svg`}
              alt="Country outline"
              className="h-32 w-auto opacity-80"
              draggable={false}
            />
          </div>
        );
      case "population":
        return (
          <p className="text-text-primary text-lg font-semibold">
            {country.population}
          </p>
        );
      case "flag":
        return (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://flagcdn.com/w160/${country.code}.png`}
              srcSet={`https://flagcdn.com/w320/${country.code}.png 2x`}
              alt="Country flag"
              className="h-16 w-auto rounded shadow-sm"
              draggable={false}
            />
          </div>
        );
      case "capital":
        return (
          <p className="text-text-primary text-lg font-semibold">
            {country.capital}
          </p>
        );
      case "funfact":
        return (
          <div className="space-y-2">
            <p className="text-text-primary text-sm">{country.funFact}</p>
            <div className="flex flex-wrap gap-1.5">
              {country.neighbors.map((n) => (
                <span
                  key={n}
                  className="text-xs font-medium text-green bg-green/10 rounded-full px-2.5 py-0.5"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        );
    }
  })();

  if (isFirst) {
    return (
      <div className="bg-white rounded-2xl border border-border-light shadow-sm p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-green mb-3">
          {label}
        </div>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-border-light shadow-sm p-6 transition-all duration-500 ${
        revealed ? "opacity-100" : "opacity-30 pointer-events-none"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-green mb-2">
        {label}
      </div>
      {revealed ? (
        content
      ) : (
        <p className="text-text-dim text-sm italic">
          Revealed after guess {hintIndex}
        </p>
      )}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GeoGuessGame() {
  const [mastery, setMastery] = useState<MasteryData>({});
  const [country, setCountry] = useState<GeoCountry | null>(null);
  const [hintOrder, setHintOrder] = useState<HintType[]>([...HINT_TYPES]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [copied, setCopied] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [showMastery, setShowMastery] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load mastery and pick first country on mount
  useEffect(() => {
    const m = loadMastery();
    setMastery(m);
    const c = pickNextCountry(m);
    setCountry(c);
    setHintOrder(getHintOrder(m, c.code));
  }, []);

  // Filter country suggestions
  const suggestions = useMemo(() => {
    if (inputValue.length < 1) return [];
    const lower = inputValue.toLowerCase();
    return countryNames
      .filter(
        (c) =>
          c.toLowerCase().includes(lower) &&
          !guesses.includes(c),
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

  useEffect(() => {
    setHighlightIdx(-1);
  }, [suggestions]);

  const submitGuess = useCallback(
    (name: string) => {
      if (gameState !== "playing" || !country) return;
      const trimmed = name.trim();
      if (!trimmed || guesses.includes(trimmed)) return;

      const newGuesses = [...guesses, trimmed];
      setGuesses(newGuesses);
      setInputValue("");
      setShowDropdown(false);

      const won = trimmed.toLowerCase() === country.name.toLowerCase();
      const lost = !won && newGuesses.length >= MAX_GUESSES;

      if (won || lost) {
        setGameState(won ? "won" : "lost");
        const m = loadMastery();
        const prev = m[country.code];
        const masteredHints = new Set(prev?.masteredHints ?? []);

        // If they got it on the first guess, they've mastered the leading hint
        if (won && newGuesses.length === 1) {
          masteredHints.add(hintOrder[0]);
        }

        m[country.code] = {
          masteredHints: [...masteredHints],
          attempts: (prev?.attempts ?? 0) + 1,
          lastPlayed: new Date().toISOString().slice(0, 10),
        };
        saveMastery(m);
        setMastery({ ...m });
      }
    },
    [gameState, guesses, country, hintOrder],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < suggestions.length) {
          submitGuess(suggestions[highlightIdx]);
        } else if (suggestions.length > 0) {
          submitGuess(suggestions[0]);
        }
      }
    },
    [highlightIdx, suggestions, submitGuess],
  );

  const getShareText = useCallback(() => {
    if (!country) return "";
    const guessCount = gameState === "won" ? guesses.length : "X";
    const squares: string[] = guesses.map((g) =>
      g.toLowerCase() === country.name.toLowerCase() ? "\u{1F7E9}" : "\u{1F7E5}",
    );
    while (squares.length < MAX_GUESSES) squares.push("\u2B1C");

    return `\u{1F30D} Country Mastery — ${country.name}\n${guessCount}/${MAX_GUESSES} ${squares.join("")}\ngamesite.app/learn/country-mastery`;
  }, [gameState, guesses, country]);

  const handleShare = useCallback(async () => {
    const text = getShareText();
    if (!text) return;
    const ok = await shareOrCopy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getShareText]);

  const nextCountry = useCallback(() => {
    const m = loadMastery();
    const c = pickNextCountry(m);
    setCountry(c);
    setHintOrder(getHintOrder(m, c.code));
    setGuesses([]);
    setInputValue("");
    setGameState("playing");
    setCopied(false);
    setShowDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  if (!country) return null;

  const hintsRevealed = Math.min(guesses.length + 1, MAX_GUESSES);
  const isFinished = gameState !== "playing";

  // Mastery summary counts
  const attempted = Object.keys(mastery).length;
  const masteredCount = Object.values(mastery).filter((m) => m.masteredHints.length >= 5).length;

  // ── Mastery Dashboard ─────────────────────────────────────────────
  if (showMastery) {
    const levels: MasteryLevel[] = ["mastered", "familiar", "learning", "new", "unseen"];
    const counts: Record<MasteryLevel, number> = { mastered: 0, familiar: 0, learning: 0, new: 0, unseen: 0 };
    countries.forEach((c) => {
      counts[getMasteryLevel(mastery[c.code])]++;
    });

    return (
      <div className="flex min-h-[80vh] flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-text-primary">Country Mastery</h1>
            <button
              onClick={() => setShowMastery(false)}
              className="text-sm font-semibold text-green hover:underline"
            >
              Back to game
            </button>
          </div>

          {/* Explainer */}
          <p className="text-text-dim text-sm mb-4">
            A hint is mastered when it&apos;s the first hint shown and you guess the country correctly. The starting hint rotates so you learn all five — outline, population, flag, capital, and fun fact — for every country.
          </p>

          {/* Progress bar */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-text-primary">{attempted} / {countries.length} countries attempted</span>
              <span className="text-sm font-semibold text-green">{masteredCount} fully mastered</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
              {levels.filter((l) => l !== "unseen").map((level) => (
                <div
                  key={level}
                  className={`h-full ${masteryColors[level].split(" ")[0]}`}
                  style={{ width: `${(counts[level] / countries.length) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {levels.map((level) => (
                <div key={level} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${masteryColors[level].split(" ")[0]}`} />
                  <span className="text-xs text-text-dim">{masteryLabels[level]} ({counts[level]})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Country list */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
            <div className="max-h-[50vh] overflow-y-auto divide-y divide-border-light">
              {[...countries]
                .sort((a, b) => {
                  const al = getMasteryLevel(mastery[a.code]);
                  const bl = getMasteryLevel(mastery[b.code]);
                  const order: Record<MasteryLevel, number> = { unseen: 0, new: 1, learning: 2, familiar: 3, mastered: 4 };
                  if (order[al] !== order[bl]) return order[al] - order[bl];
                  return a.name.localeCompare(b.name);
                })
                .map((c) => {
                  const level = getMasteryLevel(mastery[c.code]);
                  const m = mastery[c.code];
                  return (
                    <div key={c.code} className="flex items-center gap-3 px-4 py-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://flagcdn.com/w40/${c.code}.png`}
                        alt=""
                        className="w-6 h-4 rounded-sm object-cover"
                      />
                      <span className="flex-1 text-sm text-text-primary font-medium">{c.name}</span>
                      {m && (
                        <span className="text-xs text-text-dim tabular-nums">
                          {m.masteredHints.length}/5
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${masteryColors[level]}`}>
                        {masteryLabels[level]}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main game ───────────────────────────────────────────────────
  return (
    <div className="flex min-h-[80vh] flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Country Mastery
            </h1>
            <p className="text-text-dim text-xs">{attempted}/{countries.length} countries attempted</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-text-muted font-medium tabular-nums">
              {guesses.length} / {MAX_GUESSES} guesses
            </div>
            <button
              onClick={() => setShowMastery(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-green/10 text-green hover:bg-green/20 transition-colors"
              aria-label="View mastery"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hint cards — dynamically ordered */}
        <div className="space-y-3 mb-6">
          {hintOrder.map((hintType, i) => (
            <HintCard
              key={hintType}
              hintType={hintType}
              hintIndex={i}
              revealed={i === 0 || hintsRevealed > i}
              country={country}
            />
          ))}
        </div>

        {/* Result card */}
        {isFinished && (
          <div className="bg-white rounded-2xl border border-border-light p-6 mb-4 text-center shadow-sm">
            {gameState === "won" ? (
              <>
                <div className="text-3xl mb-2">{"\u{1F389}"}</div>
                <h2 className="text-lg font-bold text-text-primary">
                  {country.name}!
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  Got it in {guesses.length} {guesses.length === 1 ? "guess" : "guesses"}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">{"\u{1F614}"}</div>
                <h2 className="text-lg font-bold text-text-primary">
                  {country.name}
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  Better luck next time!
                </p>
              </>
            )}

            {/* Flag reveal */}
            <div className="flex justify-center mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://flagcdn.com/w160/${country.code}.png`} alt="" className="h-12 w-auto rounded shadow-sm" />
            </div>

            {/* Guess history squares */}
            <div className="flex items-center justify-center gap-1 mt-3">
              {guesses.map((g, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-sm ${
                    g.toLowerCase() === country.name.toLowerCase()
                      ? "bg-green text-white"
                      : "bg-red-400 text-white"
                  }`}
                >
                  {g.toLowerCase() === country.name.toLowerCase() ? "\u2713" : "\u2717"}
                </div>
              ))}
              {Array.from({ length: MAX_GUESSES - guesses.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-8 h-8 rounded-md bg-gray-200"
                />
              ))}
            </div>

            {/* Mastery badge */}
            {(() => {
              const level = getMasteryLevel(mastery[country.code]);
              const m = mastery[country.code];
              return (
                <div className="mt-3">
                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${masteryColors[level]}`}>
                    {m ? `${m.masteredHints.length}/5 hints mastered` : masteryLabels[level]}
                  </span>
                </div>
              );
            })()}

            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={handleShare}
                className="bg-white border border-border-light text-text-secondary font-bold rounded-full px-5 py-2.5 text-sm
                           hover:bg-surface transition-colors"
              >
                {copied ? "Copied!" : "Share"}
              </button>
              <XShareButton getText={getShareText} />
              <button
                onClick={nextCountry}
                className="bg-green text-white font-bold rounded-full px-6 py-2.5 text-sm
                           hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                Next Country
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        {!isFinished && (
          <div className="relative" ref={dropdownRef}>
            <div className="relative" role="combobox" aria-expanded={showDropdown && suggestions.length > 0} aria-haspopup="listbox">
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
                onKeyDown={handleKeyDown}
                placeholder="Type a country name..."
                aria-label="Country name"
                aria-autocomplete="list"
                aria-controls="geo-suggestions"
                aria-activedescendant={highlightIdx >= 0 ? `geo-option-${highlightIdx}` : undefined}
                className="w-full rounded-xl border-2 border-border-light bg-white px-4 py-3 text-sm
                           text-text-primary placeholder-text-dim
                           focus:border-green focus:outline-none transition-colors"
              />

              {/* Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div id="geo-suggestions" role="listbox" aria-label="Country suggestions" className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-border-light shadow-lg z-20 overflow-hidden">
                  {suggestions.map((name, i) => (
                    <button
                      key={name}
                      id={`geo-option-${i}`}
                      role="option"
                      aria-selected={i === highlightIdx}
                      onClick={() => submitGuess(name)}
                      className={`w-full text-left px-4 py-2.5 text-sm text-text-primary
                                 transition-colors border-b border-border-light last:border-0 ${
                                   i === highlightIdx
                                     ? "bg-green/15"
                                     : "hover:bg-green/10"
                                 }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Guess history */}
        {guesses.length > 0 && !isFinished && (
          <div className="mt-4 space-y-1.5">
            {guesses.map((guess, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-red-50 text-red-600"
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
