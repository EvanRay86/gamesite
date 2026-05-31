"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ui.tsx — small presentational building blocks shared across every chapter:
// colored callouts, collapsible panels, worked-example boxes, key-idea cards,
// and the chapter <Section> wrapper (which also wires "mark complete").
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useProgress } from "./progress";

// ── Callouts ─────────────────────────────────────────────────────────────────

type CalloutKind =
  | "intuition"
  | "example"
  | "warning"
  | "realworld"
  | "tip"
  | "note"
  | "definition";

const CALLOUT_STYLE: Record<
  CalloutKind,
  { border: string; bg: string; icon: string; label: string; text: string }
> = {
  intuition: { border: "border-purple", bg: "bg-purple/5", icon: "💡", label: "Intuition", text: "text-purple" },
  example: { border: "border-sky", bg: "bg-sky/5", icon: "✏️", label: "Worked Example", text: "text-sky" },
  warning: { border: "border-coral", bg: "bg-coral/5", icon: "⚠️", label: "Common Mistake", text: "text-coral" },
  realworld: { border: "border-green", bg: "bg-green/5", icon: "🌍", label: "Real World", text: "text-green" },
  tip: { border: "border-amber", bg: "bg-amber/5", icon: "🎯", label: "Tip", text: "text-amber" },
  note: { border: "border-teal", bg: "bg-teal/5", icon: "📌", label: "Note", text: "text-teal" },
  definition: { border: "border-purple", bg: "bg-purple/5", icon: "📖", label: "Definition", text: "text-purple" },
};

export function Callout({
  kind,
  title,
  children,
}: {
  kind: CalloutKind;
  title?: string;
  children: React.ReactNode;
}) {
  const s = CALLOUT_STYLE[kind];
  return (
    <div className={`my-4 rounded-xl border-l-4 ${s.border} ${s.bg} p-4`}>
      <div className={`mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${s.text}`}>
        <span className="text-base">{s.icon}</span>
        {title ?? s.label}
      </div>
      <div className="text-[15px] leading-relaxed text-text-secondary [&_p]:mb-2 [&_p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

// ── Collapsible panel ────────────────────────────────────────────────────────

export function Collapsible({
  summary,
  children,
  defaultOpen = false,
  accent = "purple",
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border-light bg-white/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-semibold text-text-primary transition-colors hover:bg-${accent}/5`}
        aria-expanded={open}
      >
        <span>{summary}</span>
        <span
          className={`shrink-0 text-${accent} transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="animate-fade-in border-t border-border-light px-4 py-3 text-[15px] leading-relaxed text-text-secondary">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Key-idea card ────────────────────────────────────────────────────────────

export function KeyIdea({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="clay-card my-4 p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber/15 text-base">🔑</span>
        <h4 className="font-display text-lg text-text-primary">{title}</h4>
      </div>
      <div className="text-[15px] leading-relaxed text-text-secondary">{children}</div>
    </div>
  );
}

// ── Step-by-step solution list ───────────────────────────────────────────────

export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="calc-steps my-3 space-y-2.5">{children}</ol>;
}

export function Step({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky/15 text-[11px] font-bold text-sky calc-step-num" />
      <div className="flex-1">{children}</div>
    </li>
  );
}

// ── Chapter section wrapper ──────────────────────────────────────────────────

const ACCENTS: Record<string, { bg: string; text: string; ring: string }> = {
  coral: { bg: "bg-coral", text: "text-coral", ring: "ring-coral/30" },
  teal: { bg: "bg-teal", text: "text-teal", ring: "ring-teal/30" },
  sky: { bg: "bg-sky", text: "text-sky", ring: "ring-sky/30" },
  amber: { bg: "bg-amber", text: "text-amber", ring: "ring-amber/30" },
  purple: { bg: "bg-purple", text: "text-purple", ring: "ring-purple/30" },
  green: { bg: "bg-green", text: "text-green", ring: "ring-green/30" },
};

export function Section({
  id,
  number,
  title,
  subtitle,
  accent = "purple",
  children,
}: {
  id: string;
  number?: string;
  title: string;
  subtitle?: string;
  accent?: keyof typeof ACCENTS;
  children: React.ReactNode;
}) {
  const { isComplete, toggleSection } = useProgress();
  const done = isComplete(id);
  const a = ACCENTS[accent] ?? ACCENTS.purple;

  return (
    <section id={id} className="scroll-mt-24 py-10">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {number && (
            <span
              className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${a.bg} text-sm font-bold text-white shadow-sm`}
            >
              {number}
            </span>
          )}
          <div>
            <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">{title}</h2>
            {subtitle && <p className="mt-1 text-text-muted">{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={() => toggleSection(id)}
          className={`mt-1 hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:flex ${
            done
              ? `${a.bg} text-white`
              : `bg-surface text-text-muted hover:bg-surface-hover`
          }`}
          aria-pressed={done}
        >
          {done ? "✓ Done" : "Mark done"}
        </button>
      </div>
      <div className="calc-prose">{children}</div>
      <button
        onClick={() => toggleSection(id)}
        className={`mt-6 flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold transition-all sm:hidden ${
          done ? `${a.bg} text-white` : `bg-surface text-text-muted`
        }`}
        aria-pressed={done}
      >
        {done ? "✓ Section complete" : "Mark section complete"}
      </button>
    </section>
  );
}

// ── Simple stat pill row ─────────────────────────────────────────────────────

export function StatPills({
  items,
}: {
  items: { label: string; value: string; color?: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it, i) => (
        <span
          key={i}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            it.color ? `bg-${it.color}/10 text-${it.color}` : "bg-surface text-text-muted"
          }`}
        >
          {it.label}: <span className="font-bold">{it.value}</span>
        </span>
      ))}
    </div>
  );
}
