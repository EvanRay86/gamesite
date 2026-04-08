export type HintLevel = "mild" | "medium" | "strong";

export interface Hint {
  text: string;
  level: HintLevel;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface HintSet {
  gameName: string;
  gameSlug: string;
  date: string;
  hints: Hint[];
  faqs: FAQ[];
}
