export interface Group {
  category: string;
  color: string;
  words: string[];
  difficulty: number;
}

export interface Puzzle {
  id: string;
  puzzle_date: string; // YYYY-MM-DD
  groups: Group[];
}

export interface GuessEntry {
  colors: string[];
  correct: boolean;
  oneAway?: boolean;
}
