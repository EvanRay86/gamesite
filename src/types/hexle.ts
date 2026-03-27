export type LetterStatus = "correct" | "present" | "absent" | "empty";

export interface HexleGuess {
  letters: string[];
  statuses: LetterStatus[];
}
