// Outrank — category definitions. The metric, prompt, unit, and value
// formatting are presentation/logic concerns and live here in code (not in
// the DB). `outrank_items.category` must match a key below.

/** Bump when comparison values are refreshed; stored on each challenge so old
 *  shared links stay consistent with the pool they were minted against. */
export const POOL_VERSION = 1;

export interface OutrankCategory {
  key: string;
  /** Question shown above the two tiles. */
  prompt: string;
  /** Short label for the metric (used in the reveal). */
  metricLabel: string;
  /** Formats a raw value into a human-readable string. */
  format: (v: number) => string;
}

function fmtCompact(v: number): string {
  if (v >= 1_000_000_000) return `${trim(v / 1_000_000_000)}B`;
  if (v >= 1_000_000) return `${trim(v / 1_000_000)}M`;
  if (v >= 1_000) return `${trim(v / 1_000)}K`;
  return `${Math.round(v)}`;
}

function fmtMoney(v: number): string {
  return `$${fmtCompact(v)}`;
}

function fmtMeters(v: number): string {
  return `${Math.round(v).toLocaleString("en-US")} m`;
}

function fmtKcal(v: number): string {
  return `${Math.round(v).toLocaleString("en-US")} cal`;
}

/** Round to one decimal unless it's a whole number. */
function trim(n: number): string {
  return n % 1 === 0 ? `${n}` : n.toFixed(1);
}

export const OUTRANK_CATEGORIES: Record<string, OutrankCategory> = {
  population: {
    key: "population",
    prompt: "Which has the bigger population?",
    metricLabel: "Metro population",
    format: fmtCompact,
  },
  box_office: {
    key: "box_office",
    prompt: "Which made more at the box office?",
    metricLabel: "Worldwide gross",
    format: fmtMoney,
  },
  elevation: {
    key: "elevation",
    prompt: "Which is taller?",
    metricLabel: "Height",
    format: fmtMeters,
  },
  calories: {
    key: "calories",
    prompt: "Which has more calories?",
    metricLabel: "Calories",
    format: fmtKcal,
  },
  net_worth: {
    key: "net_worth",
    prompt: "Who is worth more?",
    metricLabel: "Net worth",
    format: fmtMoney,
  },
};

/** The default "mixed" round draws from every category. */
export const ALL_CATEGORY_KEYS = Object.keys(OUTRANK_CATEGORIES);

/** Resolve a category set name to the list of category keys it includes. */
export function resolveCategorySet(set: string): string[] {
  if (set === "mixed" || !set) return ALL_CATEGORY_KEYS;
  return OUTRANK_CATEGORIES[set] ? [set] : ALL_CATEGORY_KEYS;
}
