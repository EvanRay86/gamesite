import Image from "next/image";

/* ─── Cluster Mini Preview ───────────────────────────────────────────────── */

const clusterWords = [
  { word: "CASH", selected: false },
  { word: "LOVER", selected: true },
  { word: "TABLE", selected: false },
  { word: "RADIO", selected: false },
  { word: "FOLK", selected: true },
  { word: "HEAT", selected: false },
  { word: "PHOTO", selected: false },
  { word: "NIGHT", selected: true },
  { word: "CARD", selected: false },
  { word: "SALSA", selected: false },
  { word: "SOUND", selected: false },
  { word: "POKER", selected: false },
  { word: "CLUB", selected: false },
  { word: "RIDGE", selected: false },
  { word: "RUMMY", selected: false },
];

function ClusterPreview() {
  return (
    <div className="grid grid-cols-5 gap-1 sm:gap-1.5 mb-4">
      {clusterWords.map(({ word, selected }, i) => (
        <div
          key={i}
          className={`rounded-lg py-1.5 sm:py-2 px-0.5 text-center text-[9px] sm:text-[11px] font-bold uppercase tracking-wide transition-all
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
    <div className="mb-3 flex flex-col items-center gap-1">
      {guesses.map((row, ri) => (
        <div key={ri} className="flex gap-0.5">
          {row.word.split("").map((ch, ci) => (
            <div
              key={ci}
              className={`w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center text-[9px] sm:text-[11px] font-bold rounded-md text-white shadow-sm
                ${row.colors[ci] === "green" ? "bg-green" : row.colors[ci] === "amber" ? "bg-amber" : "bg-gray-300/80"}`}
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
    <div className="mb-3 rounded-xl bg-gradient-to-br from-sky/5 to-sky/10 border border-sky/15 p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky">Question 3 of 8</span>
        <span className="text-[10px] font-bold text-coral tabular-nums bg-coral/8 px-2 py-0.5 rounded-full">5s</span>
      </div>
      <p className="text-xs font-semibold text-text-primary leading-snug mb-2.5">
        What planet has the most moons in our solar system?
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-white/80 border border-black/5 px-2 py-2 text-[10px] font-medium text-text-secondary text-center">Jupiter</div>
        <div className="rounded-lg bg-sky text-white px-2 py-2 text-[10px] font-bold text-center shadow-[0_2px_8px_rgba(69,183,209,0.3)]">Saturn</div>
        <div className="rounded-lg bg-white/80 border border-black/5 px-2 py-2 text-[10px] font-medium text-text-secondary text-center">Neptune</div>
        <div className="rounded-lg bg-white/80 border border-black/5 px-2 py-2 text-[10px] font-medium text-text-secondary text-center">Uranus</div>
      </div>
    </div>
  );
}

/* ─── Crossword Mini Preview ────────────────────────────────────────────── */

function CrosswordPreview() {
  const mini: number[][] = [
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
    <div className="mb-3 flex justify-center">
      <div className="inline-grid gap-[2px] bg-text-primary/10 p-[3px] rounded-lg shadow-sm">
        {mini.map((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              className={`flex items-center justify-center text-[9px] sm:text-[10px] font-bold uppercase rounded-[2px]
                ${cell ? "bg-white text-text-primary" : "bg-transparent"}`}
              style={{
                width: 22,
                height: 22,
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
    <div className="mb-3 rounded-xl bg-gradient-to-br from-green/5 to-green/10 border border-green/15 p-3.5">
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-3xl">🇧🇷</span>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-green">Hint 1</span>
          <p className="text-xs font-semibold text-text-primary">South America</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="rounded-lg bg-white/80 border border-black/5 px-2 py-1.5 text-[10px] font-medium text-text-secondary flex-1 text-center">Argentina?</div>
        <div className="rounded-lg bg-green text-white px-2 py-1.5 text-[10px] font-bold flex-1 text-center shadow-[0_2px_8px_rgba(34,197,94,0.3)]">Brazil</div>
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
    <div className="mb-3 flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-purple bg-purple/8 px-2.5 py-0.5 rounded-full mb-1">Target: 12</span>
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-0.5 sm:gap-1">
          {row.chars.split("").map((ch, ci) => (
            <div
              key={ci}
              className={`w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center text-[9px] sm:text-[11px] font-bold rounded-md text-white shadow-sm
                ${row.colors[ci] === "green" ? "bg-green" : row.colors[ci] === "yellow" ? "bg-amber" : "bg-gray-300/80"}`}
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
                  className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[9px] sm:text-[11px] font-bold rounded ${
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
  const scrambled = "RAPTOR".split("");
  return (
    <div className="mb-4 rounded-lg bg-teal/10 border border-teal/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal">Word 2 of 5</span>
        <span className="text-[10px] font-bold text-coral tabular-nums">⏱ 42s</span>
      </div>
      <p className="text-[10px] text-text-dim mb-2">Hint: Bird</p>
      <div className="flex gap-1 justify-center mb-2">
        {scrambled.map((ch, i) => (
          <div key={i} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded bg-gray-100 border border-gray-200 text-[10px] sm:text-[11px] font-bold text-text-primary">
            {ch}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 justify-center">
        <span className="text-[9px] font-semibold text-white bg-teal rounded-full px-2.5 py-0.5">Submit</span>
        <span className="text-[9px] font-semibold text-text-dim bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5">Skip</span>
      </div>
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
    <div className="mb-3 rounded-xl bg-gradient-to-br from-amber/5 to-amber/10 border border-amber/15 p-3.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-amber mb-2.5 block">
        Round 3 of 5
      </span>
      <div className="flex flex-col gap-2">
        {rounds.map((r, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="text-base leading-none">{r.emojis}</span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
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
    <div className="mb-3 rounded-xl bg-gradient-to-br from-amber/5 to-amber/10 border border-amber/15 p-3.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-amber mb-2.5 block">
        Most Populated Countries
      </span>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.rank} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-text-dim w-3 text-right">
              {item.rank}
            </span>
            <div
              className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-center ${
                item.status === "correct"
                  ? "bg-green/10 text-green font-bold"
                  : item.status === "wrong"
                    ? "bg-coral/10 text-coral font-bold"
                    : "bg-white/80 border border-black/5 text-text-secondary"
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
    <div className="mb-3 rounded-xl bg-gradient-to-br from-purple/5 to-purple/10 border border-purple/15 p-3.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-purple mb-2.5 block">
        Who said it?
      </span>
      <div className="flex flex-wrap gap-1 mb-2.5">
        {words.map((w, i) => (
          <span
            key={i}
            className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
              w.revealed
                ? "text-text-primary"
                : "bg-purple/8 text-purple/40"
            }`}
          >
            {w.revealed ? w.text : "━━━"}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-white/80 border border-black/5 px-2 py-1.5 text-[10px] font-medium text-text-secondary text-center">
          Einstein
        </div>
        <div className="rounded-lg bg-purple text-white px-2 py-1.5 text-[10px] font-bold text-center shadow-[0_2px_8px_rgba(168,85,247,0.3)]">
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
    <div className="mb-3 rounded-xl bg-gradient-to-br from-teal/5 to-teal/10 border border-teal/15 p-3.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-teal mb-2.5 block">
        Put in order
      </span>
      <div className="flex flex-col gap-1.5">
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-text-dim w-7 text-right tabular-nums">
              {e.year}
            </span>
            <div className="flex-1 h-[3px] relative rounded-full overflow-hidden bg-gray-100">
              <div
                className={`absolute inset-0 rounded-full ${
                  e.status === "correct"
                    ? "bg-green"
                    : e.status === "active"
                      ? "bg-teal animate-pulse"
                      : "bg-transparent"
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
  const tiles: number[][] = [
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
    <div className="mb-3 rounded-xl bg-gradient-to-br from-amber/5 to-amber/10 border border-amber/15 p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber">
          Score: 1,024
        </span>
        <span className="text-[10px] font-bold text-text-dim">Best: 4,096</span>
      </div>
      <div className="grid grid-cols-4 gap-1 bg-stone-200/80 rounded-lg p-1.5">
        {tiles.flat().map((v, i) => (
          <div
            key={i}
            className={`${tileColor[v] ?? "bg-purple-500 text-white"} aspect-square flex items-center justify-center rounded-md text-[9px] font-bold shadow-sm`}
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
    <div className="mb-3 rounded-xl bg-gradient-to-br from-coral/5 to-coral/10 border border-coral/15 p-3.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-coral mb-2.5 block">
        Complete the chain
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
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
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                item.status === "solved"
                  ? "bg-green/10 text-green"
                  : item.status === "active"
                    ? "bg-coral/10 text-coral border border-coral/25"
                    : "bg-white/80 border border-black/5 text-text-dim"
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
    <div className="mb-3 rounded-xl bg-gradient-to-br from-amber/5 to-amber/10 border border-amber/15 p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber">
          Round 3 of 5
        </span>
        <span className="text-[10px] font-bold text-amber">Score: 247</span>
      </div>
      <div className="flex gap-1 mb-2.5">
        {tiles.map((letter, i) => (
          <span
            key={i}
            className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-[10px] sm:text-xs font-bold border shadow-sm ${
              i < 4
                ? "bg-amber/10 border-amber/25 text-amber"
                : "bg-white/80 border-black/5 text-text-primary"
            }`}
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        {powerUps.map((emoji, i) => (
          <span key={i} className="text-xs bg-amber/10 rounded-full px-2 py-0.5">
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
    <div className="mb-3 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 border border-coral/20 p-3.5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-coral">Score: 2,450</span>
        <span className="text-[10px] font-bold text-gray-400">Wave 3</span>
      </div>
      <div className="flex justify-center gap-3 py-3">
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
      {/* Neon glow overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-xl" style={{background: "radial-gradient(ellipse at 50% 80%, rgba(255,107,107,0.1) 0%, transparent 60%)"}} />
    </div>
  );
}

/* ─── Big Ah Sword Mini Preview ──────────────────────────────────────── */

function SwordPreview() {
  return (
    <div className="mb-3 rounded-xl bg-gradient-to-br from-coral/5 to-coral/10 border border-coral/15 p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-coral">Level 12</span>
        <span className="text-[10px] font-bold text-amber bg-amber/8 px-2 py-0.5 rounded-full">340 gold</span>
      </div>
      <div className="flex justify-center py-3">
        <span className="text-5xl" style={{ animation: "sword-swing 2s ease-in-out infinite", transformOrigin: "bottom center", display: "inline-block" }}>⚔️</span>
      </div>
      <div className="flex justify-between text-[9px] mt-1 bg-white/60 rounded-lg px-3 py-1.5">
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
    <div className="mb-3 rounded-xl bg-gradient-to-b from-[#87CEEB]/30 to-[#E0F7FA]/30 border border-sky/15 p-3.5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky">Score: 47</span>
        <span className="text-[10px] font-bold text-amber bg-amber/8 px-2 py-0.5 rounded-full">Best: 112</span>
      </div>

      {/* Game scene */}
      <div className="relative flex items-end justify-center h-24 sm:h-28">
        {/* Pipe 1 - left */}
        <div className="absolute left-[18%] top-0 bottom-3 flex flex-col items-center gap-7">
          <div className="w-6 flex-1 bg-[#4CAF50] rounded-b-sm shadow-sm relative">
            <div className="absolute bottom-0 left-[-2px] right-[-2px] h-3 bg-[#43A047] rounded-sm" />
          </div>
          <div className="w-6 flex-1 bg-[#4CAF50] rounded-t-sm shadow-sm relative">
            <div className="absolute top-0 left-[-2px] right-[-2px] h-3 bg-[#43A047] rounded-sm" />
          </div>
        </div>

        {/* Bird - yellow circle facing right */}
        <div className="absolute left-[42%] top-[30%] z-10">
          <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
            {/* Body */}
            <ellipse cx="14" cy="14" rx="12" ry="11" fill="#F7B731" />
            {/* Wing */}
            <ellipse cx="10" cy="16" rx="7" ry="5" fill="#FF9800" />
            {/* Eye white */}
            <circle cx="19" cy="10" r="5" fill="white" />
            {/* Eye pupil */}
            <circle cx="20.5" cy="10" r="2.5" fill="#333" />
            {/* Beak */}
            <polygon points="26,13 32,15 26,17" fill="#FF5722" />
          </svg>
        </div>

        {/* Pipe 2 - right */}
        <div className="absolute right-[18%] top-0 bottom-3 flex flex-col items-center gap-10">
          <div className="w-6 flex-1 bg-[#4CAF50] rounded-b-sm shadow-sm relative">
            <div className="absolute bottom-0 left-[-2px] right-[-2px] h-3 bg-[#43A047] rounded-sm" />
          </div>
          <div className="w-6 flex-1 bg-[#4CAF50] rounded-t-sm shadow-sm relative">
            <div className="absolute top-0 left-[-2px] right-[-2px] h-3 bg-[#43A047] rounded-sm" />
          </div>
        </div>

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#8B6914] rounded-b-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#4CAF50]" />
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
  const upgrades = [
    { emoji: "🌿", name: "Baby Koala", count: 12, lps: "2.4" },
    { emoji: "🪺", name: "Cozy Nest", count: 5, lps: "8.0" },
    { emoji: "🌳", name: "Eucalyptus Grove", count: 2, lps: "15.0" },
  ];

  return (
    <div className="mb-3 rounded-xl bg-gradient-to-br from-green/5 to-green/10 border border-green/15 p-3.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-green">Koala Colony</span>
        <span className="text-[10px] font-bold text-green tabular-nums bg-green/8 px-2 py-0.5 rounded-full">🍃 12,847</span>
      </div>

      {/* Koala click target */}
      <div className="flex justify-center mb-2.5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green/15 to-green/25 border-2 border-green/30 flex items-center justify-center shadow-sm">
          <span className="text-3xl sm:text-4xl select-none">🐨</span>
        </div>
      </div>

      {/* Per-second indicator */}
      <div className="text-center mb-2.5">
        <span className="text-[10px] text-text-dim">+25.4 leaves/sec</span>
      </div>

      {/* Mini upgrade list */}
      <div className="flex flex-col gap-1">
        {upgrades.map((u, i) => (
          <div key={i} className="flex items-center gap-2 bg-white/60 rounded-lg px-2 py-1 border border-green/10">
            <span className="text-xs">{u.emoji}</span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-text-primary flex-1">{u.name}</span>
            <span className="text-[8px] text-text-dim">x{u.count}</span>
            <span className="text-[8px] font-bold text-green">+{u.lps}/s</span>
          </div>
        ))}
      </div>
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
    <div className="mb-3 rounded-xl bg-gradient-to-br from-purple/5 to-purple/10 border border-purple/15 p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple">Stage 4</span>
        <span className="text-[10px] font-bold text-purple">Score: 580</span>
      </div>
      <div className="flex gap-1 justify-center mb-2.5">
        {tiles.map((letter, i) => (
          <span
            key={i}
            className="w-6 h-6 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-[10px] sm:text-xs font-bold bg-purple/10 border border-purple/20 text-purple shadow-sm"
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="flex justify-center gap-3 text-[9px] text-text-dim">
        <span>Words: <span className="text-purple font-bold">12</span></span>
        <span>Letters: <span className="text-purple font-bold">7</span></span>
      </div>
    </div>
  );
}

/* ─── Rift Mini Preview ─────────────────────────────────────────────────── */

function RiftPreview() {
  // Mini hex grid data: a small snapshot of faction-controlled territory
  // Each row is offset to create a honeycomb pattern
  const hexRows: { faction: "crimson" | "verdant" | "azure" | null; type: "plains" | "fortress" | "capital" }[][] = [
    [
      { faction: "crimson", type: "plains" },
      { faction: "crimson", type: "fortress" },
      { faction: "crimson", type: "plains" },
      { faction: null, type: "plains" },
      { faction: "azure", type: "plains" },
    ],
    [
      { faction: "crimson", type: "capital" },
      { faction: "crimson", type: "plains" },
      { faction: null, type: "plains" },
      { faction: "azure", type: "plains" },
      { faction: "azure", type: "fortress" },
    ],
    [
      { faction: "crimson", type: "plains" },
      { faction: "verdant", type: "plains" },
      { faction: "verdant", type: "plains" },
      { faction: null, type: "plains" },
      { faction: "azure", type: "capital" },
    ],
    [
      { faction: "verdant", type: "fortress" },
      { faction: "verdant", type: "capital" },
      { faction: "verdant", type: "plains" },
      { faction: "verdant", type: "plains" },
      { faction: "azure", type: "plains" },
    ],
  ];

  const factionColors = {
    crimson: { bg: "bg-[#FF6B6B]", text: "text-[#FF6B6B]", light: "bg-[#FF6B6B]/15" },
    verdant: { bg: "bg-[#22C55E]", text: "text-[#22C55E]", light: "bg-[#22C55E]/15" },
    azure: { bg: "bg-[#45B7D1]", text: "text-[#45B7D1]", light: "bg-[#45B7D1]/15" },
  };

  const typeIcons: Record<string, string> = {
    capital: "♚",
    fortress: "♞",
    plains: "",
  };

  const territory = { crimson: 38, verdant: 31, azure: 31 };

  return (
    <div className="mb-3 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 border border-purple/20 p-3.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple">
          Territory War
        </span>
        <span className="text-[10px] font-bold text-gray-400">Season 4</span>
      </div>

      {/* Mini hex grid */}
      <div className="flex flex-col items-center gap-[3px] mb-3">
        {hexRows.map((row, ri) => (
          <div
            key={ri}
            className="flex gap-[3px]"
            style={{ marginLeft: ri % 2 === 1 ? 14 : 0 }}
          >
            {row.map((hex, ci) => {
              const color = hex.faction ? factionColors[hex.faction] : null;
              return (
                <div
                  key={ci}
                  className={`w-6 h-5 flex items-center justify-center text-[8px] font-bold rounded-sm ${
                    color
                      ? `${color.bg} text-white/90`
                      : "bg-gray-200 text-gray-400"
                  }`}
                  style={{
                    clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                    width: 26,
                    height: 24,
                  }}
                >
                  {typeIcons[hex.type]}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Territory control bars */}
      <div className="flex gap-0.5 rounded-full overflow-hidden h-2 mb-2">
        <div className="bg-[#FF6B6B]" style={{ width: `${territory.crimson}%` }} />
        <div className="bg-[#22C55E]" style={{ width: `${territory.verdant}%` }} />
        <div className="bg-[#45B7D1]" style={{ width: `${territory.azure}%` }} />
      </div>

      {/* Faction labels */}
      <div className="flex justify-between text-[9px] mb-2.5">
        <span className="text-[#FF6B6B] font-bold">Crimson {territory.crimson}%</span>
        <span className="text-[#22C55E] font-bold">Verdant {territory.verdant}%</span>
        <span className="text-[#45B7D1] font-bold">Azure {territory.azure}%</span>
      </div>

      {/* Duel preview */}
      <div className="flex items-center justify-between bg-white/10 rounded-lg px-2.5 py-2 border border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-purple uppercase">Duel</span>
          <span className="text-[10px] font-semibold text-gray-200">Word Blitz</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-gray-400">ELO</span>
          <span className="text-[10px] font-bold text-amber">1247</span>
          <span className="text-[8px] px-1 py-0.5 rounded bg-amber/20 text-amber font-bold uppercase">Captain</span>
        </div>
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
    case "rift": return <RiftPreview />;
    default: return null;
  }
}
