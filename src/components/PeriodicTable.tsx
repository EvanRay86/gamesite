"use client";

import { ELEMENTS } from "@/lib/periodic-puzzle-data";
import type { Element } from "@/types/periodic-puzzle";

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  "alkali metal":         { bg: "bg-rose-400 dark:bg-rose-600",       text: "text-white",               border: "border-rose-500" },
  "alkaline earth metal": { bg: "bg-orange-400 dark:bg-orange-600",   text: "text-white",               border: "border-orange-500" },
  "transition metal":     { bg: "bg-blue-400 dark:bg-blue-600",       text: "text-white",               border: "border-blue-500" },
  "post-transition metal":{ bg: "bg-teal-400 dark:bg-teal-600",       text: "text-white",               border: "border-teal-500" },
  "metalloid":            { bg: "bg-emerald-400 dark:bg-emerald-600", text: "text-white",               border: "border-emerald-500" },
  "nonmetal":             { bg: "bg-yellow-300 dark:bg-yellow-600",   text: "text-zinc-800 dark:text-white", border: "border-yellow-400" },
  "halogen":              { bg: "bg-cyan-400 dark:bg-cyan-600",       text: "text-white",               border: "border-cyan-500" },
  "noble gas":            { bg: "bg-purple-400 dark:bg-purple-600",   text: "text-white",               border: "border-purple-500" },
  "lanthanide":           { bg: "bg-pink-300 dark:bg-pink-500",       text: "text-zinc-800 dark:text-white", border: "border-pink-400" },
  "actinide":             { bg: "bg-amber-400 dark:bg-amber-600",     text: "text-white",               border: "border-amber-500" },
};

const defaultColor = { bg: "bg-zinc-300 dark:bg-zinc-600", text: "text-zinc-800 dark:text-white", border: "border-zinc-400" };

/**
 * Map each element to its grid position.
 * Standard table: 18 columns, 7 rows + 2 f-block rows below.
 * Lanthanides (57-71) go in row 9, actinides (89-103) in row 10.
 */
function getGridPosition(el: Element): { row: number; col: number } {
  // Lanthanides
  if (el.atomicNumber >= 57 && el.atomicNumber <= 71) {
    return { row: 9, col: el.atomicNumber - 57 + 3 };
  }
  // Actinides
  if (el.atomicNumber >= 89 && el.atomicNumber <= 103) {
    return { row: 10, col: el.atomicNumber - 89 + 3 };
  }
  return { row: el.period, col: el.group };
}

interface Props {
  guessedElements: Map<string, "correct" | "wrong">;
  onElementClick: (name: string) => void;
  disabled: boolean;
}

export default function PeriodicTable({ guessedElements, onElementClick, disabled }: Props) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div
        className="mx-auto"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(18, minmax(24px, 1fr))",
          gridTemplateRows: "repeat(7, auto) 12px repeat(2, auto)",
          gap: "1px",
          minWidth: "460px",
          maxWidth: "750px",
        }}
      >
        {ELEMENTS.map((el) => {
          const { row, col } = getGridPosition(el);
          const guessStatus = guessedElements.get(el.name);
          const colors = categoryColors[el.category] ?? defaultColor;

          let cellBg: string;
          let cellText: string;
          let overlay: string | null = null;

          if (guessStatus === "correct") {
            cellBg = "bg-green-500 dark:bg-green-500";
            cellText = "text-white";
            overlay = "✓";
          } else if (guessStatus === "wrong") {
            cellBg = "bg-zinc-400/50 dark:bg-zinc-700/50";
            cellText = "text-zinc-500 dark:text-zinc-500";
            overlay = "✗";
          } else {
            cellBg = colors.bg;
            cellText = colors.text;
          }

          return (
            <button
              key={el.atomicNumber}
              onClick={() => !disabled && !guessStatus && onElementClick(el.name)}
              disabled={disabled || !!guessStatus}
              title={el.name}
              className={`relative flex flex-col items-center justify-center rounded-sm ${cellBg} ${cellText} p-0.5 transition-all hover:brightness-110 hover:scale-105 disabled:cursor-default disabled:hover:scale-100 disabled:hover:brightness-100`}
              style={{
                gridRow: row <= 7 ? row : row,
                gridColumn: col,
                minHeight: "36px",
              }}
            >
              <span className="text-[8px] leading-none opacity-70">{el.atomicNumber}</span>
              <span className="text-xs font-bold leading-none">{el.symbol}</span>
              {overlay && (
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold opacity-60">
                  {overlay}
                </span>
              )}
            </button>
          );
        })}

        {/* Spacer row 8 with label arrows */}
        <div
          style={{ gridRow: 8, gridColumn: "1 / 3" }}
          className="flex items-center justify-end pr-1 text-[9px] text-zinc-400 dark:text-zinc-500"
        >
          ★
        </div>

        {/* Legend */}
        <div
          style={{ gridRow: 9, gridColumn: "1 / 3" }}
          className="flex items-center justify-end pr-1 text-[8px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap"
        >
          57-71
        </div>
        <div
          style={{ gridRow: 10, gridColumn: "1 / 3" }}
          className="flex items-center justify-end pr-1 text-[8px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap"
        >
          89-103
        </div>
      </div>

      {/* Category legend */}
      <div className="mx-auto mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] text-zinc-500 dark:text-zinc-400" style={{ maxWidth: "900px" }}>
        {Object.entries(categoryColors).map(([cat, c]) => (
          <span key={cat} className="flex items-center gap-1">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${c.bg}`} />
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}
