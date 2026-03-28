// PixelVille — Procedural pixel-art sprite drawing functions
// Each sprite is a function that draws directly to canvas at the given position.
// This allows zero external asset dependencies for MVP.

const TILE = 32;
const HALF = 16;

// ---------------------------------------------------------------------------
// Color palettes
// ---------------------------------------------------------------------------

export const SKIN_TONES = [
  "#FFDBB4", "#E8B88A", "#C68642", "#8D5524", "#613318", "#4A2511",
];

export const HAIR_COLORS = [
  "#2C1B0E", "#5A3825", "#8B6F47", "#D4A853", "#C13B2A", "#E85D9A", "#4A90D9", "#EEEEEE",
];

export const SHIRT_COLORS = [
  "#E74C3C", "#3498DB", "#2ECC71", "#F1C40F", "#9B59B6",
  "#E67E22", "#1ABC9C", "#ECF0F1", "#2C3E50", "#FF69B4",
];

export const PANTS_COLORS = [
  "#2C3E50", "#34495E", "#1A237E", "#4A148C", "#1B5E20",
  "#795548", "#455A64", "#BF360C", "#F5F5DC", "#2196F3",
];

export const SHOE_COLORS = [
  "#2C1B0E", "#5D4037", "#37474F", "#B71C1C", "#1565C0", "#F5F5F5",
];

// ---------------------------------------------------------------------------
// Tile drawing functions
// ---------------------------------------------------------------------------

export function drawGrassTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(x, y, TILE, TILE);
  // Texture variation
  ctx.fillStyle = "#43A047";
  const seed = (x * 7 + y * 13) % 17;
  ctx.fillRect(x + (seed % 5) * 6, y + (seed % 4) * 7, 3, 3);
  ctx.fillRect(x + ((seed + 3) % 6) * 5, y + ((seed + 7) % 5) * 6, 2, 2);
  ctx.fillStyle = "#66BB6A";
  ctx.fillRect(x + ((seed + 5) % 7) * 4, y + ((seed + 2) % 6) * 5, 2, 3);
}

export function drawDirtTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#8D6E4C";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#7D5E3C";
  const seed = (x * 11 + y * 7) % 13;
  ctx.fillRect(x + (seed % 6) * 5, y + (seed % 5) * 6, 3, 2);
  ctx.fillRect(x + ((seed + 4) % 7) * 4, y + ((seed + 6) % 5) * 6, 2, 2);
  ctx.fillStyle = "#9D7E5C";
  ctx.fillRect(x + ((seed + 2) % 5) * 6, y + ((seed + 3) % 4) * 7, 2, 3);
}

export function drawStoneTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#9E9E9E";
  ctx.fillRect(x, y, TILE, TILE);
  // Grid lines
  ctx.strokeStyle = "#BDBDBD";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  // Variation
  ctx.fillStyle = "#BDBDBD";
  const seed = (x * 3 + y * 19) % 11;
  ctx.fillRect(x + (seed % 4) * 7 + 2, y + (seed % 3) * 9 + 2, 4, 3);
}

export function drawWaterTile(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  ctx.fillStyle = "#2196F3";
  ctx.fillRect(x, y, TILE, TILE);
  // Animated shimmer
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  const offset = Math.sin((frame * 0.05) + x * 0.1 + y * 0.1) * 4;
  ctx.fillRect(x + 4 + offset, y + 8, 12, 2);
  ctx.fillRect(x + 10 - offset, y + 18, 10, 2);
}

export function drawWoodTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#A1887F";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = "#8D6E63";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  // Wood grain
  ctx.strokeStyle = "#795548";
  ctx.beginPath();
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 4, y + TILE);
  ctx.moveTo(x + 18, y);
  ctx.lineTo(x + 18, y + TILE);
  ctx.stroke();
}

export function drawSandTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#F9E4B7";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#EDD9A3";
  const seed = (x * 5 + y * 11) % 9;
  ctx.fillRect(x + (seed % 5) * 6, y + (seed % 4) * 7, 3, 2);
}

export function drawWallTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#616161";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#757575";
  ctx.fillRect(x + 1, y + 1, TILE - 2, HALF - 1);
  ctx.fillStyle = "#424242";
  ctx.fillRect(x, y + TILE - 2, TILE, 2);
}

// Tile type → draw function map
const TILE_DRAWERS: Record<string, (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) => void> = {
  grass: (ctx, x, y) => drawGrassTile(ctx, x, y),
  dirt: (ctx, x, y) => drawDirtTile(ctx, x, y),
  stone: (ctx, x, y) => drawStoneTile(ctx, x, y),
  water: (ctx, x, y, f) => drawWaterTile(ctx, x, y, f),
  wood: (ctx, x, y) => drawWoodTile(ctx, x, y),
  sand: (ctx, x, y) => drawSandTile(ctx, x, y),
  wall: (ctx, x, y) => drawWallTile(ctx, x, y),
};

export function drawTile(
  ctx: CanvasRenderingContext2D,
  tileType: string,
  x: number,
  y: number,
  frame: number,
) {
  const draw = TILE_DRAWERS[tileType] ?? TILE_DRAWERS.grass;
  draw(ctx, x, y, frame);
}

// ---------------------------------------------------------------------------
// Furniture drawing functions
// ---------------------------------------------------------------------------

export function drawFurniture(
  ctx: CanvasRenderingContext2D,
  spriteKey: string,
  x: number,
  y: number,
) {
  const draw = FURNITURE_DRAWERS[spriteKey];
  if (draw) draw(ctx, x, y);
  else drawGenericItem(ctx, x, y, spriteKey);
}

function drawGenericItem(ctx: CanvasRenderingContext2D, x: number, y: number, _key: string) {
  ctx.fillStyle = "#AB47BC";
  ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
  ctx.strokeStyle = "#7B1FA2";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
}

const FURNITURE_DRAWERS: Record<string, (ctx: CanvasRenderingContext2D, x: number, y: number) => void> = {
  furn_table(ctx, x, y) {
    // Table top
    ctx.fillStyle = "#8D6E63";
    ctx.fillRect(x + 2, y + 8, 28, 16);
    ctx.fillStyle = "#6D4C41";
    // Legs
    ctx.fillRect(x + 4, y + 24, 4, 6);
    ctx.fillRect(x + 24, y + 24, 4, 6);
    // Wood grain highlight
    ctx.fillStyle = "#A1887F";
    ctx.fillRect(x + 6, y + 12, 20, 2);
  },

  furn_chair(ctx, x, y) {
    ctx.fillStyle = "#8D6E63";
    // Seat
    ctx.fillRect(x + 6, y + 16, 20, 8);
    // Back
    ctx.fillRect(x + 6, y + 4, 20, 4);
    // Legs
    ctx.fillStyle = "#6D4C41";
    ctx.fillRect(x + 6, y + 24, 3, 6);
    ctx.fillRect(x + 23, y + 24, 3, 6);
    // Back supports
    ctx.fillRect(x + 6, y + 4, 3, 14);
    ctx.fillRect(x + 23, y + 4, 3, 14);
  },

  furn_rug(ctx, x, y) {
    ctx.fillStyle = "#E57373";
    ctx.fillRect(x + 2, y + 2, 28, 28);
    ctx.strokeStyle = "#C62828";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 4, 24, 24);
    ctx.strokeStyle = "#FFCDD2";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 7, y + 7, 18, 18);
  },

  furn_lamp(ctx, x, y) {
    // Post
    ctx.fillStyle = "#757575";
    ctx.fillRect(x + 14, y + 12, 4, 18);
    // Base
    ctx.fillRect(x + 10, y + 28, 12, 3);
    // Glow
    const g = ctx.createRadialGradient(x + 16, y + 8, 2, x + 16, y + 8, 10);
    g.addColorStop(0, "rgba(255,235,59,0.8)");
    g.addColorStop(1, "rgba(255,235,59,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x + 4, y, 24, 18);
    // Bulb
    ctx.fillStyle = "#FFF9C4";
    ctx.beginPath();
    ctx.arc(x + 16, y + 8, 5, 0, Math.PI * 2);
    ctx.fill();
  },

  furn_bookshelf(ctx, x, y) {
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(x + 2, y + 2, 28, 28);
    // Shelves
    ctx.fillStyle = "#795548";
    ctx.fillRect(x + 2, y + 10, 28, 2);
    ctx.fillRect(x + 2, y + 20, 28, 2);
    // Books
    const colors = ["#E74C3C", "#3498DB", "#2ECC71", "#F1C40F", "#9B59B6"];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(x + 4 + i * 5, y + 3, 4, 7);
      ctx.fillRect(x + 4 + i * 5, y + 13, 4, 7);
    }
  },

  furn_flowerpot(ctx, x, y) {
    // Pot
    ctx.fillStyle = "#D84315";
    ctx.fillRect(x + 10, y + 18, 12, 10);
    ctx.fillRect(x + 8, y + 16, 16, 4);
    // Plant
    ctx.fillStyle = "#4CAF50";
    ctx.beginPath();
    ctx.arc(x + 16, y + 12, 6, 0, Math.PI * 2);
    ctx.fill();
    // Flower
    ctx.fillStyle = "#FF69B4";
    ctx.beginPath();
    ctx.arc(x + 16, y + 10, 3, 0, Math.PI * 2);
    ctx.fill();
  },

  furn_bed(ctx, x, y) {
    // Frame
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(x + 2, y + 8, 28, 22);
    // Mattress
    ctx.fillStyle = "#ECEFF1";
    ctx.fillRect(x + 4, y + 10, 24, 16);
    // Pillow
    ctx.fillStyle = "#FFF9C4";
    ctx.fillRect(x + 6, y + 11, 10, 6);
    // Blanket
    ctx.fillStyle = "#42A5F5";
    ctx.fillRect(x + 4, y + 18, 24, 8);
  },

  furn_fireplace(ctx, x, y) {
    // Stone frame
    ctx.fillStyle = "#757575";
    ctx.fillRect(x + 2, y + 4, 28, 26);
    // Opening
    ctx.fillStyle = "#212121";
    ctx.fillRect(x + 6, y + 12, 20, 18);
    // Fire glow
    const g = ctx.createRadialGradient(x + 16, y + 20, 2, x + 16, y + 20, 10);
    g.addColorStop(0, "rgba(255,152,0,0.9)");
    g.addColorStop(0.5, "rgba(255,87,34,0.5)");
    g.addColorStop(1, "rgba(255,87,34,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x + 6, y + 12, 20, 18);
    // Mantle
    ctx.fillStyle = "#8D6E63";
    ctx.fillRect(x, y + 2, 32, 4);
  },

  furn_fence(ctx, x, y) {
    ctx.fillStyle = "#A1887F";
    // Posts
    ctx.fillRect(x + 2, y + 8, 4, 22);
    ctx.fillRect(x + 26, y + 8, 4, 22);
    // Rails
    ctx.fillRect(x, y + 12, TILE, 3);
    ctx.fillRect(x, y + 22, TILE, 3);
    // Post tops
    ctx.fillStyle = "#8D6E63";
    ctx.fillRect(x + 1, y + 6, 6, 4);
    ctx.fillRect(x + 25, y + 6, 6, 4);
  },

  furn_mailbox(ctx, x, y) {
    // Post
    ctx.fillStyle = "#795548";
    ctx.fillRect(x + 14, y + 14, 4, 16);
    // Box
    ctx.fillStyle = "#1565C0";
    ctx.fillRect(x + 8, y + 6, 16, 10);
    // Door
    ctx.fillStyle = "#0D47A1";
    ctx.fillRect(x + 8, y + 8, 3, 6);
    // Flag
    ctx.fillStyle = "#F44336";
    ctx.fillRect(x + 24, y + 6, 3, 8);
  },

  furn_fountain(ctx, x, y) {
    // Basin
    ctx.fillStyle = "#78909C";
    ctx.beginPath();
    ctx.arc(x + 16, y + 20, 12, 0, Math.PI * 2);
    ctx.fill();
    // Water
    ctx.fillStyle = "#42A5F5";
    ctx.beginPath();
    ctx.arc(x + 16, y + 20, 10, 0, Math.PI * 2);
    ctx.fill();
    // Center pillar
    ctx.fillStyle = "#78909C";
    ctx.fillRect(x + 13, y + 6, 6, 16);
    // Water spray
    ctx.fillStyle = "rgba(144,202,249,0.6)";
    ctx.beginPath();
    ctx.arc(x + 16, y + 6, 4, 0, Math.PI * 2);
    ctx.fill();
  },

  furn_bench(ctx, x, y) {
    // Seat
    ctx.fillStyle = "#8D6E63";
    ctx.fillRect(x + 2, y + 16, 28, 6);
    // Back
    ctx.fillRect(x + 2, y + 8, 28, 4);
    // Legs
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(x + 4, y + 22, 4, 8);
    ctx.fillRect(x + 24, y + 22, 4, 8);
    // Back supports
    ctx.fillRect(x + 4, y + 8, 3, 10);
    ctx.fillRect(x + 25, y + 8, 3, 10);
  },
};

// ---------------------------------------------------------------------------
// Crop sprites (4 growth stages)
// ---------------------------------------------------------------------------

export function drawCrop(
  ctx: CanvasRenderingContext2D,
  cropType: string,
  stage: number,
  x: number,
  y: number,
) {
  const color = CROP_COLORS[cropType] ?? { stem: "#4CAF50", fruit: "#FF5722" };

  if (stage === 0) {
    // Planted: dirt mound with seed
    ctx.fillStyle = "#6D4C41";
    ctx.fillRect(x + 8, y + 22, 16, 6);
    ctx.fillStyle = "#8D6E63";
    ctx.fillRect(x + 12, y + 20, 8, 4);
    ctx.fillStyle = "#A1887F";
    ctx.fillRect(x + 14, y + 22, 4, 2);
  } else if (stage === 1) {
    // Sprout: small green stem
    ctx.fillStyle = color.stem;
    ctx.fillRect(x + 15, y + 16, 2, 10);
    // Tiny leaf
    ctx.fillRect(x + 17, y + 17, 4, 2);
    // Dirt
    ctx.fillStyle = "#6D4C41";
    ctx.fillRect(x + 8, y + 26, 16, 4);
  } else if (stage === 2) {
    // Growing: taller with leaves
    ctx.fillStyle = color.stem;
    ctx.fillRect(x + 15, y + 10, 2, 16);
    // Leaves
    ctx.fillRect(x + 10, y + 12, 6, 2);
    ctx.fillRect(x + 16, y + 16, 6, 2);
    // Small fruit hints
    ctx.fillStyle = color.fruit;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x + 10, y + 10, 4, 3);
    ctx.globalAlpha = 1;
    // Dirt
    ctx.fillStyle = "#6D4C41";
    ctx.fillRect(x + 8, y + 26, 16, 4);
  } else {
    // Ready: full plant with fruit
    ctx.fillStyle = color.stem;
    ctx.fillRect(x + 15, y + 8, 2, 18);
    // Leaves
    ctx.fillRect(x + 8, y + 12, 8, 2);
    ctx.fillRect(x + 16, y + 14, 8, 2);
    ctx.fillRect(x + 10, y + 18, 6, 2);
    // Fruits
    ctx.fillStyle = color.fruit;
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 22, y + 12, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 12, y + 18, 2, 0, Math.PI * 2);
    ctx.fill();
    // Dirt
    ctx.fillStyle = "#6D4C41";
    ctx.fillRect(x + 8, y + 26, 16, 4);
  }
}

const CROP_COLORS: Record<string, { stem: string; fruit: string }> = {
  tomato: { stem: "#4CAF50", fruit: "#F44336" },
  corn: { stem: "#4CAF50", fruit: "#FDD835" },
  pumpkin: { stem: "#4CAF50", fruit: "#FF9800" },
  sunflower: { stem: "#4CAF50", fruit: "#FFEB3B" },
  strawberry: { stem: "#4CAF50", fruit: "#E91E63" },
  carrot: { stem: "#4CAF50", fruit: "#FF7043" },
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { TILE, HALF };
