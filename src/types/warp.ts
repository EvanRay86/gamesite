// WARP — Gravitational Slingshot Puzzle: Type Definitions

export interface Vec2 {
  x: number;
  y: number;
}

export type BodyType = "planet" | "star" | "blackhole";

export interface GravBody {
  pos: Vec2;
  mass: number;
  radius: number;
  type: BodyType;
  color: string;
}

export interface Projectile {
  pos: Vec2;
  vel: Vec2;
  accPrev: Vec2;
  alive: boolean;
  trail: Vec2[];
}

export interface Target {
  pos: Vec2;
  radius: number;
}

export interface LaunchPoint {
  pos: Vec2;
}

export type Tier = "orbit" | "nebula" | "void";

export interface LevelDef {
  id: number;
  name: string;
  tier: Tier;
  bodies: GravBody[];
  target: Target;
  launch: LaunchPoint;
  par: number;
  bounds: { w: number; h: number };
}

export type GamePhase =
  | "menu"
  | "aiming"
  | "flying"
  | "success"
  | "fail"
  | "levelSelect";

export interface LevelResult {
  shots: number;
  stars: number;
  score: number;
}

export interface SaveData {
  results: Record<number, LevelResult>;
}

export interface Particle {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface AimState {
  dragging: boolean;
  start: Vec2;
  end: Vec2;
  power: number;
  angle: number;
}
