export interface VocabWord {
  word: string;
  definition: string;
  example: string;
}

export interface VocabVaultPuzzle {
  id: string;
  puzzle_date: string;
  words: VocabWord[];
}
