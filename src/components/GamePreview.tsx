import Image from "next/image";

/* ─── Cluster Mini Preview ───────────────────────────────────────────────── */

const clusterWords = [
  { word: "CASH", selected: false },
  { word: "LOVER", selected: true },
  { word: "TABLE", selected: false },
  { word: "RADIO", selected: false },
  { word: "FOLKLORE", selected: true },
  { word: "HEAT", selected: false },
  { word: "PHOTO", selected: false },
  { word: "MIDNIGHTS", selected: true },
  { word: "LICENSE", selected: false },
  { word: "BURRITO", selected: false },
  { word: "SOUND", selected: false },
  { word: "POKER", selected: false },
  { word: "CLUB", selected: false },
  { word: "BRIDGE", selected: false },
  { word: "RUMMY", selected: false },
];

function ClusterPreview() {
  return (
    <div className="grid grid-cols-5 gap-1.5 mb-4">
      {clusterWords.map(({ word, selected }, i) => (
        <div
          key={i}
          className={`rounded-lg py-2 px-1 text-center text-[9px] sm:text-[11px] font-bold uppercase tracking-wide transition-all
            ${selected
              ? "bg-coral text-white shadow-sm"
              : "bg-gray-100 text-text-secondary"
            }`}
        >
          {word}
        </div>
      ))}
    </div>
  );
}

/* ─── Hexle Mini Preview ─────────────────────────────────────────────────── */

function HexlePreview() {
  const guesses = [
    { word: "RACING", colors: ["gray", "gray", "gray", "gray", "gray", "green"] },
    { word: "PLAYED", colors: ["gray", "gray", "amber", "green", "green", "gray"] },
    { word: "SCREEN", colors: ["green", "gray", "gray", "green", "green", "green"] },
  ];
  return (
    <div className="mb-4 flex flex-col items-center gap-1">
      {guesses.map((row, ri) => (
        <div key={ri} className="flex gap-0.5">
          {row.word.split("").map((ch, ci) => (
            <div
              key={ci}
              className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded text-white
                ${row.colors[ci] === "green" ? "bg-green" : row.colors[ci] === "amber" ? "bg-amber" : "bg-gray-400"}`}
            >
              {ch}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Trivia Mini Preview ────────────────────────────────────────────────── */

function TriviaPreview() {
  return (
    <div className="mb-4 rounded-lg bg-sky/5 border border-sky/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky">Question 3 of 8</span>
        <span className="text-[10px] font-bold text-coral tabular-nums">⏱ 5s</span>
      </div>
      <p className="text-xs font-semibold text-text-primary leading-snug mb-2">
        What planet has the most moons in our solar system?
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded bg-white border border-border-light px-2 py-1.5 text-[10px] font-medium text-text-secondary text-center">Jupiter</div>
        <div className="rounded bg-sky text-white px-2 py-1.5 text-[10px] font-bold text-center">Saturn</div>
        <div className="rounded bg-white border border-border-light px-2 py-1.5 text-[10px] font-medium text-text-secondary text-center">Neptune</div>
        <div className="rounded bg-white border border-border-light px-2 py-1.5 text-[10px] font-medium text-text-secondary text-center">Uranus</div>
      </div>
    </div>
  );
}

/* ─── Crossword Mini Preview ────────────────────────────────────────────── */

function CrosswordPreview() {
  const mini = [
    [0, 0, 1, 1, 1, 1, 0],
    [0, 0, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0],
  ];
  const letters = [
    ["", "", "N", "E", "W", "S", ""],
    ["", "", "A", "", "", "", ""],
    ["T", "R", "A", "D", "E", "", ""],
    ["", "", "Q", "", "C", "", ""],
    ["", "S", "U", "M", "I", "T", ""],
    ["", "", "", "", "F", "", ""],
  ];
  return (
    <div className="mb-4 flex justify-center">
      <div className="inline-grid gap-[2px] bg-text-primary/20 p-[2px] rounded">
        {mini.map((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              className={`flex items-center justify-center text-[8px] sm:text-[9px] font-bold uppercase
                ${cell ? "bg-white text-text-primary" : "bg-transparent"}`}
              style={{
                width: 20,
                height: 20,
                gridRow: ri + 1,
                gridColumn: ci + 1,
              }}
            >
              {cell ? letters[ri][ci] : ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── GeoGuess Mini Preview ────────────────────────────────────────────── */

function GeoGuessPreview() {
  return (
    <div className="mb-4 rounded-lg bg-green/5 border border-green/20 p-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">🇧🇷</span>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-green">Hint 1</span>
          <p className="text-xs font-semibold text-text-primary">South America</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="rounded bg-white border border-border-light px-2 py-1 text-[10px] font-medium text-text-secondary flex-1 text-center">Argentina?</div>
        <div className="rounded bg-green text-white px-2 py-1 text-[10px] font-bold flex-1 text-center">Brazil</div>
      </div>
    </div>
  );
}

/* ─── Mathler Mini Preview ─────────────────────────────────────────────── */

function MathlerPreview() {
  const rows = [
    { chars: "15+9*3", colors: ["green", "gray", "yellow", "gray", "green", "green"] },
    { chars: "18-3*2", colors: ["green", "green", "green", "green", "green", "green"] },
  ];
  return (
    <div className="mb-4 flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-purple mb-1">Target: 12</span>
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.chars.split("").map((ch, ci) => (
            <div
              key={ci}
              className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded text-white
                ${row.colors[ci] === "green" ? "bg-green" : row.colors[ci] === "yellow" ? "bg-amber" : "bg-gray-400"}`}
            >
              {ch}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Word Ladder Mini Preview ────────────────────────────────────────── */

function WordLadderPreview() {
  const words = ["COLD", "CORD", "CARD", "WARD", "WARM"];
  return (
    <div className="mb-4 flex flex-col items-center gap-1">
      {words.map((word, wi) => (
        <div key={wi} className="flex items-center gap-1">
          {wi > 0 && <span className="text-text-dim text-[8px] absolute -mt-3">↓</span>}
          <div className="flex gap-0.5">
            {word.split("").map((ch, ci) => {
              const prev = wi > 0 ? words[wi - 1] : null;
              const changed = prev && prev[ci] !== ch;
              return (
                <div
                  key={ci}
                  className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded ${
                    wi === 0
                      ? "bg-teal/10 text-teal"
                      : wi === words.length - 1
                        ? "bg-amber/10 text-amber"
                        : changed
                          ? "bg-teal/10 text-teal"
                          : "bg-gray-100 text-text-secondary"
                  }`}
                >
                  {ch}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Anagram Mini Preview ────────────────────────────────────────────── */

function AnagramPreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/anagram.jpg" alt="Anagram Scramble - unscramble the words" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

/* ─── Emoji Decoder Mini Preview ─────────────────────────────────────── */

function EmojiDecoderPreview() {
  const rounds = [
    { emojis: "🎸🌟🎤", answer: "ROCKSTAR", solved: true },
    { emojis: "🌊🏄‍♂️☀️", answer: "SURF", solved: true },
    { emojis: "🏰👸🐉", answer: "???", solved: false },
  ];
  return (
    <div className="mb-4 rounded-lg bg-amber/5 border border-amber/20 p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-amber mb-2 block">
        Round 3 of 5
      </span>
      <div className="flex flex-col gap-1.5">
        {rounds.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-base leading-none">{r.emojis}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                r.solved
                  ? "bg-green/10 text-green"
                  : "bg-amber/10 text-amber"
              }`}
            >
              {r.answer}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Top 5 Mini Preview ────────────────────────────────────────────── */

function Top5Preview() {
  const items = [
    { rank: 1, label: "China", status: "correct" },
    { rank: 2, label: "India", status: "correct" },
    { rank: 3, label: "USA", status: "wrong" },
    { rank: 4, label: "Indonesia", status: "pending" },
    { rank: 5, label: "Brazil", status: "pending" },
  ];
  return (
    <div className="mb-4 rounded-lg bg-amber/5 border border-amber/20 p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-amber mb-2 block">
        Most Populated Countries
      </span>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div key={item.rank} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-text-dim w-3 text-right">
              {item.rank}
            </span>
            <div
              className={`flex-1 rounded px-2 py-1 text-[10px] font-medium text-center ${
                item.status === "correct"
                  ? "bg-green/10 text-green font-bold"
                  : item.status === "wrong"
                    ? "bg-coral/10 text-coral font-bold"
                    : "bg-gray-100 text-text-secondary"
              }`}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Quotable Mini Preview ─────────────────────────────────────────── */

function QuotablePreview() {
  const words = [
    { text: "Be", revealed: true },
    { text: "the", revealed: true },
    { text: "change", revealed: true },
    { text: "you", revealed: false },
    { text: "wish", revealed: false },
    { text: "to", revealed: true },
    { text: "see", revealed: false },
  ];
  return (
    <div className="mb-4 rounded-lg bg-purple/5 border border-purple/20 p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-purple mb-2 block">
        Who said it?
      </span>
      <div className="flex flex-wrap gap-1 mb-2">
        {words.map((w, i) => (
          <span
            key={i}
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              w.revealed
                ? "text-text-primary"
                : "bg-purple/10 text-purple/40"
            }`}
          >
            {w.revealed ? w.text : "━━━"}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded bg-white border border-border-light px-2 py-1 text-[10px] font-medium text-text-secondary text-center">
          Einstein
        </div>
        <div className="rounded bg-purple text-white px-2 py-1 text-[10px] font-bold text-center">
          Gandhi
        </div>
      </div>
    </div>
  );
}

/* ─── Timeline Mini Preview ─────────────────────────────────────────── */

function TimelinePreview() {
  const events = [
    { year: "1969", label: "Moon Landing", status: "correct" },
    { year: "1989", label: "Berlin Wall Falls", status: "correct" },
    { year: "????", label: "World Wide Web", status: "active" },
    { year: "", label: "First iPhone", status: "pending" },
    { year: "", label: "Mars Rover", status: "pending" },
  ];
  return (
    <div className="mb-4 rounded-lg bg-teal/5 border border-teal/20 p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-teal mb-2 block">
        Put in order
      </span>
      <div className="flex flex-col gap-1">
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-text-dim w-7 text-right tabular-nums">
              {e.year}
            </span>
            <div className="flex-1 h-0.5 relative">
              <div
                className={`absolute inset-0 rounded-full ${
                  e.status === "correct"
                    ? "bg-green"
                    : e.status === "active"
                      ? "bg-teal animate-pulse"
                      : "bg-gray-200"
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-medium flex-shrink-0 ${
                e.status === "correct"
                  ? "text-green font-bold"
                  : e.status === "active"
                    ? "text-teal font-bold"
                    : "text-text-dim"
              }`}
            >
              {e.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 2048 Mini Preview ────────────────────────────────────────────── */

function Game2048Preview() {
  const tiles = [
    [2, 0, 4, 0],
    [8, 16, 4, 2],
    [32, 64, 8, 4],
    [128, 256, 32, 16],
  ];
  const tileColor: Record<number, string> = {
    0: "bg-stone-200/60",
    2: "bg-stone-100 text-stone-600",
    4: "bg-stone-200 text-stone-600",
    8: "bg-orange-300 text-white",
    16: "bg-orange-400 text-white",
    32: "bg-orange-500 text-white",
    64: "bg-red-400 text-white",
    128: "bg-amber-300 text-white",
    256: "bg-amber-400 text-white",
  };
  return (
    <div className="mb-4 rounded-lg bg-amber/5 border border-amber/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber">
          Score: 1,024
        </span>
        <span className="text-[10px] font-bold text-text-dim">Best: 4,096</span>
      </div>
      <div className="grid grid-cols-4 gap-1 bg-stone-300 rounded-md p-1">
        {tiles.flat().map((v, i) => (
          <div
            key={i}
            className={`${tileColor[v] ?? "bg-purple-500 text-white"} aspect-square flex items-center justify-center rounded text-[9px] font-bold`}
          >
            {v > 0 ? v : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Chain Reaction Mini Preview ────────────────────────────────────── */

function ChainReactionPreview() {
  const chain = [
    { word: "FIRE", status: "solved" },
    { link: "→", status: "solved" },
    { word: "TRUCK", status: "solved" },
    { link: "→", status: "active" },
    { word: "???", status: "pending" },
    { link: "→", status: "pending" },
    { word: "???", status: "pending" },
  ];
  return (
    <div className="mb-4 rounded-lg bg-coral/5 border border-coral/20 p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-coral mb-2 block">
        Complete the chain
      </span>
      <div className="flex items-center gap-1 flex-wrap">
        {chain.map((item, i) =>
          "link" in item && item.link ? (
            <span
              key={i}
              className={`text-[10px] font-bold ${
                item.status === "solved" ? "text-green" : item.status === "active" ? "text-coral animate-pulse" : "text-gray-300"
              }`}
            >
              {item.link}
            </span>
          ) : (
            <span
              key={i}
              className={`text-[10px] font-bold px-2 py-1 rounded ${
                item.status === "solved"
                  ? "bg-green/10 text-green"
                  : item.status === "active"
                    ? "bg-coral/10 text-coral border border-coral/30"
                    : "bg-gray-100 text-text-dim"
              }`}
            >
              {"word" in item ? item.word : ""}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

/* ─── Wordsmith Mini Preview ────────────────────────────────────────── */

function WordsmithPreview() {
  const tiles = ["F", "O", "R", "G", "E", "D", "S"];
  const powerUps = ["\u{1F525}", "\u26A1", "\u{1F48E}"];
  return (
    <div className="mb-4 rounded-lg bg-amber/5 border border-amber/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber">
          Round 3 of 5
        </span>
        <span className="text-[10px] font-bold text-amber">Score: 247</span>
      </div>
      <div className="flex gap-1 mb-2">
        {tiles.map((letter, i) => (
          <span
            key={i}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold border ${
              i < 4
                ? "bg-amber/10 border-amber/30 text-amber"
                : "bg-white border-gray-200 text-text-primary"
            }`}
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {powerUps.map((emoji, i) => (
          <span key={i} className="text-xs bg-amber/10 rounded-full px-1.5 py-0.5">
            {emoji}
          </span>
        ))}
        <span className="text-[9px] text-text-dim ml-auto">Power-ups stack!</span>
      </div>
    </div>
  );
}

/* ─── Meteor Mayhem Mini Preview ─────────────────────────────────────── */

function MeteorPreview() {
  return (
    <div className="mb-4 rounded-lg bg-coral/5 border border-coral/20 p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-coral">Score: 2,450</span>
        <span className="text-[10px] font-bold text-text-dim">Wave 3</span>
      </div>
      <div className="flex justify-center gap-3 py-2">
        <span className="text-3xl" style={{ animation: "meteor-trail 1.5s ease-in-out infinite" }}>☄️</span>
        <span className="text-3xl" style={{ animation: "meteor-trail 1.5s ease-in-out infinite 0.3s" }}>☄️</span>
        <span className="text-2xl" style={{ animation: "float 2s ease-in-out infinite" }}>🚀</span>
        <span className="text-3xl" style={{ animation: "meteor-trail 1.5s ease-in-out infinite 0.6s" }}>☄️</span>
      </div>
      <div className="flex justify-center gap-1 mt-1">
        {[1, 2, 3].map((i) => (
          <span key={i} className="text-[10px] text-coral">❤️</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Big Ah Sword Mini Preview ──────────────────────────────────────── */

function SwordPreview() {
  return (
    <div className="mb-4 rounded-lg bg-coral/5 border border-coral/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-coral">Level 12</span>
        <span className="text-[10px] font-bold text-amber">💰 340 gold</span>
      </div>
      <div className="flex justify-center py-2">
        <span className="text-5xl" style={{ animation: "sword-swing 2s ease-in-out infinite", transformOrigin: "bottom center", display: "inline-block" }}>⚔️</span>
      </div>
      <div className="flex justify-between text-[9px] mt-1">
        <span className="text-text-dim">ATK: <span className="text-coral font-bold">128</span></span>
        <span className="text-text-dim">SIZE: <span className="text-purple font-bold">MEGA</span></span>
        <span className="text-text-dim">SPD: <span className="text-teal font-bold">1.4x</span></span>
      </div>
    </div>
  );
}

/* ─── Sky Hopper Mini Preview ────────────────────────────────────────── */

function SkyHopperPreview() {
  return (
    <div className="mb-4 rounded-lg bg-sky/5 border border-sky/20 p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky">Score: 47</span>
        <span className="text-[10px] font-bold text-amber">Best: 112</span>
      </div>
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex flex-col gap-1">
          <div className="w-4 h-10 bg-green/60 rounded-t-full" />
          <div className="w-4 h-6 bg-green/60 rounded-b-full mt-6" />
        </div>
        <span className="text-3xl" style={{ animation: "bird-flap 0.8s ease-in-out infinite" }}>🐦</span>
        <div className="flex flex-col gap-1">
          <div className="w-4 h-6 bg-green/60 rounded-t-full" />
          <div className="w-4 h-10 bg-green/60 rounded-b-full mt-6" />
        </div>
      </div>
    </div>
  );
}

/* ─── Image-based Previews ────────────────────────────────────────────── */

function HeardlePreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/heardle.jpg" alt="Heardle - guess the song" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

function FramedPreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/framed.jpg" alt="Framed - guess the movie" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

function SlimePreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/slime-volleyball.jpg" alt="Slime Volleyball" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

function KoalaPreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/koala-clicker.jpg" alt="Koala Clicker" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

function SnakePreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/snake-arena.jpg" alt="Snake Arena" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

/* ─── Lexicon Quest Mini Preview ─────────────────────────────────────── */

function LexiconPreview() {
  const tiles = ["Q", "U", "E", "S", "T"];
  return (
    <div className="mb-4 rounded-lg bg-teal/5 border border-teal/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal">Stage 4</span>
        <span className="text-[10px] font-bold text-teal">Score: 580</span>
      </div>
      <div className="flex gap-1 justify-center mb-2">
        {tiles.map((letter, i) => (
          <span
            key={i}
            className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold bg-teal/10 border border-teal/30 text-teal"
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="flex justify-center gap-2 text-[9px] text-text-dim">
        <span>Words: <span className="text-teal font-bold">12</span></span>
        <span>Letters: <span className="text-teal font-bold">7</span></span>
      </div>
    </div>
  );
}

/* ─── Game Preview Router ───────────────────────────────────────────────── */

export default function GamePreview({ slug }: { slug: string }) {
  switch (slug) {
    case "cluster": return <ClusterPreview />;
    case "hexle": return <HexlePreview />;
    case "daily-trivia": return <TriviaPreview />;
    case "crossword": return <CrosswordPreview />;
    case "geo-guess": return <GeoGuessPreview />;
    case "mathler": return <MathlerPreview />;
    case "word-ladder": return <WordLadderPreview />;
    case "heardle": return <HeardlePreview />;
    case "framed": return <FramedPreview />;
    case "slime-volleyball": return <SlimePreview />;
    case "koala-clicker": return <KoalaPreview />;
    case "snake-arena": return <SnakePreview />;
    case "2048": return <Game2048Preview />;
    case "anagram": return <AnagramPreview />;
    case "emoji-word": return <EmojiDecoderPreview />;
    case "top-5": return <Top5Preview />;
    case "quotable": return <QuotablePreview />;
    case "timeline": return <TimelinePreview />;
    case "chain-reaction": return <ChainReactionPreview />;
    case "wordsmith": return <WordsmithPreview />;
    case "meteor-mayhem": return <MeteorPreview />;
    case "ginormo-sword": return <SwordPreview />;
    case "sky-hopper": return <SkyHopperPreview />;
    case "lexicon-quest": return <LexiconPreview />;
    default: return null;
  }
}
