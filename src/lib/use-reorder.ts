"use client";

import { useState, useCallback, useRef } from "react";

interface UseReorderOptions {
  lockedIndices?: Set<number>;
}

export function useReorder<T>(
  items: T[],
  onReorder: (newItems: T[]) => void,
  options?: UseReorderOptions
) {
  const lockedIndices = options?.lockedIndices ?? new Set<number>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const rectsRef = useRef<DOMRect[]>([]);

  const captureRects = useCallback(() => {
    if (!containerRef.current) return;
    const children = Array.from(containerRef.current.children) as HTMLElement[];
    rectsRef.current = children.map((c) => c.getBoundingClientRect());
  }, []);

  const getOverIdx = useCallback((clientY: number): number => {
    const rects = rectsRef.current;
    for (let i = 0; i < rects.length; i++) {
      const mid = rects[i].top + rects[i].height / 2;
      if (clientY < mid) return i;
    }
    return rects.length - 1;
  }, []);

  const handlePointerDown = useCallback(
    (index: number, e: React.PointerEvent) => {
      if (lockedIndices.has(index)) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      captureRects();
      setActiveIndex(index);
      setOverIndex(index);
      setSelectedIndex(null);
    },
    [lockedIndices, captureRects]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (activeIndex === null) return;
      const idx = getOverIdx(e.clientY);
      setOverIndex(idx);
    },
    [activeIndex, getOverIdx]
  );

  const handlePointerUp = useCallback(() => {
    if (activeIndex === null || overIndex === null) {
      setActiveIndex(null);
      setOverIndex(null);
      return;
    }

    if (activeIndex !== overIndex && !lockedIndices.has(overIndex)) {
      const newItems = [...items];
      const [removed] = newItems.splice(activeIndex, 1);
      newItems.splice(overIndex, 0, removed);
      onReorder(newItems);
    }

    setActiveIndex(null);
    setOverIndex(null);
  }, [activeIndex, overIndex, items, onReorder, lockedIndices]);

  const handleTap = useCallback(
    (index: number) => {
      if (lockedIndices.has(index)) return;
      if (activeIndex !== null) return; // dragging

      if (selectedIndex === null) {
        setSelectedIndex(index);
      } else if (selectedIndex === index) {
        setSelectedIndex(null);
      } else {
        // Swap
        if (!lockedIndices.has(selectedIndex)) {
          const newItems = [...items];
          [newItems[selectedIndex], newItems[index]] = [
            newItems[index],
            newItems[selectedIndex],
          ];
          onReorder(newItems);
        }
        setSelectedIndex(null);
      }
    },
    [selectedIndex, activeIndex, items, onReorder, lockedIndices]
  );

  return {
    containerRef,
    activeIndex,
    overIndex,
    selectedIndex,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTap,
  };
}
