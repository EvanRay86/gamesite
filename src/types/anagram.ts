export interface AnagramWord {
  word: string;      // the answer (uppercase)
  scrambled: string; // pre-scrambled letters
  hint: string;      // category or clue hint
}

export interface AnagramPuzzle {
  id: string;
  puzzle_date: string;
  words: AnagramWord[];
}
