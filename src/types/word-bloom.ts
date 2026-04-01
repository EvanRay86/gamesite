export interface WordBloomPuzzle {
  id: string;
  puzzle_date: string;
  /** 7 letters — index 0 is the required center letter. All uppercase. */
  letters: string[];
}
