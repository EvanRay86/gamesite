// WARP — 30 Hand-Crafted Levels
// Coordinate space: 800×600. Gravity bodies, target, and launch point per level.

import type { LevelDef } from "@/types/warp";

const W = 800, H = 600;
const bounds = { w: W, h: H };

// Helper to reduce repetition
const planet = (x: number, y: number, mass: number, radius: number, color: string) =>
  ({ pos: { x, y }, mass, radius, type: "planet" as const, color });
const star = (x: number, y: number, mass: number, radius: number) =>
  ({ pos: { x, y }, mass, radius, type: "star" as const, color: "#FFF5CC" });
const blackhole = (x: number, y: number, mass: number, radius: number) =>
  ({ pos: { x, y }, mass, radius, type: "blackhole" as const, color: "#6B21A8" });

export const levels: LevelDef[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 1 — ORBIT (Levels 1–10): Tutorial, 1–2 bodies
  // ═══════════════════════════════════════════════════════════════════════════

  { // L1: Gentle Curve — one planet bends your shot slightly
    id: 1, name: "Gentle Curve", tier: "orbit", par: 1, bounds,
    launch: { pos: { x: 100, y: 300 } },
    target: { pos: { x: 700, y: 300 }, radius: 24 },
    bodies: [planet(400, 200, 120, 22, "#4ECDC4")],
  },
  { // L2: Hook Shot — planet is offset, must curve around it
    id: 2, name: "Hook Shot", tier: "orbit", par: 1, bounds,
    launch: { pos: { x: 100, y: 500 } },
    target: { pos: { x: 700, y: 150 }, radius: 22 },
    bodies: [planet(420, 350, 150, 24, "#FF6B6B")],
  },
  { // L3: The Gate — thread between two planets
    id: 3, name: "The Gate", tier: "orbit", par: 1, bounds,
    launch: { pos: { x: 100, y: 300 } },
    target: { pos: { x: 700, y: 300 }, radius: 22 },
    bodies: [
      planet(400, 180, 100, 20, "#45B7D1"),
      planet(400, 420, 100, 20, "#F7B731"),
    ],
  },
  { // L4: Heavy Star — one massive star creates a dramatic curve
    id: 4, name: "Heavy Star", tier: "orbit", par: 2, bounds,
    launch: { pos: { x: 100, y: 150 } },
    target: { pos: { x: 100, y: 500 }, radius: 22 },
    bodies: [star(400, 300, 400, 32)],
  },
  { // L5: Slingshot — shoot away, gravity pulls you back around
    id: 5, name: "Slingshot", tier: "orbit", par: 2, bounds,
    launch: { pos: { x: 300, y: 100 } },
    target: { pos: { x: 200, y: 500 }, radius: 22 },
    bodies: [planet(500, 300, 200, 26, "#A855F7")],
  },
  { // L6: Narrow Pass — two planets form a tight corridor
    id: 6, name: "Narrow Pass", tier: "orbit", par: 2, bounds,
    launch: { pos: { x: 80, y: 300 } },
    target: { pos: { x: 720, y: 300 }, radius: 20 },
    bodies: [
      planet(350, 230, 130, 22, "#22C55E"),
      planet(450, 370, 130, 22, "#FF6B6B"),
    ],
  },
  { // L7: Triangle — three planets, multiple possible paths
    id: 7, name: "Triangle", tier: "orbit", par: 2, bounds,
    launch: { pos: { x: 80, y: 550 } },
    target: { pos: { x: 720, y: 80 }, radius: 22 },
    bodies: [
      planet(300, 200, 100, 20, "#4ECDC4"),
      planet(500, 400, 100, 20, "#F7B731"),
      planet(400, 100, 80, 18, "#FF6B6B"),
    ],
  },
  { // L8: Mass Difference — planet vs star, asymmetric curves
    id: 8, name: "Mass Difference", tier: "orbit", par: 2, bounds,
    launch: { pos: { x: 100, y: 100 } },
    target: { pos: { x: 700, y: 500 }, radius: 22 },
    bodies: [
      planet(300, 400, 80, 18, "#45B7D1"),
      star(550, 200, 350, 28),
    ],
  },
  { // L9: Wall — bodies form a barrier, find the gap
    id: 9, name: "The Wall", tier: "orbit", par: 3, bounds,
    launch: { pos: { x: 80, y: 300 } },
    target: { pos: { x: 720, y: 300 }, radius: 20 },
    bodies: [
      planet(400, 100, 90, 18, "#A855F7"),
      planet(400, 260, 90, 18, "#22C55E"),
      planet(400, 420, 90, 18, "#F7B731"),
      planet(400, 560, 90, 18, "#FF6B6B"),
    ],
  },
  { // L10: Figure Eight — loop around both planets
    id: 10, name: "Figure Eight", tier: "orbit", par: 3, bounds,
    launch: { pos: { x: 100, y: 300 } },
    target: { pos: { x: 700, y: 300 }, radius: 20 },
    bodies: [
      planet(300, 300, 180, 24, "#4ECDC4"),
      planet(550, 300, 180, 24, "#FF6B6B"),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 2 — NEBULA (Levels 11–20): Black holes, 3–5 bodies
  // ═══════════════════════════════════════════════════════════════════════════

  { // L11: Event Horizon — first black hole, skim past carefully
    id: 11, name: "Event Horizon", tier: "nebula", par: 2, bounds,
    launch: { pos: { x: 100, y: 500 } },
    target: { pos: { x: 700, y: 100 }, radius: 22 },
    bodies: [blackhole(400, 300, 900, 28)],
  },
  { // L12: Redirect — black hole sling into planet redirect
    id: 12, name: "Redirect", tier: "nebula", par: 2, bounds,
    launch: { pos: { x: 80, y: 100 } },
    target: { pos: { x: 80, y: 500 }, radius: 22 },
    bodies: [
      blackhole(400, 200, 800, 26),
      planet(600, 450, 150, 22, "#F7B731"),
    ],
  },
  { // L13: Slalom — weave through three bodies in a line
    id: 13, name: "Slalom", tier: "nebula", par: 3, bounds,
    launch: { pos: { x: 80, y: 550 } },
    target: { pos: { x: 720, y: 80 }, radius: 20 },
    bodies: [
      planet(250, 400, 120, 20, "#22C55E"),
      blackhole(430, 280, 700, 24),
      planet(600, 160, 120, 20, "#45B7D1"),
    ],
  },
  { // L14: Binary — two black holes create intense warping
    id: 14, name: "Binary", tier: "nebula", par: 3, bounds,
    launch: { pos: { x: 100, y: 300 } },
    target: { pos: { x: 700, y: 300 }, radius: 20 },
    bodies: [
      blackhole(350, 200, 700, 24),
      blackhole(450, 400, 700, 24),
    ],
  },
  { // L15: Orbit Trap — target near a star, approach at correct angle
    id: 15, name: "Orbit Trap", tier: "nebula", par: 3, bounds,
    launch: { pos: { x: 80, y: 100 } },
    target: { pos: { x: 520, y: 320 }, radius: 18 },
    bodies: [
      star(500, 300, 450, 34),
      planet(200, 400, 100, 18, "#A855F7"),
    ],
  },
  { // L16: Diamond — four planets in a diamond
    id: 16, name: "Diamond", tier: "nebula", par: 2, bounds,
    launch: { pos: { x: 80, y: 300 } },
    target: { pos: { x: 720, y: 300 }, radius: 20 },
    bodies: [
      planet(300, 150, 110, 20, "#FF6B6B"),
      planet(500, 150, 110, 20, "#4ECDC4"),
      planet(300, 450, 110, 20, "#F7B731"),
      planet(500, 450, 110, 20, "#22C55E"),
    ],
  },
  { // L17: Singularity Ring — black hole at center, planets around it
    id: 17, name: "Singularity Ring", tier: "nebula", par: 3, bounds,
    launch: { pos: { x: 80, y: 300 } },
    target: { pos: { x: 720, y: 300 }, radius: 18 },
    bodies: [
      blackhole(400, 300, 1000, 28),
      planet(400, 120, 80, 16, "#45B7D1"),
      planet(400, 480, 80, 16, "#FF6B6B"),
      planet(250, 300, 80, 16, "#F7B731"),
    ],
  },
  { // L18: U-Turn — launch and target same side, must loop everything
    id: 18, name: "U-Turn", tier: "nebula", par: 4, bounds,
    launch: { pos: { x: 100, y: 150 } },
    target: { pos: { x: 100, y: 450 }, radius: 20 },
    bodies: [
      star(450, 300, 500, 34),
      planet(650, 150, 100, 18, "#22C55E"),
      planet(650, 450, 100, 18, "#A855F7"),
    ],
  },
  { // L19: Dense Field — 5 bodies, precision threading
    id: 19, name: "Dense Field", tier: "nebula", par: 3, bounds,
    launch: { pos: { x: 80, y: 100 } },
    target: { pos: { x: 720, y: 500 }, radius: 18 },
    bodies: [
      planet(250, 200, 100, 18, "#4ECDC4"),
      planet(400, 350, 120, 20, "#FF6B6B"),
      blackhole(550, 180, 600, 22),
      planet(350, 500, 90, 16, "#F7B731"),
      planet(600, 420, 100, 18, "#22C55E"),
    ],
  },
  { // L20: Gravity Maze — bodies form channels of gravity
    id: 20, name: "Gravity Maze", tier: "nebula", par: 4, bounds,
    launch: { pos: { x: 80, y: 550 } },
    target: { pos: { x: 720, y: 80 }, radius: 18 },
    bodies: [
      planet(200, 350, 120, 20, "#45B7D1"),
      blackhole(380, 200, 700, 24),
      planet(550, 400, 130, 22, "#A855F7"),
      planet(300, 500, 90, 16, "#F7B731"),
      planet(650, 200, 100, 18, "#FF6B6B"),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 3 — VOID (Levels 21–30): Expert, 5–8 bodies, multiple black holes
  // ═══════════════════════════════════════════════════════════════════════════

  { // L21: Inward Spiral — 6 bodies, target at center
    id: 21, name: "Inward Spiral", tier: "void", par: 3, bounds,
    launch: { pos: { x: 80, y: 80 } },
    target: { pos: { x: 400, y: 300 }, radius: 16 },
    bodies: [
      planet(200, 150, 100, 18, "#4ECDC4"),
      planet(600, 150, 110, 18, "#FF6B6B"),
      blackhole(250, 400, 600, 22),
      planet(550, 400, 120, 20, "#F7B731"),
      planet(400, 100, 80, 16, "#22C55E"),
      planet(400, 500, 90, 16, "#A855F7"),
    ],
  },
  { // L22: Binary Chaos — two black holes close together
    id: 22, name: "Binary Chaos", tier: "void", par: 4, bounds,
    launch: { pos: { x: 80, y: 300 } },
    target: { pos: { x: 720, y: 300 }, radius: 16 },
    bodies: [
      blackhole(350, 260, 800, 24),
      blackhole(450, 340, 800, 24),
      planet(200, 150, 80, 16, "#45B7D1"),
      planet(600, 450, 80, 16, "#22C55E"),
      planet(200, 450, 70, 14, "#F7B731"),
      planet(600, 150, 70, 14, "#FF6B6B"),
    ],
  },
  { // L23: Pinball — bodies arranged for bouncing between gravity wells
    id: 23, name: "Pinball", tier: "void", par: 4, bounds,
    launch: { pos: { x: 80, y: 100 } },
    target: { pos: { x: 720, y: 500 }, radius: 16 },
    bodies: [
      planet(250, 200, 130, 20, "#FF6B6B"),
      planet(400, 400, 140, 22, "#4ECDC4"),
      planet(550, 200, 130, 20, "#A855F7"),
      blackhole(300, 500, 600, 22),
      planet(650, 350, 110, 18, "#F7B731"),
    ],
  },
  { // L24: Long Range — scattered bodies, very distant target
    id: 24, name: "Long Range", tier: "void", par: 3, bounds,
    launch: { pos: { x: 50, y: 550 } },
    target: { pos: { x: 750, y: 50 }, radius: 16 },
    bodies: [
      planet(180, 400, 100, 18, "#22C55E"),
      star(400, 300, 350, 28),
      planet(600, 200, 90, 16, "#45B7D1"),
      blackhole(250, 150, 500, 20),
      planet(550, 450, 80, 16, "#FF6B6B"),
    ],
  },
  { // L25: Black Hole Gauntlet — five black holes
    id: 25, name: "Black Hole Gauntlet", tier: "void", par: 5, bounds,
    launch: { pos: { x: 80, y: 300 } },
    target: { pos: { x: 720, y: 300 }, radius: 16 },
    bodies: [
      blackhole(220, 180, 500, 20),
      blackhole(380, 400, 600, 22),
      blackhole(500, 180, 500, 20),
      blackhole(320, 300, 400, 18),
      blackhole(600, 350, 550, 22),
    ],
  },
  { // L26: Spiral Arms — bodies form a spiral pattern
    id: 26, name: "Spiral Arms", tier: "void", par: 4, bounds,
    launch: { pos: { x: 80, y: 550 } },
    target: { pos: { x: 400, y: 280 }, radius: 16 },
    bodies: [
      planet(200, 450, 110, 18, "#4ECDC4"),
      planet(300, 350, 120, 20, "#FF6B6B"),
      blackhole(400, 450, 700, 24),
      planet(500, 200, 100, 18, "#F7B731"),
      planet(600, 350, 110, 18, "#22C55E"),
      planet(350, 150, 90, 16, "#A855F7"),
    ],
  },
  { // L27: Mirror Trick — symmetric but target is off-center
    id: 27, name: "Mirror Trick", tier: "void", par: 3, bounds,
    launch: { pos: { x: 400, y: 560 } },
    target: { pos: { x: 550, y: 80 }, radius: 16 },
    bodies: [
      planet(200, 300, 120, 20, "#45B7D1"),
      planet(600, 300, 120, 20, "#45B7D1"),
      star(400, 200, 400, 30),
      planet(300, 100, 80, 16, "#F7B731"),
      planet(500, 100, 80, 16, "#F7B731"),
    ],
  },
  { // L28: Maximum Density — 7 bodies packed tight
    id: 28, name: "Maximum Density", tier: "void", par: 5, bounds,
    launch: { pos: { x: 50, y: 300 } },
    target: { pos: { x: 750, y: 300 }, radius: 16 },
    bodies: [
      planet(180, 200, 90, 16, "#FF6B6B"),
      planet(180, 400, 90, 16, "#4ECDC4"),
      blackhole(350, 300, 700, 22),
      planet(450, 150, 80, 16, "#F7B731"),
      planet(450, 450, 80, 16, "#22C55E"),
      blackhole(580, 250, 600, 20),
      planet(620, 420, 100, 18, "#A855F7"),
    ],
  },
  { // L29: Orbital Insertion — massive black hole, target on far side
    id: 29, name: "Orbital Insertion", tier: "void", par: 4, bounds,
    launch: { pos: { x: 100, y: 300 } },
    target: { pos: { x: 550, y: 300 }, radius: 16 },
    bodies: [
      blackhole(400, 300, 1500, 32),
      planet(200, 120, 70, 14, "#45B7D1"),
      planet(600, 120, 70, 14, "#FF6B6B"),
      planet(600, 480, 70, 14, "#22C55E"),
      planet(200, 480, 70, 14, "#F7B731"),
    ],
  },
  { // L30: The Void — 8 bodies including 3 black holes, final boss
    id: 30, name: "The Void", tier: "void", par: 5, bounds,
    launch: { pos: { x: 50, y: 550 } },
    target: { pos: { x: 750, y: 50 }, radius: 14 },
    bodies: [
      blackhole(250, 200, 800, 24),
      blackhole(550, 400, 800, 24),
      blackhole(400, 100, 600, 20),
      star(400, 500, 400, 28),
      planet(150, 400, 100, 18, "#4ECDC4"),
      planet(650, 200, 100, 18, "#FF6B6B"),
      planet(300, 350, 80, 14, "#F7B731"),
      planet(500, 250, 80, 14, "#22C55E"),
    ],
  },
];

export function getLevelsByTier(tier: "orbit" | "nebula" | "void"): LevelDef[] {
  return levels.filter((l) => l.tier === tier);
}
