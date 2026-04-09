export interface Element {
  name: string;
  symbol: string;
  atomicNumber: number;
  period: number;
  group: number;
  category: string;
  state: "solid" | "liquid" | "gas";
  discoveryEra: string;
  commonUse: string;
}

export interface PeriodicPuzzle {
  id: string;
  puzzle_date: string;
  element: Element;
}
