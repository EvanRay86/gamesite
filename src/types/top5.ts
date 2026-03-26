export interface Top5Item {
  name: string;
  value: number | string;
}

export interface Top5Puzzle {
  id: string;
  puzzle_date: string;
  category: string;
  items: Top5Item[];
  unit?: string;
}
