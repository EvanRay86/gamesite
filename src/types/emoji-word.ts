export interface EmojiWordRound {
  emojis: string;       // emoji clue (e.g. "🌊🏄‍♂️" )
  answer: string;       // correct word/phrase (uppercase)
  hint?: string;        // optional extra hint shown after a wrong guess
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = easiest, 5 = hardest
}

export interface EmojiWordPuzzle {
  id: string;
  puzzle_date: string;
  rounds: EmojiWordRound[];
}
