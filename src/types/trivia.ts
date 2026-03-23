export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
}

export interface TriviaPuzzle {
  id: string;
  puzzle_date: string;
  questions: TriviaQuestion[];
}
