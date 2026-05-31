"use client";

// ─────────────────────────────────────────────────────────────────────────────
// progress.tsx — course progress tracking, persisted to localStorage.
//
// One provider wraps the whole page. Any widget can mark a section complete or
// record a solved practice problem; the sticky table of contents and the top
// progress bar read the same state.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "gamesite-calculus-progress";

export interface ProgressState {
  /** Section ids the learner has marked done. */
  completed: string[];
  /** Practice problems solved, keyed by generator/topic id. */
  solved: Record<string, number>;
  /** Total practice problems solved (across everything). */
  totalSolved: number;
}

interface ProgressContextValue extends ProgressState {
  toggleSection: (id: string) => void;
  isComplete: (id: string) => boolean;
  markSolved: (topicId: string) => void;
  reset: () => void;
}

const empty: ProgressState = { completed: [], solved: {}, totalSolved: 0 };

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function CalculusProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ProgressState>(empty);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...empty, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const toggleSection = useCallback((id: string) => {
    setState((s) => {
      const has = s.completed.includes(id);
      return {
        ...s,
        completed: has
          ? s.completed.filter((c) => c !== id)
          : [...s.completed, id],
      };
    });
  }, []);

  const isComplete = useCallback(
    (id: string) => state.completed.includes(id),
    [state.completed],
  );

  const markSolved = useCallback((topicId: string) => {
    setState((s) => ({
      ...s,
      solved: { ...s.solved, [topicId]: (s.solved[topicId] ?? 0) + 1 },
      totalSolved: s.totalSolved + 1,
    }));
  }, []);

  const reset = useCallback(() => setState(empty), []);

  const value = useMemo<ProgressContextValue>(
    () => ({ ...state, toggleSection, isComplete, markSolved, reset }),
    [state, toggleSection, isComplete, markSolved, reset],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    // Graceful fallback so components don't crash outside the provider.
    return {
      ...empty,
      toggleSection: () => {},
      isComplete: () => false,
      markSolved: () => {},
      reset: () => {},
    };
  }
  return ctx;
}
