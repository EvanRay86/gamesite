"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TableOfContents.tsx — sticky scroll-spy nav (desktop rail + mobile drawer)
// and the slim top scroll-progress bar.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { groupedChapters, CHAPTER_IDS } from "@/app/learn/calculus/chapters";
import { useProgress } from "./progress";

const ACCENT_TEXT: Record<string, string> = {
  coral: "text-coral",
  teal: "text-teal",
  sky: "text-sky",
  amber: "text-amber",
  purple: "text-purple",
  green: "text-green",
};
const ACCENT_BG: Record<string, string> = {
  coral: "bg-coral",
  teal: "bg-teal",
  sky: "bg-sky",
  amber: "bg-amber",
  purple: "bg-purple",
  green: "bg-green",
};

export function ScrollProgressBar() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const total = h.scrollHeight - h.clientHeight;
      setPct(total > 0 ? (scrolled / total) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-coral via-purple to-teal transition-[width] duration-150"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function useActiveSection(): string {
  const [active, setActive] = useState(CHAPTER_IDS[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    CHAPTER_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

function TocList({ active, onPick }: { active: string; onPick?: () => void }) {
  const { isComplete } = useProgress();
  const groups = groupedChapters();
  return (
    <nav className="space-y-4">
      {groups.map((g) => (
        <div key={g.group}>
          <div className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-text-dim">
            {g.group}
          </div>
          <ul className="space-y-0.5">
            {g.items.map((ch) => {
              const isActive = active === ch.id;
              const done = isComplete(ch.id);
              return (
                <li key={ch.id}>
                  <a
                    href={`#${ch.id}`}
                    onClick={onPick}
                    className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors no-underline ${
                      isActive
                        ? `${ACCENT_BG[ch.accent]}/10 ${ACCENT_TEXT[ch.accent]} font-semibold`
                        : "text-text-muted hover:bg-surface"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                        isActive
                          ? `${ACCENT_BG[ch.accent]} text-white`
                          : "bg-surface text-text-dim"
                      }`}
                    >
                      {ch.badge}
                    </span>
                    <span className="flex-1 leading-tight">{ch.label}</span>
                    {done && <span className="text-green">✓</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DesktopToc() {
  const active = useActiveSection();
  const { completed } = useProgress();
  const pct = Math.round((completed.length / CHAPTER_IDS.length) * 100);
  return (
    <aside className="sticky top-4 hidden max-h-[calc(100vh-2rem)] w-64 shrink-0 overflow-y-auto pr-2 lg:block scrollbar-hide">
      <div className="mb-3 rounded-xl bg-white/70 p-3">
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-text-muted">
          <span>Course progress</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green to-teal transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <TocList active={active} />
    </aside>
  );
}

export function MobileToc() {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-purple px-4 py-3 text-sm font-bold text-white shadow-lg lg:hidden"
        aria-label="Open table of contents"
      >
        ☰ Contents
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="animate-[slide-down_0.2s_ease] absolute inset-y-0 right-0 w-[82%] max-w-sm overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-lg text-text-primary">Contents</span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text-muted"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <TocList active={active} onPick={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
