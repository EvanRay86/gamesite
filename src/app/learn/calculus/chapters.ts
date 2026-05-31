// Chapter navigation structure for the Teach Me Calculus page.
// Shared by the table of contents (scroll-spy) and the page body.

export interface ChapterMeta {
  id: string;
  label: string;
  /** Short number/letter badge, e.g. "1" or "BC". */
  badge: string;
  accent: "coral" | "teal" | "sky" | "amber" | "purple" | "green";
  /** Grouping for the TOC. */
  group: string;
}

export const CHAPTERS: ChapterMeta[] = [
  { id: "intro", label: "What Is Calculus?", badge: "★", accent: "purple", group: "Start Here" },
  { id: "prereqs", label: "Algebra & Functions Refresher", badge: "0", accent: "teal", group: "Start Here" },

  { id: "limits", label: "Limits & Continuity", badge: "1", accent: "sky", group: "Differential Calculus" },
  { id: "derivatives", label: "The Derivative", badge: "2", accent: "coral", group: "Differential Calculus" },
  { id: "deriv-rules", label: "Differentiation Rules", badge: "3", accent: "amber", group: "Differential Calculus" },
  { id: "deriv-apps", label: "Applications of Derivatives", badge: "4", accent: "purple", group: "Differential Calculus" },

  { id: "integrals", label: "The Integral & the FTC", badge: "5", accent: "green", group: "Integral Calculus" },
  { id: "int-techniques", label: "Integration Techniques", badge: "6", accent: "teal", group: "Integral Calculus" },
  { id: "int-apps", label: "Applications of Integration", badge: "7", accent: "sky", group: "Integral Calculus" },

  { id: "series", label: "Sequences & Series", badge: "BC", accent: "coral", group: "Calculus II (BC)" },
  { id: "parametric-polar", label: "Parametric & Polar", badge: "BC", accent: "amber", group: "Calculus II (BC)" },
  { id: "diffeq", label: "Differential Equations", badge: "BC", accent: "purple", group: "Calculus II (BC)" },

  { id: "multivariable", label: "Multivariable Calculus", badge: "III", accent: "green", group: "Calculus III" },

  { id: "realworld", label: "Calculus in the Real World", badge: "🌍", accent: "teal", group: "Apply It" },
  { id: "cheatsheet", label: "Formula Cheat Sheet", badge: "📋", accent: "sky", group: "Apply It" },
  { id: "practice", label: "Practice Hub", badge: "🎯", accent: "coral", group: "Apply It" },

  { id: "faq", label: "FAQ", badge: "?", accent: "amber", group: "Reference" },
  { id: "glossary", label: "Glossary", badge: "A-Z", accent: "purple", group: "Reference" },
];

/** Ordered list of section ids (for progress totals). */
export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);

/** Chapters grouped for the TOC. */
export function groupedChapters(): { group: string; items: ChapterMeta[] }[] {
  const out: { group: string; items: ChapterMeta[] }[] = [];
  for (const ch of CHAPTERS) {
    let g = out.find((o) => o.group === ch.group);
    if (!g) {
      g = { group: ch.group, items: [] };
      out.push(g);
    }
    g.items.push(ch);
  }
  return out;
}
