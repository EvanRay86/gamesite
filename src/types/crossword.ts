export interface CrosswordClue {
  number: number;
  clue: string;
  answer: string;
  direction: "across" | "down";
  row: number;
  col: number;
}

export interface CrosswordCell {
  letter: string;
  number?: number;
  isBlack: boolean;
  row: number;
  col: number;
}

export interface CrosswordPuzzle {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  grid: CrosswordCell[][];
  clues: {
    across: CrosswordClue[];
    down: CrosswordClue[];
  };
  rows: number;
  cols: number;
}
