"use client";

import { useMemo } from "react";

const FONTS = [
  "Outfit",
  "DM Serif Display",
  "Georgia",
  "Courier New",
  "Arial Black",
  "Impact",
  "Trebuchet MS",
  "Palatino",
  "Lucida Console",
  "Comic Sans MS",
];

const COLORS = [
  "#FF6B6B", // coral
  "#4ECDC4", // teal
  "#45B7D1", // sky
  "#F7B731", // amber
  "#A855F7", // purple
  "#22C55E", // green
  "#FF8C42", // orange
  "#E91E8C", // pink
  "#6366F1", // indigo
  "#14B8A6", // emerald
];

const SIZES = [14, 16, 18, 20, 24, 28, 32];

/** Seeded pseudo-random for deterministic SSR/client match */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateRow(rowIndex: number, count: number) {
  const rand = seededRandom(rowIndex * 997 + 42);
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      font: FONTS[Math.floor(rand() * FONTS.length)],
      color: COLORS[Math.floor(rand() * COLORS.length)],
      size: SIZES[Math.floor(rand() * SIZES.length)],
      rotation: Math.floor(rand() * 7) - 3, // -3 to 3 degrees
    });
  }
  return items;
}

const ROW_COUNT = 14;
const ITEMS_PER_ROW = 20;

export default function MarqueeBg() {
  const rows = useMemo(() => {
    return Array.from({ length: ROW_COUNT }, (_, i) => ({
      items: generateRow(i, ITEMS_PER_ROW),
      duration: 60 + (i % 5) * 20, // 60-140s, varied speeds
      reverse: i % 2 === 1,
      offset: (i % 3) * -20, // stagger start positions
    }));
  }, []);

  return (
    <div className="marquee-bg">
      {rows.map((row, ri) => (
        <div
          key={ri}
          className={`marquee-row ${row.reverse ? "reverse" : ""}`}
          style={{
            // @ts-expect-error CSS custom property
            "--duration": `${row.duration}s`,
            marginLeft: `${row.offset}%`,
          }}
        >
          {/* Double the items so the loop is seamless */}
          {[...row.items, ...row.items].map((item, ii) => (
            <span
              key={ii}
              style={{
                fontFamily: item.font,
                color: item.color,
                fontSize: `${item.size}px`,
                transform: `rotate(${item.rotation}deg)`,
                display: "inline-block",
                padding: "4px 16px",
                fontWeight: item.size > 22 ? 800 : 600,
                letterSpacing: item.size > 24 ? "-0.5px" : "0.5px",
              }}
              aria-hidden="true"
            >
              gamesite.app
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
