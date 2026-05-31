"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Math.tsx — thin KaTeX wrappers for rendering LaTeX math.
//   <M>x^2 + 1</M>          → inline math
//   <MathBlock>{`\\int_0^1 x\\,dx`}</MathBlock>  → centered display math
//
// KaTeX renders synchronously to an HTML string (works during SSR too, so no
// layout shift). We render once with useMemo and inject the markup.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

function render(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      output: "htmlAndMathml",
    });
  } catch {
    return tex;
  }
}

/** Inline math. Children must be a plain string of LaTeX. */
export function M({ children }: { children: string }) {
  const html = useMemo(() => render(children, false), [children]);
  return (
    <span
      className="katex-inline"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Display (block, centered) math. */
export function MathBlock({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  const html = useMemo(() => render(children, true), [children]);
  return (
    <div
      className={`katex-block my-3 overflow-x-auto overflow-y-hidden py-1 ${className}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
