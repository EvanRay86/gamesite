export interface TimelineEvent {
  description: string;
  year: number;
}

export interface TimelinePuzzle {
  id: string;
  puzzle_date: string;
  events: TimelineEvent[];
}
