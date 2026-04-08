"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { CrosswordPuzzle, CrosswordClue } from "@/types/crossword";
import { shareOrCopy } from "@/lib/share";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";
import StatsButton from "@/components/StatsButton";
import XShareButton from "@/components/XShareButton";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCellsForClue(clue: CrosswordClue): string[] {
  const cells: string[] = [];
  for (let i = 0; i < clue.answer.length; i++) {
    const r = clue.direction === "down" ? clue.row + i : clue.row;
    const c = clue.direction === "across" ? clue.col + i : clue.col;
    cells.push(`${r},${c}`);
  }
  return cells;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  puzzle: CrosswordPuzzle;
}

export default function CrosswordGame({ puzzle }: Props) {
  const { grid, clues, rows, cols } = puzzle;

  // User input state: map of "row,col" -> letter
  const [userGrid, setUserGrid] = useState<Record<string, string>>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedClue, setSelectedClue] = useState<CrosswordClue | null>(null);
  const [direction, setDirection] = useState<"across" | "down">("across");
  const [solved, setSolved] = useState(false);
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [confirmedCorrect, setConfirmedCorrect] = useState<Set<string>>(new Set());
  const [checkedWrong, setCheckedWrong] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Pinch-zoom & pan refs
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gridInnerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
  const [isZoomed, setIsZoomed] = useState(false);
  const [gridReady, setGridReady] = useState(false);
  const transformRef = useRef({ scale: 1, tx: 0, ty: 0 });
  const gestureRef = useRef({
    initialScale: 1,
    gridW: 0,
    gridH: 0,
    containerW: 0,
    pinching: false,
    panning: false,
    pinchDist0: 0,
    pinchScale0: 0,
    pinchTx0: 0,
    pinchTy0: 0,
    pinchMidX0: 0,
    pinchMidY0: 0,
    panX0: 0,
    panY0: 0,
    panTx0: 0,
    panTy0: 0,
    suppressUntil: 0,
  });

  const { stats, recordGame } = useGameStats("crossword", puzzle.date);

  // All clues flat
  const allClues = useMemo(
    () => [...clues.across, ...clues.down],
    [clues]
  );

  // Map cell key -> clues that pass through it
  const cellToClues = useMemo(() => {
    const map = new Map<string, CrosswordClue[]>();
    for (const clue of allClues) {
      for (const key of getCellsForClue(clue)) {
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(clue);
      }
    }
    return map;
  }, [allClues]);

  // Highlighted cells for current clue
  const highlightedCells = useMemo(() => {
    if (!selectedClue) return new Set<string>();
    return new Set(getCellsForClue(selectedClue));
  }, [selectedClue]);

  // Find clue for a cell in a given direction
  const findClueForCell = useCallback(
    (key: string, dir: "across" | "down"): CrosswordClue | undefined => {
      return cellToClues.get(key)?.find((c) => c.direction === dir);
    },
    [cellToClues]
  );

  // Select a cell
  const selectCell = useCallback(
    (row: number, col: number) => {
      if (Date.now() < gestureRef.current.suppressUntil) return;
      const key = `${row},${col}`;
      const cell = grid[row]?.[col];
      if (!cell || cell.isBlack) return;

      // If clicking the already-selected cell, toggle direction
      let newDir = direction;
      if (selectedCell === key) {
        newDir = direction === "across" ? "down" : "across";
      }

      // Find the clue for this cell in the desired direction
      let clue = findClueForCell(key, newDir);
      if (!clue) {
        // Fall back to the other direction
        newDir = newDir === "across" ? "down" : "across";
        clue = findClueForCell(key, newDir);
      }

      setDirection(newDir);
      setSelectedCell(key);
      setSelectedClue(clue ?? null);

      // Focus input
      setTimeout(() => inputRefs.current[key]?.focus(), 0);
    },
    [direction, selectedCell, findClueForCell, grid]
  );

  // Move to next cell in current direction
  const moveToNext = useCallback(
    (row: number, col: number, backward = false) => {
      const delta = backward ? -1 : 1;
      const r = direction === "down" ? row + delta : row;
      const c = direction === "across" ? col + delta : col;
      if (r >= 0 && r < rows && c >= 0 && c < cols && !grid[r][c].isBlack) {
        const key = `${r},${c}`;
        setSelectedCell(key);
        const clue = findClueForCell(key, direction);
        if (clue) setSelectedClue(clue);
        setTimeout(() => inputRefs.current[key]?.focus(), 0);
      }
    },
    [direction, rows, cols, grid, findClueForCell]
  );

  // Handle letter input (works on both desktop and mobile)
  const enterLetter = useCallback(
    (row: number, col: number, letter: string) => {
      const key = `${row},${col}`;
      const upper = letter.toUpperCase();
      setUserGrid((prev) => ({ ...prev, [key]: upper }));
      setCheckedWrong((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      moveToNext(row, col);
    },
    [moveToNext]
  );

  // Advance to the next clue in the same direction
  const advanceToNextClue = useCallback(
    (fromClue: CrosswordClue) => {
      const list = fromClue.direction === "across" ? clues.across : clues.down;
      const idx = list.findIndex((c) => c.number === fromClue.number);
      const nextClue = list[(idx + 1) % list.length];
      const cells = getCellsForClue(nextClue);
      setSelectedClue(nextClue);
      setDirection(nextClue.direction);
      setSelectedCell(cells[0]);
      setTimeout(() => inputRefs.current[cells[0]]?.focus(), 0);
    },
    [clues]
  );

  // Check the currently selected word — green if correct, red if wrong
  const handleCheckWord = useCallback(
    (cellKey: string) => {
      // Try to find a fully-filled clue through this cell
      const cluesForCell = cellToClues.get(cellKey) ?? [];
      let matchedClue: CrosswordClue | null = null;

      for (const clue of cluesForCell) {
        const cells = getCellsForClue(clue);
        if (cells.every((k) => userGrid[k])) {
          matchedClue = clue;
          break;
        }
      }

      // If nothing matched at this cell, fall back to selectedClue
      if (!matchedClue && selectedClue) {
        const cells = getCellsForClue(selectedClue);
        if (cells.every((k) => userGrid[k])) {
          matchedClue = selectedClue;
        }
      }

      if (!matchedClue) return;

      const cells = getCellsForClue(matchedClue);
      const isCorrect = cells.every(
        (k, i) => userGrid[k] === matchedClue!.answer[i]
      );

      if (isCorrect) {
        // Mark cells green and advance to next clue
        setConfirmedCorrect((prev) => {
          const next = new Set(prev);
          for (const k of cells) next.add(k);
          return next;
        });
        advanceToNextClue(matchedClue);
      } else {
        // Mark cells red
        setCheckedWrong((prev) => {
          const next = new Set(prev);
          for (const k of cells) next.add(k);
          return next;
        });
      }
    },
    [cellToClues, selectedClue, userGrid, advanceToNextClue]
  );

  // Handle key input (desktop keyboard + navigation)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number) => {
      const key = `${row},${col}`;

      if (e.key === "Tab") {
        e.preventDefault();
        // Move to next clue
        if (!selectedClue) return;
        const list = selectedClue.direction === "across" ? clues.across : clues.down;
        const idx = list.findIndex((c) => c.number === selectedClue.number);
        let nextClue: CrosswordClue;
        if (e.shiftKey) {
          nextClue = list[(idx - 1 + list.length) % list.length];
        } else {
          nextClue = list[(idx + 1) % list.length];
        }
        const cells = getCellsForClue(nextClue);
        setSelectedClue(nextClue);
        setDirection(nextClue.direction);
        setSelectedCell(cells[0]);
        setTimeout(() => inputRefs.current[cells[0]]?.focus(), 0);
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        if (userGrid[key]) {
          setUserGrid((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        } else {
          moveToNext(row, col, true);
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (row > 0 && !grid[row - 1][col].isBlack) {
          selectCell(row - 1, col);
          if (direction !== "down") setDirection("down");
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (row < rows - 1 && !grid[row + 1][col].isBlack) {
          selectCell(row + 1, col);
          if (direction !== "down") setDirection("down");
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (col > 0 && !grid[row][col - 1].isBlack) {
          selectCell(row, col - 1);
          if (direction !== "across") setDirection("across");
        }
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (col < cols - 1 && !grid[row][col + 1].isBlack) {
          selectCell(row, col + 1);
          if (direction !== "across") setDirection("across");
        }
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        handleCheckWord(key);
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        enterLetter(row, col, e.key);
      }
    },
    [userGrid, selectedClue, clues, direction, moveToNext, selectCell, grid, rows, cols, enterLetter, handleCheckWord]
  );

  // Handle mobile input via beforeinput (fires reliably on mobile virtual keyboards)
  const handleBeforeInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>, row: number, col: number) => {
      const nativeEvent = e.nativeEvent as InputEvent;
      const data = nativeEvent.data;
      if (data && /^[a-zA-Z]$/.test(data)) {
        e.preventDefault();
        enterLetter(row, col, data);
      }
    },
    [enterLetter]
  );

  // Check if puzzle is solved
  useEffect(() => {
    if (solved) return;
    let allCorrect = true;
    for (const clue of allClues) {
      for (let i = 0; i < clue.answer.length; i++) {
        const r = clue.direction === "down" ? clue.row + i : clue.row;
        const c = clue.direction === "across" ? clue.col + i : clue.col;
        const key = `${r},${c}`;
        if (userGrid[key] !== clue.answer[i]) {
          allCorrect = false;
          break;
        }
      }
      if (!allCorrect) break;
    }
    if (allCorrect && Object.keys(userGrid).length > 0) {
      setSolved(true);
      recordGame(true, 1);
      setTimeout(() => setShowStats(true), 800);
    }
  }, [userGrid, allClues, solved, recordGame]);


  // Reveal current word
  const handleRevealWord = () => {
    if (!selectedClue) return;
    const cells = getCellsForClue(selectedClue);
    const newRevealed = new Set(revealedCells);
    const newCorrect = new Set(confirmedCorrect);
    const newGrid = { ...userGrid };
    cells.forEach((key, i) => {
      const correctLetter = selectedClue.answer[i];
      if (userGrid[key] === correctLetter) {
        // User already had the right letter — mark as confirmed correct
        newCorrect.add(key);
      } else {
        // Wrong or empty — fill it in and mark as revealed
        newGrid[key] = correctLetter;
        newRevealed.add(key);
      }
    });
    setUserGrid(newGrid);
    setRevealedCells(newRevealed);
    setConfirmedCorrect(newCorrect);
  };

  // Select clue from list
  const handleClueClick = (clue: CrosswordClue) => {
    const cells = getCellsForClue(clue);
    setSelectedClue(clue);
    setDirection(clue.direction);
    setSelectedCell(cells[0]);
    setTimeout(() => inputRefs.current[cells[0]]?.focus(), 0);
  };

  // Share result
  const getShareText = useCallback(() => {
    const revealedCount = revealedCells.size;
    const hintsUsed = revealedCount > 0 ? ` (${revealedCount} revealed)` : "";
    return `📰 News Crossword — ${puzzle.title}\nSolved!${hintsUsed}\ngamesite.app/daily/crossword`;
  }, [allClues, revealedCells, puzzle.title]);

  const handleShare = useCallback(async () => {
    const text = getShareText();
    const ok = await shareOrCopy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getShareText]);

  // ---------------------------------------------------------------------------
  // Pinch-zoom & pan (mobile)
  // ---------------------------------------------------------------------------

  const applyTransform = useCallback(() => {
    const el = gridInnerRef.current;
    if (!el) return;
    const { scale, tx, ty } = transformRef.current;
    el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }, []);

  const clampAndApply = useCallback(() => {
    const t = transformRef.current;
    const g = gestureRef.current;
    const minS = g.initialScale;
    t.scale = Math.max(minS, Math.min(2.5, t.scale));
    const sw = g.gridW * t.scale;
    const sh = g.gridH * t.scale;
    const ch = g.gridH * g.initialScale;
    if (sw <= g.containerW) {
      t.tx = (g.containerW - sw) / 2;
    } else {
      t.tx = Math.min(0, Math.max(g.containerW - sw, t.tx));
    }
    if (sh <= ch) {
      t.ty = (ch - sh) / 2;
    } else {
      t.ty = Math.min(0, Math.max(ch - sh, t.ty));
    }
    setIsZoomed(t.scale > g.initialScale * 1.05);
    applyTransform();
  }, [applyTransform]);

  // Measure grid and compute initial scale to fit container width
  useEffect(() => {
    const container = gridContainerRef.current;
    const inner = gridInnerRef.current;
    if (!container || !inner) return;
    const measure = () => {
      const gw = inner.offsetWidth;
      const gh = inner.offsetHeight;
      const cw = container.clientWidth;
      const fit = cw < gw ? cw / gw : 1;
      const g = gestureRef.current;
      g.initialScale = fit;
      g.gridW = gw;
      g.gridH = gh;
      g.containerW = cw;
      transformRef.current = { scale: fit, tx: (cw - gw * fit) / 2, ty: 0 };
      setContainerHeight(gh * fit);
      setIsZoomed(false);
      setGridReady(true);
      applyTransform();
    };
    requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [cols, rows, applyTransform]);

  const touchDist = (a: Touch, b: Touch) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const handleGridTouchStart = useCallback((e: React.TouchEvent) => {
    const g = gestureRef.current;
    const t = transformRef.current;
    if (e.touches.length === 2) {
      e.preventDefault();
      g.pinching = true;
      g.panning = false;
      g.pinchDist0 = touchDist(e.touches[0], e.touches[1]);
      g.pinchScale0 = t.scale;
      g.pinchTx0 = t.tx;
      g.pinchTy0 = t.ty;
      const rect = gridContainerRef.current!.getBoundingClientRect();
      g.pinchMidX0 = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      g.pinchMidY0 = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
    } else if (e.touches.length === 1) {
      g.panX0 = e.touches[0].clientX;
      g.panY0 = e.touches[0].clientY;
      g.panTx0 = t.tx;
      g.panTy0 = t.ty;
      g.panning = false;
    }
  }, []);

  const handleGridTouchMove = useCallback((e: React.TouchEvent) => {
    const g = gestureRef.current;
    const t = transformRef.current;
    if (e.touches.length === 2 && g.pinching) {
      e.preventDefault();
      const d = touchDist(e.touches[0], e.touches[1]);
      const newScale = g.pinchScale0 * (d / g.pinchDist0);
      const rect = gridContainerRef.current!.getBoundingClientRect();
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      // Zoom towards the point under the initial pinch midpoint
      const gx = (g.pinchMidX0 - g.pinchTx0) / g.pinchScale0;
      const gy = (g.pinchMidY0 - g.pinchTy0) / g.pinchScale0;
      t.scale = newScale;
      t.tx = mx - gx * newScale;
      t.ty = my - gy * newScale;
      clampAndApply();
    } else if (e.touches.length === 1 && !g.pinching) {
      // Only allow single-finger pan when zoomed in
      if (t.scale <= g.initialScale * 1.05) return;
      const dx = e.touches[0].clientX - g.panX0;
      const dy = e.touches[0].clientY - g.panY0;
      if (!g.panning && Math.hypot(dx, dy) > 8) {
        g.panning = true;
      }
      if (g.panning) {
        e.preventDefault();
        t.tx = g.panTx0 + dx;
        t.ty = g.panTy0 + dy;
        clampAndApply();
      }
    }
  }, [clampAndApply]);

  const handleGridTouchEnd = useCallback((e: React.TouchEvent) => {
    const g = gestureRef.current;
    if (e.touches.length < 2 && g.pinching) {
      g.pinching = false;
      g.suppressUntil = Date.now() + 300;
      if (e.touches.length === 1) {
        g.panX0 = e.touches[0].clientX;
        g.panY0 = e.touches[0].clientY;
        g.panTx0 = transformRef.current.tx;
        g.panTy0 = transformRef.current.ty;
      }
    }
    if (e.touches.length === 0) {
      if (g.panning) {
        g.suppressUntil = Date.now() + 300;
      }
      g.panning = false;
      clampAndApply();
    }
  }, [clampAndApply]);

  // Cell size
  const cellSize = 36;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
          {puzzle.title}
        </h1>
        <p className="text-text-muted text-sm mt-1">{puzzle.subtitle}</p>
        <StatsButton onClick={() => setShowStats(true)} />
      </div>

      {solved && (
        <div className="mb-6 bg-green/10 border border-green/30 rounded-xl p-4 text-center animate-[pop-in_0.3s_ease]">
          <p className="text-green font-bold text-lg">Puzzle Complete!</p>
          <p className="text-text-muted text-sm mt-1">
            Great job solving today&apos;s news crossword!
          </p>
          <button
            onClick={handleShare}
            className="mt-3 px-5 py-2 text-sm font-semibold rounded-full bg-green/20 text-green hover:bg-green/30 transition-colors"
          >
            {copied ? "Copied!" : "Share Results"}
          </button>
          <XShareButton getText={getShareText} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Grid */}
        <div className="flex-shrink-0">
          <div
            ref={gridContainerRef}
            className="relative overflow-hidden"
            style={{
              height: containerHeight,
              touchAction: isZoomed ? "none" : "pan-y",
            }}
            onTouchStart={handleGridTouchStart}
            onTouchMove={handleGridTouchMove}
            onTouchEnd={handleGridTouchEnd}
          >
            <div
              ref={gridInnerRef}
              className="inline-block"
              style={{ transformOrigin: "0 0", visibility: gridReady ? "visible" : "hidden" }}
            >
              <div
                className="inline-grid border-2 border-text-primary bg-text-primary gap-px"
                style={{
                  gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                  gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                }}
              >
            {grid.flat().map((cell) => {
              const key = `${cell.row},${cell.col}`;
              const isSelected = selectedCell === key;
              const isHighlighted = highlightedCells.has(key);
              const isRevealed = revealedCells.has(key);
              const isCorrect = confirmedCorrect.has(key);
              const isWrong = checkedWrong.has(key);

              if (cell.isBlack) {
                return (
                  <div
                    key={key}
                    className="bg-text-primary"
                    style={{ width: cellSize, height: cellSize }}
                  />
                );
              }

              return (
                <div
                  key={key}
                  className={`relative cursor-pointer select-none transition-colors duration-100
                    ${isSelected
                      ? "bg-amber"
                      : isHighlighted
                        ? "bg-amber/20"
                        : "bg-white"
                    }
                    ${isWrong ? "bg-error/20" : ""}
                  `}
                  style={{ width: cellSize, height: cellSize }}
                  onClick={() => selectCell(cell.row, cell.col)}
                >
                  {cell.number && (
                    <span className="absolute top-0.5 left-1 text-[9px] font-semibold text-text-secondary leading-none pointer-events-none">
                      {cell.number}
                    </span>
                  )}
                  <input
                    ref={(el) => { inputRefs.current[key] = el; }}
                    type="text"
                    maxLength={1}
                    value={userGrid[key] ?? ""}
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className={`absolute inset-0 w-full h-full text-center font-bold text-base uppercase bg-transparent outline-none caret-transparent cursor-pointer
                      ${isRevealed ? "text-error" : isCorrect ? "text-green" : "text-text-primary"}
                    `}
                    style={{ paddingTop: cell.number ? 6 : 0, fontSize: 16 }}
                    onKeyDown={(e) => handleKeyDown(e, cell.row, cell.col)}
                    onBeforeInput={(e) => handleBeforeInput(e, cell.row, cell.col)}
                    onChange={() => {}}
                    onFocus={() => {
                      if (selectedCell !== key) selectCell(cell.row, cell.col);
                    }}
                    tabIndex={-1}
                    aria-label={`Row ${cell.row + 1}, Column ${cell.col + 1}${cell.number ? `, number ${cell.number}` : ""}`}
                  />
                </div>
              );
            })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={() => selectedCell && handleCheckWord(selectedCell)}
              className="px-4 py-2 text-xs font-semibold rounded-full bg-sky/10 text-sky hover:bg-sky/20 transition-colors"
            >
              Check
            </button>
            <button
              onClick={handleRevealWord}
              disabled={!selectedClue}
              className="px-4 py-2 text-xs font-semibold rounded-full bg-purple/10 text-purple hover:bg-purple/20 transition-colors disabled:opacity-40"
            >
              Reveal Word
            </button>
          </div>
        </div>

        {/* Clues */}
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-text-primary mb-2 text-sm uppercase tracking-wider">
              Across
            </h3>
            <ul className="space-y-1.5">
              {clues.across.map((clue) => (
                <li
                  key={`a-${clue.number}`}
                  onClick={() => handleClueClick(clue)}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors
                    ${selectedClue?.number === clue.number && selectedClue?.direction === "across"
                      ? "bg-amber/20 text-text-primary font-semibold"
                      : "text-text-secondary hover:bg-surface"
                    }`}
                >
                  <span className="font-bold mr-1.5">{clue.number}.</span>
                  {clue.clue}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-text-primary mb-2 text-sm uppercase tracking-wider">
              Down
            </h3>
            <ul className="space-y-1.5">
              {clues.down.map((clue) => (
                <li
                  key={`d-${clue.number}`}
                  onClick={() => handleClueClick(clue)}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors
                    ${selectedClue?.number === clue.number && selectedClue?.direction === "down"
                      ? "bg-amber/20 text-text-primary font-semibold"
                      : "text-text-secondary hover:bg-surface"
                    }`}
                >
                  <span className="font-bold mr-1.5">{clue.number}.</span>
                  {clue.clue}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <StatsModal
        open={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
        gameName="News Crossword"
        color="amber"
      />
    </div>
  );
}
